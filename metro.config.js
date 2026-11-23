const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const shims = {
  "next/navigation": path.resolve(__dirname, "src/shims/next-navigation.ts"),
  "next/link": path.resolve(__dirname, "src/shims/next-link.tsx"),
  "next/image": path.resolve(__dirname, "src/shims/next-image.tsx"),
  sonner: path.resolve(__dirname, "src/shims/sonner.ts"),
  "lucide-react": path.resolve(__dirname, "src/shims/lucide-react.ts"),
};

const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (shims[moduleName]) {
    return {
      filePath: shims[moduleName],
      type: "sourceFile",
    };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
