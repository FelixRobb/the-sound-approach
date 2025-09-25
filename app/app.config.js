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
            useExoplayerDash: false,
            useExoplayerIMA: false
          }
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            resolutions: {
              // Force consistent Media3 versions to prevent duplicate classes
              "androidx.media3:media3-exoplayer": "1.2.1",
              "androidx.media3:media3-exoplayer-dash": "1.2.1",
              "androidx.media3:media3-ui": "1.2.1",
              "androidx.media3:media3-common": "1.2.1",
              "androidx.media3:media3-session": "1.2.1",
              "androidx.media3:media3-datasource": "1.2.1",
              "androidx.media3:media3-exoplayer-hls": "1.2.1",
              "androidx.media3:media3-exoplayer-rtsp": "1.2.1",
              "androidx.media3:media3-exoplayer-smoothstreaming": "1.2.1"
            },
            // Enable ProGuard to handle duplicate class removal
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            proguardMinifyEnabled: true,
            // Add dependency exclusions to prevent conflicts (based on real developer solutions)
            packagingOptions: {
              pickFirst: [
                "**/libc++_shared.so",
                "**/libjsc.so"
              ],
              exclude: [
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/license.txt",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt",
                "META-INF/notice.txt",
                "META-INF/ASL2.0"
              ]
            },
            // Force exclude conflicting ExoPlayer modules (proven solution from other developers)
            configurations: {
              all: {
                exclude: [
                  "com.google.android.exoplayer:exoplayer-core",
                  "com.google.android.exoplayer:exoplayer-dash",
                  "com.google.android.exoplayer:exoplayer-hls"
                ]
              }
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