const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

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
    assetBundlePatterns: [
      "**/*"
    ],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
      dark: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#121212"
      }
    },
    ios: {
      requireFullScreen: true,
      supportsTablet: true,
      infoPlist: {
        UIBackgroundModes: [
          "audio"
        ],
        UIViewControllerBasedStatusBarAppearance: true,
        ITSAppUsesNonExemptEncryption: false,
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight"
        ]
      },
      bundleIdentifier: IS_DEV 
        ? "com.robbfelix.soundapproachapp.dev" 
        : IS_PREVIEW 
        ? "com.robbfelix.soundapproachapp.preview" 
        : "com.robbfelix.soundapproachapp"
    },
    android: {
      permissions: [
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      blockedPermissions: [
        "android.permission.RECORD_AUDIO"
      ],
      package: IS_DEV 
        ? "com.robbfelix.soundapproachapp.dev" 
        : IS_PREVIEW 
        ? "com.robbfelix.soundapproachapp.preview" 
        : "com.robbfelix.soundapproachapp"
    },
    plugins: [
      "expo-font",
      "expo-audio",
      [
        "expo-screen-orientation",
        {
          initialOrientation: "PORTRAIT_UP"
        }
      ],
      [
        "react-native-video",
        {
          enableNotificationControls: true,
          androidExtensions: {
            useExoplayerRtsp: false,
            useExoplayerSmoothStreaming: false,
            useExoplayerHls: false,
            useExoplayerDash: false
          }
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            packagingOptions: {
              pickFirst: [
                "**/androidx/media3/exoplayer/dash/DashMediaSource$Factory.dex",
                "**/androidx/media3/exoplayer/dash/DashMediaSource$Factory.class"
              ]
            }
          }
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "3d115900-9fb5-46eb-871d-3a693480d059"
      }
    }
  }
};