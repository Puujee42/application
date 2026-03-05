import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Import your global CSS for NativeWind
import "./global.css";

export function App() {
    const ctx = require.context("./app");
    return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);