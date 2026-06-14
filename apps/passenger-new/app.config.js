// Dynamic Expo config — reads secrets from env so we don't commit them.
// Mapbox download token (sk.) comes from EAS secret MAPBOX_DOWNLOAD_TOKEN.
// Public token (pk.) used at runtime is in src/services/mapbox.ts.

module.exports = () => ({
  expo: {
    name: 'YB Ride',
    slug: 'yb-ride-passenger',
    version: '0.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'ybride',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FACC15',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.ybride.passenger',
      // Sign in with Apple capability — required by App Store when the app
      // offers any third-party social sign-in. expo-apple-authentication's
      // config plugin handles entitlements, but ios.usesAppleSignIn here is
      // belt-and-braces so Expo prebuild always adds the capability.
      usesAppleSignIn: true,
      // Google Maps iOS SDK key — same project + key as Android. Needs
      // "Maps SDK for iOS" both enabled in the project AND ticked in the
      // key's API restrictions allowlist (Cloud Console → Credentials).
      config: {
        googleMapsApiKey: 'AIzaSyB4diRGz6N5lrT3Zu_IsgOgtx9sfcc6VI0',
      },
    },
    android: {
      package: 'com.ybride.passenger',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Firebase Android client config — required for FCM push tokens.
      // The file contains both passenger + driver entries since both Android
      // apps live in the same Firebase project; each build picks its own
      // entry by matching package name. Per-environment, NOT a secret, but
      // gitignored to keep multiple env configs out of one branch.
      googleServicesFile: './google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FACC15',
      },
      // Google Maps Android SDK key — drives react-native-maps tile rendering.
      // Same project as the Places/Geocoding key; needs "Maps SDK for Android"
      // enabled on the same key in Google Cloud Console.
      config: {
        googleMaps: {
          apiKey: 'AIzaSyB4diRGz6N5lrT3Zu_IsgOgtx9sfcc6VI0',
        },
      },
      // Foreground-only location: passenger needs GPS while booking but never
      // when the app is backgrounded (driver app handles background).
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
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
        'expo-notifications',
        {
          color: '#FACC15',
          // Drop a custom WAV under ./assets/sounds and add it to `sounds: []`
          // below to override the default Android channel sound.
          sounds: [],
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'YB Ride uses your location to set your pickup and show drivers nearby.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '1ebcd54d-e69c-4fdd-9173-a54b45d86988',
      },
    },
    owner: 'ybride',
  },
});
