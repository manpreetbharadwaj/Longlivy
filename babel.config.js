module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './src' },
        },
      ],
      // No explicit reanimated/worklets plugin here: react-native-reanimated 4.x
      // uses react-native-worklets, and babel-preset-expo (SDK 57) adds the
      // 'react-native-worklets/plugin' automatically — adding it a second time
      // here would duplicate/misorder it.
    ],
  };
};
