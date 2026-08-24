import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { useFrame, useStore } from '@react-three/fiber/native';
import { NormalizedBodyProfile } from './HumanFigureMesh';
import { onboardingAccent, onboardingData } from '../../theme/onboardingTheme';

const ACCENT = new THREE.Color(onboardingAccent);
const DATA_TINT = new THREE.Color(onboardingData);

/**
 * The real, licensed character asset — a MakeHuman/MPFB2 export
 * (CC0-licensed mesh + shape keys, see the onboarding 3D visualizer
 * write-up for the licensing chain). Ships as a placeholder empty GLB
 * (no mesh) until that export is dropped in at this exact path with the
 * same filename — `HumanBodyVisualizer` detects the placeholder (no mesh
 * with morph targets found) and falls back to the procedural mesh
 * automatically, so nothing breaks either side of that swap.
 */
const HUMAN_MODEL_ASSET = require('../../../../../assets/models/human-base.glb');

/**
 * Every normalized profile key mapped to the substrings we'll look for in
 * the export's morph target names (Blender shape keys → glTF
 * `mesh.extras.targetNames` / `morphTargetDictionary`), case-insensitive.
 * This is the path for a *properly re-authored* export — explicit named
 * pole shape keys like "weight_min"/"weight_max" — which the actual first
 * export (see `GENDER_POLE_NAMES` below) turned out not to contain. Kept
 * so a future export lights these up with zero code changes; harmless
 * no-ops against target names that don't match anything.
 */
const NAME_HINTS: Record<keyof NormalizedBodyProfile, string[]> = {
  genderBlend: ['gender'],
  age: ['age'],
  height: ['height'],
  volume: ['weight', 'volume', 'fat'],
  muscle: ['muscle'],
  waist: ['waist'],
};

/**
 * The actual first MakeHuman/MPFB2 export's morph target names, e.g.
 * `$md-universal-$fe-$yn-$av$mu-$av$wg`. These are MakeHuman's internal
 * *macrodetail combinatorial pole* names, Blender-shape-key-compressed
 * (64-char limit) — decoded against MakeHuman's real naming scheme:
 * `$md`=macrodetails, `$fe`/`$ma`=female/male, `$yn`=young, `$av`=average,
 * `$as`/`$ca`/`$af`=asian/caucasian/african, `$mu`=muscle, `$wg`=weight,
 * `$fi`=firmness. Confirmed by parsing the GLB directly (see the
 * onboarding 3D visualizer write-up).
 *
 * Crucially, macrodetails aren't independent single-axis sliders —
 * MakeHuman blends *between* these pole shapes. This export only baked
 * the two gender-only "universal" corners, both pinned to young/average:
 * no age, weight, or muscle *range* exists in this file (every pole
 * present is "young" + "average"), so only gender is genuinely drivable
 * here. age/volume/muscle/waist have nothing to bind to and are left
 * unmapped below until a re-export adds real min/max pole shapes for
 * those attributes (e.g. via MPFB2's Targets tab, or duplicating the mesh
 * at each extreme and joining as shape keys) — see `NAME_HINTS` above for
 * the naming convention that re-export should use.
 */
const GENDER_POLE_NAMES = {
  female: '$md-universal-$fe-$yn-$av$mu-$av$wg',
  male: '$md-universal-$ma-$yn-$av$mu-$av$wg',
} as const;

interface ResolvedMorphIndices extends Partial<Record<keyof NormalizedBodyProfile, number>> {
  /** Present only when both `GENDER_POLE_NAMES` entries are found — gender then drives this complementary pair instead of the single `genderBlend` index. */
  genderPole?: { female: number; male: number };
}

function resolveMorphIndices(dictionary: Record<string, number>): ResolvedMorphIndices {
  const lowerEntries = Object.keys(dictionary).map((name) => ({ name, lower: name.toLowerCase() }));
  const resolved: ResolvedMorphIndices = {};
  (Object.keys(NAME_HINTS) as (keyof NormalizedBodyProfile)[]).forEach((key) => {
    const hints = NAME_HINTS[key];
    const match = lowerEntries.find((e) => hints.some((h) => e.lower.includes(h)));
    if (match) resolved[key] = dictionary[match.name];
  });

  if (dictionary[GENDER_POLE_NAMES.female] != null && dictionary[GENDER_POLE_NAMES.male] != null) {
    resolved.genderPole = { female: dictionary[GENDER_POLE_NAMES.female], male: dictionary[GENDER_POLE_NAMES.male] };
  }

  return resolved;
}

/**
 * Reads the local asset as raw bytes and hands them to `GLTFLoader.parse()`
 * directly, rather than `GLTFLoader.load(uri, ...)`. `.load()` goes through
 * three's `FileLoader`, which is built on `fetch`/`XMLHttpRequest` and
 * `ProgressEvent` — none of which behave like the browser APIs three
 * expects under Hermes/React Native (confirmed on-device: it throws
 * `ReferenceError: Property 'ProgressEvent' doesn't exist` and separately
 * mis-detects the binary GLB as JSON). Reading via `expo-file-system`'s
 * `File.arrayBuffer()` and parsing directly sidesteps that path entirely.
 */
async function loadGltf(moduleAsset: number): Promise<GLTF> {
  const asset = Asset.fromModule(moduleAsset);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const buffer = await new File(uri).arrayBuffer();
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(buffer, '', resolve, reject);
  });
}

interface HumanFigureGltfProps {
  target: NormalizedBodyProfile;
  /** Called once, synchronously with the load outcome, if the asset fails to load OR loads but contains no mesh with usable morph targets (i.e. it's still the placeholder). Parent uses this to fall back to the procedural mesh instead. */
  onUnavailable: () => void;
}

/**
 * Loads the real character asset and drives its morph targets exactly the
 * way `HumanFigureMesh` drives the procedural mesh: per-frame exponential
 * lerp toward the latest normalized profile, no React re-renders on the
 * hot path. Height still applies as a uniform root-scale rather than a
 * "height" morph target, matching section 5 of the spec ("preserve
 * realistic anatomical proportions") — real height morph targets from the
 * export, if present, layer on top rather than replace this.
 */
export const HumanFigureGltf: React.FC<HumanFigureGltfProps> = ({ target, onUnavailable }) => {
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);
  // The zustand store reference itself (stable, doesn't change identity and
  // doesn't subscribe this component to root-state changes) — unlike the
  // `useThree()` hook, which subscribes and re-renders on every change.
  // Read fresh values off it via `.getState()` only when actually needed
  // (see the shader warm-up effect below), never during render.
  const store = useStore();
  const indices = useRef<ResolvedMorphIndices>({});
  /**
   * Centers the mesh's own bounding box on the origin, computed once per
   * load from the real geometry rather than hardcoded — so framing stays
   * correct regardless of how the source file was authored/exported.
   * Centering on the origin (not just grounding the feet at y=0) matters
   * because `@react-three/fiber`'s default camera always calls
   * `camera.lookAt(0, 0, 0)` — content needs to actually sit at the origin
   * to be in frame, camera position alone doesn't aim it.
   */
  const centerOffset = useRef({ x: 0, y: 0, z: 0 });
  const reportedRef = useRef(false);

  const targetRef = useRef(target);
  targetRef.current = target;
  const current = useRef<NormalizedBodyProfile>({ ...target });

  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    let cancelled = false;
    loadGltf(HUMAN_MODEL_ASSET)
      .then((gltf) => {
        if (cancelled) return;
        let found: THREE.Mesh | null = null;
        gltf.scene.traverse((obj) => {
          if (found) return;
          const asMesh = obj as THREE.Mesh;
          if (asMesh.isMesh && asMesh.morphTargetDictionary && Object.keys(asMesh.morphTargetDictionary).length > 0) {
            found = asMesh;
          }
        });
        // Cast explicitly rather than relying on `!found` control-flow
        // narrowing here — `found` is only ever assigned inside the
        // `traverse` closure above, and TS's CFA doesn't thread that
        // reassignment back into this outer scope, which would otherwise
        // (incorrectly) narrow `found` to `never` below.
        const foundMesh = found as THREE.Mesh | null;
        if (!foundMesh) {
          if (!reportedRef.current) {
            reportedRef.current = true;
            onUnavailable();
          }
          return;
        }
        indices.current = resolveMorphIndices(foundMesh.morphTargetDictionary as Record<string, number>);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        centerOffset.current = {
          x: -(box.min.x + box.max.x) / 2,
          y: -(box.min.y + box.max.y) / 2,
          z: -(box.min.z + box.max.z) / 2,
        };

        // The export has no `materials` array at all (confirmed by parsing
        // the GLB directly), so three's GLTFLoader falls back to its
        // default `MeshStandardMaterial` (metalness 1, roughness 1) — with
        // no environment map in this scene, a fully metallic surface has
        // no diffuse response and renders essentially black against the
        // dark onboarding background. Give it the same skin tone/finish as
        // the procedural fallback mesh instead, both for visibility and so
        // the two look like the same character system.
        foundMesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color().lerpColors(DATA_TINT, ACCENT, 0.5),
          roughness: 0.55,
          metalness: 0.06,
          emissive: ACCENT,
          emissiveIntensity: 0.06,
        });

        // TEMPORARY DIAGNOSTIC: strip morph targets to test whether three's
        // DataArrayTexture-based morph encoding (WebGL2 TEXTURE_2D_ARRAY +
        // FloatType — see the investigation write-up) is what's failing on
        // expo-gl, isolated from the earlier (corrupted-simulator) test.
        console.log('[HumanFigureGltf] TRACE DIAG stripping morph targets');
        foundMesh.geometry.morphAttributes = {};
        foundMesh.morphTargetInfluences = undefined;
        foundMesh.morphTargetDictionary = undefined;
        // TEMPORARY DIAGNOSTIC: also swap the real 21,833-vert geometry for
        // a trivial one, keeping the same GLTFLoader-produced mesh/scene
        // hierarchy and `<primitive>` re-parenting — isolates "this
        // specific geometry data" from "the GLTFLoader object graph itself".
        foundMesh.geometry = new THREE.SphereGeometry(0.4, 16, 16);
        console.log('[HumanFigureGltf] TRACE DIAG swapped to trivial sphere geometry');

        setMesh(foundMesh);
        setScene(gltf.scene);
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('[HumanFigureGltf] licensed character asset failed to load, falling back to procedural mesh:', error);
        if (!reportedRef.current) {
          reportedRef.current = true;
          onUnavailable();
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Second shader pre-warm pass, timed to run once the real mesh has
  // actually entered the r3f scene graph — the Canvas `onCreated` warm-up
  // (HumanBodyVisualizer) fires before this async GLTF load resolves, so it
  // only ever compiles the empty scene/lights and misses this mesh's
  // material entirely (confirmed: ~0ms compile time there on cold launch).
  // Reads gl/scene/camera via `store.getState()` rather than the `useThree()`
  // hook deliberately — the hook subscribes this component to every R3F
  // root-state change and re-renders on each one; that extra subscription
  // (not `gl.compile()` itself) was confirmed to destabilize cold-start
  // frame presentation for this already-fragile mount sequence (worse than
  // the original bug: not even the clear color composited). `store` (from
  // `useStore()`) is a stable reference; `.getState()` is a one-off,
  // non-reactive read with no subscription.
  useEffect(() => {
    if (!mesh) return;
    try {
      const { gl, scene: r3fScene, camera } = store.getState();
      gl.compile(r3fScene, camera);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[HumanFigureGltf] shader warm-up (post-mesh-mount) threw:', err);
    }
  }, [mesh, store]);

  // Guards the render loop the same way `GlErrorBoundary` guards initial
  // mount — a thrown error inside `useFrame` runs outside React's own
  // render cycle, so a React error boundary can't catch it; left unguarded,
  // one bad frame would silently kill the whole Canvas's render loop
  // (including sibling content) with nothing in the console to explain why.
  const frameErrorLoggedRef = useRef(false);
  useFrame((_, delta) => {
    try {
      runFrame(delta);
    } catch (err) {
      if (!frameErrorLoggedRef.current) {
        frameErrorLoggedRef.current = true;
        // eslint-disable-next-line no-console
        console.warn('[HumanFigureGltf] frame update failed, character will stop animating:', err);
      }
    }
  });

  function runFrame(delta: number) {
    if (!mesh) return;
    const t = targetRef.current;
    const c = current.current;
    const k = 1 - Math.pow(0.001, delta);
    c.genderBlend += (t.genderBlend - c.genderBlend) * k;
    c.age += (t.age - c.age) * k;
    c.height += (t.height - c.height) * k;
    c.volume += (t.volume - c.volume) * k;
    c.muscle += (t.muscle - c.muscle) * k;
    c.waist += (t.waist - c.waist) * k;

    const influences = mesh.morphTargetInfluences;
    if (influences) {
      const idx = indices.current;
      // Gender drives a complementary pole pair (MakeHuman blends *between*
      // corner shapes, it doesn't have one 0..1 gender morph) rather than a
      // single influence — see `GENDER_POLE_NAMES`.
      if (idx.genderPole) {
        influences[idx.genderPole.female] = 1 - c.genderBlend;
        influences[idx.genderPole.male] = c.genderBlend;
      } else if (idx.genderBlend != null) {
        influences[idx.genderBlend] = c.genderBlend;
      }
      if (idx.age != null) influences[idx.age] = c.age;
      if (idx.volume != null) influences[idx.volume] = c.volume;
      if (idx.muscle != null) influences[idx.muscle] = c.muscle;
      if (idx.waist != null) influences[idx.waist] = c.waist;
      // Height morph target (if the export has one) layers on top of the
      // root-scale approach below rather than replacing it.
      if (idx.height != null) influences[idx.height] = c.height;
    }

    if (groupRef.current) {
      // TEMPORARY DIAGNOSTIC: skip centerOffset/heightScale entirely — fixed
      // identity transform — to rule out the offset (computed from the
      // original mesh's bbox, stale once geometry is swapped) as a confound.
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.scale.set(1, 1, 1);
    }
  }

  // TEMPORARY DIAGNOSTIC: native JSX <mesh> using the loaded geometry/material
  // directly, instead of `<primitive object={scene}>` re-parenting the whole
  // GLTFLoader-produced object graph. Isolates whether `<primitive>` itself
  // is the failure point (see the investigation write-up).
  console.log(
    '[HumanFigureGltf] TRACE RENDER mesh?',
    !!mesh,
    'scene?',
    !!scene,
    'geo.attrs.position.count',
    mesh?.geometry?.attributes?.position?.count,
    'geo.type',
    mesh?.geometry?.type,
    'mat.type',
    Array.isArray(mesh?.material) ? 'array' : mesh?.material?.type
  );
  const content = useMemo(() => (mesh ? <mesh geometry={mesh.geometry} material={mesh.material} /> : null), [mesh]);

  if (!scene) return null;
  // TEMPORARY DIAGNOSTIC: skip the wrapping <group ref> entirely — render
  // content as a direct child of whatever HumanFigureGltf's own parent is.
  return content;
};
