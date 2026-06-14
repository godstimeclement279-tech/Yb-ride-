module.exports = () => ({
  expo: {
    name: 'YB Ride Driver',
    slug: 'yb-ride-driver',
    version: '0.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'ybridedriver',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FACC15',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.ybride.driver',
      // Google Maps iOS SDK key — same project + key as Android, same key
      // as passenger app. Needs "Maps SDK for iOS" enabled + ticked in the
      // key's API restrictions allowlist.
      config: {
        googleMapsApiKey: 'AIzaSyB4diRGz6N5lrT3Zu_IsgOgtx9sfcc6VI0',
      },
      infoPlist: {
        // Both "WhenInUse" and "Always" copy are required by App Store review
        // when we ship background location.
        NSLocationWhenInUseUsageDescription:
          'YB Ride needs your location to share your live position with passengers and dispatch while you are online.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'YB Ride needs background location so passengers can keep tracking you while the app is minimized during a trip.',
        NSLocationAlwaysUsageDescription:
          'YB Ride needs background location so passengers can keep tracking you while the app is minimized during a trip.',
        UIBackgroundModes: ['location', 'fetch'],
      },
    },
    android: {
      package: 'com.ybride.driver',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Firebase Android client config — required for FCM push tokens.
      // The file contains both apps' entries; Gradle picks ours by package.
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FACC15',
      },
      // Google Maps Android SDK key — drives react-native-maps tile rendering.
      // Same project + key as passenger; needs "Maps SDK for Android" enabled.
      config: {
        googleMaps: {
          apiKey: 'AIzaSyB4diRGz6N5lrT3Zu_IsgOgtx9sfcc6VI0',
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-build-properties',
        {
          android: {
            // Disable ProGuard + resource shrinker to rule out minification
            // as the source of cold-boot crashes on Android EAS builds.
            enableProguardInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            // Allow plain HTTP for local Firebase emulators / Paystack test
            // callbacks; production endpoints are HTTPS regardless.
            usesCleartextTraffic: true,
          },
        },
      ],
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'YB Ride needs your location to share your live position with passengers and dispatch while you are online.',
          locationAlwaysAndWhenInUsePermission:
            'YB Ride needs background location so passengers can keep tracking you while the app is minimized during a trip.',
          locationAlwaysPermission:
            'YB Ride needs background location so passengers can keep tracking you while the app is minimized during a trip.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
          isIosBackgroundLocationEnabled: true,
        },
      ],
      [
        'expo-notifications',
        {
          color: '#FACC15',
          // Drop a louder WAV at ./assets/sounds/urgent.wav for the
          // "new trip offer" channel, then add 'urgent.wav' here.
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'a3a25638-b256-416f-a6ce-6cfed0f8869d',
      },
    },
    owner: 'ybride',
  },
});
