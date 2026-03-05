# MASTER DESIGN SYSTEM: Luminous Gold Sanctuary

## Overview
A warm, radiant, sanctuary-inspired design system for React Native (Expo) with NativeWind. Every surface glows with warmth; gold accents feel precious, not garish. Glassmorphism + serif typography + ambient particles create a meditative, luxurious feel.

## 1. Color Palette

**Primary Gold:**
- `#D4A020` — Primary Gold (buttons, icons, accents)
- `#B8820A` — Deep Gold (secondary, inactive states)
- `#FFD060` — Glow (highlights, particle effects)

**Background & Surface:**
- `#FFFBF0` — Warm Ivory (main background)
- `rgba(255,251,240,0.55)` — Glass surface (cards with blur)
- `#FFF8E8` — Opaque surface fallback
- `rgba(200,146,10,0.18)` — Glass border

**Text:**
- `#1A1000` — Deep Bronze (primary text)
- `#5C4A1E` — Muted Bronze (subtitles)
- `#8B7340` — Light Bronze (placeholders)

## 2. Typography
- **Headings:** `Georgia` (serif) — luxurious, sanctuary feel.
- **Body:** System font (Inter/SF Pro equivalent) for legibility.
- **Scale:** xs(12) → sm(14) → base(16) → lg(18) → xl(20) → 2xl(24) → 3xl(30) → 4xl(36)

## 3. UI Components

### LuminousBtn (Buttons)
- **Primary:** LinearGradient from `#D4A020` → `#B8820A`, Deep Bronze text `#1A1000`, bottom glow shadow (`shadowColor: #FFD060`, offset y:6, radius:12).
- **Secondary:** Glassmorphism surface with gold border.
- **Ghost/Outline:** Transparent with Deep Gold text.
- **All:** Haptic feedback on press. Minimum 48px touch target.

### Glassmorphism Cards
- `backgroundColor: rgba(255,251,240,0.55)`
- `borderRadius: 24`
- `border: 1px solid rgba(200,146,10,0.18)`
- `backdropFilter: blur(20px)` (BlurView on native)
- Soft shadow: `shadowColor: #B8820A`, opacity 0.08

### Gold Particles
- 15–20 tiny gold dots (`#FFD060` / `#D4A020`) floating upward with random drift.
- `pointerEvents: 'none'`, full-screen overlay.
- Uses `react-native-reanimated` shared values for 60fps performance.

### Aura Orb
- Breathing glow circle: radial gradient (gold → transparent).
- Scales 0.85 → 1.15 over 4s with `withRepeat(withTiming(...))`.
- Placed behind hero/header sections.

## 4. UX Guidelines
- **Haptics:** `Haptics.impactAsync(Light)` on every interactive element.
- **Snappiness:** Animations under 200ms for interactions, 4s for ambient effects.
- **Touch Targets:** Minimum 48×48px.
- **Font:** Georgia for all headings, System for body.

## 5. Anti-Patterns 🚫
- **Pure White `#FFFFFF` backgrounds** — Use `#FFFBF0` instead.
- **Pure Black `#000000`** — Use `#1A1000` Deep Bronze.
- **No haptic feedback on buttons** — Always include.
- **Hard shadows** — Use soft gold-tinted shadows only.
