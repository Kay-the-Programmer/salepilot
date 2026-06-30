---
name: Velocity POS System
colors:
  surface: '#f7fafc'
  surface-dim: '#d7dadc'
  surface-bright: '#f7fafc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f6'
  surface-container: '#ebeef0'
  surface-container-high: '#e5e9eb'
  surface-container-highest: '#e0e3e5'
  on-surface: '#181c1e'
  on-surface-variant: '#434651'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eef1f3'
  outline: '#747782'
  outline-variant: '#c4c6d2'
  surface-tint: '#395ca5'
  primary: '#002b6b'
  on-primary: '#ffffff'
  primary-container: '#1a428a'
  on-primary-container: '#91b1ff'
  inverse-primary: '#b0c6ff'
  secondary: '#9b4500'
  on-secondary: '#ffffff'
  secondary-container: '#ff7f27'
  on-secondary-container: '#612900'
  tertiary: '#1f2f4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#364566'
  on-tertiary-container: '#a4b3da'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001944'
  on-primary-fixed-variant: '#1c448c'
  secondary-fixed: '#ffdbc9'
  secondary-fixed-dim: '#ffb68e'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#763300'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#b7c6ee'
  on-tertiary-fixed: '#091b3a'
  on-tertiary-fixed-variant: '#374667'
  background: '#f7fafc'
  on-background: '#181c1e'
  surface-variant: '#e0e3e5'
typography:
  display-price:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-xl:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  touch-target-min: 48px
  gutter: 16px
  margin-edge: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand personality is **authoritative, energetic, and precise**. Designed for the fast-paced environments of retail and hospitality, the interface prioritizes speed of thought and action. It balances the reliability of a professional tool with the modern vibrancy of a tech-forward solution.

The design style follows **Corporate / Modern** principles with a focus on **functional density**. It utilizes high-contrast color blocks to define functional zones (like the cart vs. the product catalog) and sharp, clean lines to ensure the UI remains legible under various lighting conditions—from bright retail floors to dimly lit bars. The visual mood is one of "calm efficiency," reducing cognitive load for operators through a structured, predictable hierarchy.

## Colors

The palette is anchored by the logo's deep navy and vibrant orange.
- **Primary (Deep Navy):** Used for navigation, structural headers, and primary actions to establish trust and stability.
- **Secondary (Vibrant Orange):** Reserved for "conversion" actions—Checkout, Pay, and New Sale—to guide the eye immediately to the next step in the workflow.
- **Tertiary (Midnight):** Used for text and high-contrast iconography.
- **Backgrounds:** A very light cool gray (`#F4F7F9`) is used for the main canvas to reduce glare, while pure white is used for card surfaces to create subtle lift.
- **Semantic Colors:** Success (Green), Error (Red), and Warning (Amber) are implemented with high saturation for instant recognition during rapid-fire operations.

## Typography

**Hanken Grotesk** is selected for its exceptional legibility and contemporary, sharp terminals which mirror the "bolt" energy in the logo. 

In a POS context, typography is a functional tool. Prices use the `display-price` role to ensure they are readable from a distance for both the operator and customer. Labels use a slightly heavier weight (`500`+) to ensure they don't wash out against colored backgrounds. The system uses a strict vertical rhythm to maintain a sense of order in data-heavy list views.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model for desktop/tablet terminal views, typically structured as a two-pane system: a 12-column grid where 4 columns are dedicated to the "Cart/Transaction" sidebar and 8 columns to the "Product/Numpad" area.

- **Touch-First Philosophy:** Every interactive element adheres to a minimum `48px` touch target to prevent mis-taps during peak hours.
- **Gutters:** A consistent `16px` gutter ensures that even with high density, the UI feels breathable and structured.
- **Mobile Reflow:** On mobile devices, the layout collapses into a single-column stack with the "Cart Summary" pinned to the bottom as a persistent tray.

## Elevation & Depth

This design system uses **Tonal Layers** rather than heavy shadows to maintain a clean, flat aesthetic that doesn't feel dated. 

- **Level 0 (Base):** The main application background in light gray.
- **Level 1 (Cards):** White surfaces with a subtle `1px` border (`#E2E8F0`) to define boundaries.
- **Level 2 (Active Elements):** Elements being interacted with (e.g., a selected product) use a `2px` Primary Navy border instead of a shadow.
- **Overlays:** Modals and "Pay" screens use a `20%` black backdrop blur to focus the operator's attention on the critical completion task.

## Shapes

The shape language is **Soft (0.25rem)**. While the logo features some sharp angles in the lightning bolt, the UI adopts a slightly softened corner to make the interface feel more approachable and modern. 

Button components use the `rounded-lg` (0.5rem) setting to make them feel distinct from the structural containers (cards/panels) which use the base `rounded` (0.25rem) setting. This subtle difference in rounding helps differentiate between "information containers" and "actionable items."

## Components

- **Buttons:** 
    - *Primary:* Navy background, white text. For standard flow actions.
    - *Action:* Orange background, white text. Reserved exclusively for "Checkout" or "Finalize."
    - *Ghost:* Navy outline. For secondary actions like "Add Discount."
- **Product Tiles:** Large, touch-friendly cards with the price anchored to the bottom right in a bold weight. Images should be centered with a subtle background tint.
- **Input Fields:** Large `56px` height for touch entry. Active states use a `2px` orange bottom-border to signal focus.
- **Numpad:** High-contrast grid with large labels. The "0" and "Enter" keys should span multiple grid units for ergonomic ease.
- **Status Chips:** Small, rounded-xl indicators for "Paid," "Pending," or "Refunded" using semantic colors at 15% opacity with 100% opacity text.
- **The Receipt List:** High-density list items with a `1px` divider and "Swipe to Delete" functionality for fast order editing.