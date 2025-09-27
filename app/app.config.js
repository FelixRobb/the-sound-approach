const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

export default {
  expo: {
    name: IS_DEV
      ? "The Sound Approach (Dev)"
      : IS_PREVIEW
        ? "The Sound Approach (Preview)"
        : "The Sound Approach",
    slug: "sound-approach-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    assetBundlePatterns: ["**/*"],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#121212",
      },
    },
    ios: {
      requireFullScreen: true,
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: ["audio"],
        UIViewControllerBasedStatusBarAppearance: true,
        ITSAppUsesNonExemptEncryption: false,
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight",
        ],
      },
      bundleIdentifier: IS_DEV
        ? "com.robbfelix.soundapproachapp.dev"
        : IS_PREVIEW
          ? "com.robbfelix.soundapproachapp.preview"
          : "com.robbfelix.soundapproachapp",
    },
    android: {
      permissions: ["android.permission.MODIFY_AUDIO_SETTINGS"],
      blockedPermissions: ["android.permission.RECORD_AUDIO"],
      package: IS_DEV
        ? "com.robbfelix.soundapproachapp.dev"
        : IS_PREVIEW
          ? "com.robbfelix.soundapproachapp.preview"
          : "com.robbfelix.soundapproachapp",
    },
    plugins: [
      "expo-font",
      "expo-audio",
      [
        "expo-screen-orientation",
        {
          initialOrientation: "PORTRAIT_UP",
        },
      ],
      [
        // CORRECTED SECTION:
        // Remove the 'androidExtensions' block. Let the library use its default
        // ExoPlayer implementation. We will solve the version conflict below.
        "react-native-video",
        {
          enableNotificationControls: true,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            // This forces the HIGHEST required version (1.8.0 from expo-audio)
            // for all media3 modules. This will override the 1.4.1 requested
            // by react-native-video. it works well. don't change it.
            resolutions: {
              "androidx.media3:media3-common": "1.8.0",
              "androidx.media3:media3-datasource": "1.8.0",
              "androidx.media3:media3-decoder": "1.8.0",
              "androidx.media3:media3-exoplayer": "1.8.0",
              "androidx.media3:media3-exoplayer-dash": "1.8.0",
              "androidx.media3:media3-exoplayer-hls": "1.8.0",
              "androidx.media3:media3-exoplayer-ima": "1.8.0",
              "androidx.media3:media3-exoplayer-rtsp": "1.8.0",
              "androidx.media3:media3-exoplayer-smoothstreaming": "1.8.0",
              "androidx.media3:media3-extractor": "1.8.0",
              "androidx.media3:media3-session": "1.8.0",
              "androidx.media3:media3-ui": "1.8.0",
            },
            // Your packaging options are fine to keep.
            packagingOptions: {
              pickFirst: ["**/libc++_shared.so", "**/libjsc.so"],
              exclude: [
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/license.txt",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt",
                "META-INF/notice.txt",
                "META-INF/ASL2.0",
              ],
            },
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "3d115900-9fb5-46eb-871d-3a693480d059",
      },
    },
  },
};
