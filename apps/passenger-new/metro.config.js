// Metro config for Expo + pnpm workspace.
// https://docs.expo.dev/guides/monorepos/

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Append (don't replace) so Expo's defaults are preserved.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Force web-platform variants (.web.tsx, .web.ts, ...) to resolve before
// the plain .tsx files. Lets us ship a Map.web.tsx shim that runs in the
// browser preview while the native Map.tsx uses @rnmapbox/maps.
config.resolver.sourceExts = Array.from(
  new Set([
    'web.tsx',
    'web.ts',
    'web.jsx',
    'web.js',
    ...config.resolver.sourceExts,
  ]),
);

module.exports = config;
