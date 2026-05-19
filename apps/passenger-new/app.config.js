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
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1E3A8A',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.ybride.passenger',
    },
    android: {
      package: 'com.ybride.passenger',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1E3A8A',
      },
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
        'expo-notifications',
        {
          color: '#1E3A8A',
          // Drop a custom WAV under ./assets/sounds and add it to `sounds: []`
          // below to override the default Android channel sound.
          sounds: [],
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '388b16e3-b2cd-40f6-9012-bb4905556202',
      },
    },
    owner: 'geetees',
  },
});
