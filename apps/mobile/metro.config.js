const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get the default Expo Metro config
const config = getDefaultConfig(__dirname);

// Path to the monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro resolve modules from the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Enable symlinks resolution
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @tripflow/shared package
  if (moduleName === '@tripflow/shared') {
    const sharedPath = path.resolve(monorepoRoot, 'packages/shared/index.ts');
    return {
      filePath: sharedPath,
      type: 'sourceFile',
    };
  }

  // Use default resolver for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
