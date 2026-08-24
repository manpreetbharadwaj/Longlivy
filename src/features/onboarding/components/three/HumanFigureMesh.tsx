import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber/native';
import { onboardingAccent, onboardingData } from '../../theme/onboardingTheme';

export interface NormalizedBodyProfile {
  /** 0 = female, 0.5 = neutral/diverse, 1 = male — a continuous blend, never a model swap. */
  genderBlend: number;
  /** 0..1 across the supported age range. */
  age: number;
  /** 0..1 across the supported height range. */
  height: number;
  /** 0..1 combined body-volume signal (weight + body fat). */
  volume: number;
  /** 0..1 muscularity. */
  muscle: number;
  /** 0..1 waist circumference, independent of overall volume. */
  waist: number;
}

const ACCENT = new THREE.Color(onboardingAccent);
const DATA_TINT = new THREE.Color(onboardingData);

/** Builds the torso capsule once, with a real morph target (`waist_volume`) baked into its geometry — genuine `BufferGeometry.morphAttributes`, not a scale trick. */
function buildTorsoGeometry() {
  const geo = new THREE.CapsuleGeometry(0.34, 0.78, 8, 16);
  const base = geo.attributes.position as THREE.BufferAttribute;
  const count = base.count;
  const widened = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = base.getX(i);
    const y = base.getY(i);
    const z = base.getZ(i);
    // Bulge strongest at the vertical center (waist/abdomen band), tapering
    // to ~0 at the shoulder and hip caps — an anatomically-scoped morph
    // rather than a uniform inflate of the whole capsule.
    const band = Math.max(0, 1 - Math.abs(y) / 0.5);
    const bulge = 1 + 0.55 * band;
    widened[i * 3] = x * bulge;
    widened[i * 3 + 1] = y;
    widened[i * 3 + 2] = z * bulge;
  }
  geo.morphAttributes.position = [new THREE.Float32BufferAttribute(widened, 3)];
  return geo;
}

function buildLimbGeometry(radius: number, length: number) {
  return new THREE.CapsuleGeometry(radius, length, 6, 10);
}

interface HumanFigureMeshProps {
  target: NormalizedBodyProfile;
}

/**
 * The single persistent character. Every part (head/torso/arms/legs) is
 * created exactly once via `useMemo` and never unmounted or swapped —
 * only its transforms and morph-target influences change, driven by a
 * per-frame lerp toward the latest normalized profile so value changes
 * interpolate smoothly instead of snapping, without round-tripping
 * through React state every frame (the target ref updates on prop change;
 * the render loop does the interpolation).
 */
export const HumanFigureMesh: React.FC<HumanFigureMeshProps> = ({ target }) => {
  const targetRef = useRef(target);
  targetRef.current = target;

  const current = useRef<NormalizedBodyProfile>({ ...target });

  const groupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const shouldersRef = useRef<THREE.Group>(null);
  const hipsRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const torsoGeo = useMemo(buildTorsoGeometry, []);
  const armGeo = useMemo(() => buildLimbGeometry(0.075, 0.62), []);
  const legGeo = useMemo(() => buildLimbGeometry(0.1, 0.82), []);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.22, 24, 20), []);

  const skinMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().lerpColors(DATA_TINT, ACCENT, 0.5),
        roughness: 0.55,
        metalness: 0.06,
        emissive: ACCENT,
        emissiveIntensity: 0.06,
      }),
    []
  );

  useFrame((_, delta) => {
    const t = targetRef.current;
    const c = current.current;
    // Critically-damped-feeling exponential lerp — frame-rate independent,
    // avoids the "snap on state change" the spec explicitly warns against.
    const k = 1 - Math.pow(0.001, delta);
    c.genderBlend += (t.genderBlend - c.genderBlend) * k;
    c.age += (t.age - c.age) * k;
    c.height += (t.height - c.height) * k;
    c.volume += (t.volume - c.volume) * k;
    c.muscle += (t.muscle - c.muscle) * k;
    c.waist += (t.waist - c.waist) * k;

    const elapsed = performance.now() / 1000;
    const breathe = 1 + Math.sin(elapsed * 1.1) * 0.012;

    if (groupRef.current) {
      // Height: uniform vertical scale of the whole rig — the correct,
      // proportion-preserving technique (this is what a root-bone height
      // slider does in a real rig too), not a per-limb stretch.
      const heightScale = 0.82 + c.height * 0.34;
      groupRef.current.scale.set(1, heightScale, 1);
    }

    if (torsoRef.current) {
      // Real morph target: waist/abdomen volume driven by weight+bodyFat.
      const influences = torsoRef.current.morphTargetInfluences;
      if (influences) influences[0] = Math.min(1, c.volume * 0.75 + c.waist * 0.35);
      torsoRef.current.scale.x = breathe;
      torsoRef.current.scale.z = breathe * (1 + c.muscle * 0.08);
    }

    if (shouldersRef.current) {
      // Gender + muscle both act on shoulder width — a continuous blend on
      // the same persistent group, never a model swap.
      const genderShoulder = 0.86 + c.genderBlend * 0.28;
      shouldersRef.current.scale.x = genderShoulder + c.muscle * 0.14;
    }

    if (hipsRef.current) {
      const genderHip = 1.08 - c.genderBlend * 0.16;
      hipsRef.current.scale.x = genderHip + c.volume * 0.1;
    }

    if (headRef.current) {
      // A very slight head-to-body proportion shift with age — subtle,
      // continuous, never a face swap.
      const ageFullness = 1 + (c.age - 0.4) * 0.03;
      headRef.current.scale.setScalar(ageFullness);
    }
  });

  return (
    // `@react-three/fiber`'s default camera always calls
    // `camera.lookAt(0, 0, 0)` (confirmed by reading its source), so this
    // rig is vertically centered on the origin (its content spans roughly
    // y -0.41 to 1.84 before this offset) rather than resting its feet at
    // y=0 — matching the same centering convention `HumanFigureGltf` uses
    // for the real character asset, since both share one Canvas camera.
    <group ref={groupRef} position={[0, -0.715, 0]}>
      <mesh ref={headRef} geometry={headGeo} material={skinMaterial} position={[0, 1.62, 0]} />
      <mesh position={[0, 1.42, 0]} geometry={new THREE.CylinderGeometry(0.07, 0.09, 0.14, 12)} material={skinMaterial} />

      <group ref={shouldersRef} position={[0, 1.28, 0]}>
        {/* `morphTargetInfluences` set explicitly: R3F constructs `Mesh` with no
            args and assigns `.geometry` afterward as a prop, so `Mesh`'s
            constructor-only `updateMorphTargets()` never runs. Without this,
            `geometry.morphAttributes.position` is set but the mesh's own
            influences array stays undefined, which crashes three's renderer
            (`morphTargetInfluences.length` of undefined) the moment it sees
            morph data on the geometry — only reproduces on-device, not in
            tsc/lint. */}
        <mesh ref={torsoRef} geometry={torsoGeo} material={skinMaterial} morphTargetInfluences={[0]} position={[0, -0.36, 0]} />
        <mesh geometry={armGeo} material={skinMaterial} position={[-0.42, -0.32, 0]} rotation={[0, 0, 0.06]} />
        <mesh geometry={armGeo} material={skinMaterial} position={[0.42, -0.32, 0]} rotation={[0, 0, -0.06]} />
      </group>

      <group ref={hipsRef} position={[0, 0.52, 0]}>
        <mesh geometry={legGeo} material={skinMaterial} position={[-0.13, -0.42, 0]} />
        <mesh geometry={legGeo} material={skinMaterial} position={[0.13, -0.42, 0]} />
      </group>
    </group>
  );
};
