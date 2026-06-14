// Metro config for Expo + pnpm workspace.
// https://docs.expo.dev/guides/monorepos/

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Metro already does platform-aware resolution: on Android it tries
// `.android.tsx` then `.native.tsx` then `.tsx`; on web it tries
// `.web.tsx` then `.tsx`. So Map.web.tsx is picked automatically when
// platform === 'web' WITHOUT us touching sourceExts.
//
// The previous version of this file prepended 'web.tsx' etc. to
// sourceExts which broke Android: Metro started preferring `.web.tsx`
// files on every platform, so Expo's own DevLoadingView.web.tsx loaded
// on Android and crashed at render with
//   "View config getter callback for component `style` must be a function"
// because the web file renders an HTML `<style>` tag that isn't a
// valid RN component. Removed the override; do not re-add it.

module.exports = config;
