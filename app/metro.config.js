// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolution for 'expo-av' and 'uuid' which were previously in modulePathProxyList
config.resolver.extraNodeModules = {
  "expo-av": require.resolve("expo-av"),
  uuid: require.resolve("react-native-uuid"),
};

module.exports = config;
