export default (api) => {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          allowlist: null,
          blocklist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      "react-native-worklets/plugin",
    ],
  };
};
