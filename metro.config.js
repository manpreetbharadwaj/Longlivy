// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 3D model formats used by the onboarding HumanBodyVisualizer (see
// src/features/onboarding/components/three) aren't in Expo's default asset
// extension list — without this, `require('*.glb')` fails to bundle.
config.resolver.assetExts.push('glb', 'gltf', 'bin');

module.exports = config;
