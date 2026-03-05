// 1. Force the router root to be "./app"
process.env.EXPO_ROUTER_APP_ROOT = "./app";

module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",
        ],
        plugins: [
            // 2. DO NOT include "expo-router/babel" here for SDK 50+

            // Reanimated must be listed last
            "react-native-reanimated/plugin",
        ],
    };
};