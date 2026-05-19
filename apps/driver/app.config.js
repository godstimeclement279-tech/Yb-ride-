module.exports = () => ({
  expo: {
    name: 'YB Ride Driver',
    slug: 'yb-ride-driver',
    version: '0.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'ybridedriver',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1E3A8A',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.ybride.driver',
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
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1E3A8A',
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
          color: '#1E3A8A',
          // Drop a louder WAV at ./assets/sounds/urgent.wav for the
          // "new trip offer" channel, then add 'urgent.wav' here.
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '3be49560-a223-440e-acb2-90f5e6d45e3b',
      },
    },
    owner: 'geetees',
  },
});
