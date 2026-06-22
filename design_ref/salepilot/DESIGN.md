---
name: SalePilot
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#3e4944'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#6e7a73'
  outline-variant: '#bdc9c2'
  surface-tint: '#006c50'
  primary: '#00654b'
  on-primary: '#ffffff'
  primary-container: '#008060'
  on-primary-container: '#d6ffeb'
  inverse-primary: '#75d9b3'
  secondary: '#895100'
  on-secondary: '#ffffff'
  secondary-container: '#ffa535'
  on-secondary-container: '#6b3f00'
  tertiary: '#56566d'
  on-tertiary: '#ffffff'
  tertiary-container: '#6f6e86'
  on-tertiary-container: '#f7f4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#92f6cf'
  primary-fixed-dim: '#75d9b3'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513c'
  secondary-fixed: '#ffdcbc'
  secondary-fixed-dim: '#ffb86b'
  on-secondary-fixed: '#2c1700'
  on-secondary-fixed-variant: '#683d00'
  tertiary-fixed: '#e2e0fc'
  tertiary-fixed-dim: '#c6c4df'
  on-tertiary-fixed: '#1a1a2e'
  on-tertiary-fixed-variant: '#45455b'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built to feel like a physical companion for a shop owner—not just another software interface. It leans into a **Modern Tactile** aesthetic that prioritizes warmth, high legibility, and physical reassurance. By moving away from sterile, "cold tech" blues and purples, the system establishes trust and reduces the mental fatigue associated with long shifts at a point of sale.

The visual language combines the efficiency of a high-performance SaaS tool with the approachability of a boutique retail environment. It utilizes soft shadows to suggest depth and "pressable" surfaces, making the digital experience feel as intuitive as handling physical inventory.

- **Human-Centric:** Warm backgrounds and rounded edges create an inviting atmosphere.
- **High-Efficiency:** Information density is carefully managed to ensure fast processing at checkout.
- **Trustworthy:** Deep charcoal headings provide a sense of authority and permanence.

## Colors

The palette is anchored in organic, grounded tones that avoid the glare of pure white.

- **Primary (SalePilot Green):** The engine of the UI. Used for the most important actions: "Complete Sale," "Add to Cart," and active selection states.
- **Secondary (Amber/Gold):** A functional accent used to highlight milestones (e.g., "Daily Goal Reached") or urgent states like "Low Stock."
- **Neutrals (Warm Off-White & Gray):** These form the "canvas." Off-white is used for the primary background, while the warm gray creates subtle distinction for sidebar menus and inactive surface layers.
- **Deep Charcoal:** Reserved for typography and critical UI borders to ensure maximum contrast and readability under various lighting conditions.

## Typography

**Plus Jakarta Sans** was chosen for its modern, friendly, and highly legible characteristics. Its slightly rounded terminals echo the approachable brand personality while maintaining a clean, professional structure suitable for data-heavy POS screens.

- **Weight Usage:** Use Bold (700) for prices and primary headings to ensure they are scan-able from a distance. Use Medium (500/600) for labels and interactive elements.
- **Numeric Clarity:** Since this is a POS app, specific attention must be paid to numbers. The system uses the "price-display" role for the total amount due, ensuring it is the most prominent element on the checkout screen.
- **Hierarchy:** Maintain a clear distinction between product names (Headline MD) and their descriptions or SKUs (Label SM).

## Layout & Spacing

The layout is designed for **High-Frequency Tactile Interaction**. This means touch targets are larger than standard web layouts to prevent "fat-finger" errors during a busy checkout process.

- **Grid System:** A 12-column fluid grid is used for desktop/tablet views. On mobile, the grid collapses to a single column, with the "Cart" usually anchored as a slide-up sheet or a persistent footer.
- **The 8px Rhythm:** All padding and margins scale by 8px. This ensures a consistent visual rhythm and makes it easier to align physical hardware (like scanners) with the digital interface logic.
- **Safe Zones:** A minimum margin of 24px is maintained around the screen edges to ensure navigation elements aren't obscured by protective tablet cases.

## Elevation & Depth

This design system uses **Ambient Shadows** and **Tonal Layering** to create a sense of physical hierarchy.

- **Surface Levels:** 
  - **Level 0 (Background):** Warm Off-White (#F9F7F4).
  - **Level 1 (Cards/Sidebar):** Warm Gray (#F2EFE9) or White with a very soft outline.
  - **Level 2 (Modals/Popovers):** Pure White with a diffused shadow (15% opacity, 20px blur, 4px Y-offset).
- **Interactive Depth:** Buttons should appear slightly raised. When pressed, the shadow should decrease, mimicking the physical haptic feedback of a button being depressed.
- **Subtle Outlines:** In addition to shadows, use a 1px border (#1A1A2E at 5% opacity) for cards to maintain crisp definition on lower-quality tablet displays.

## Shapes

The shape language is consistently **Rounded**, reinforcing the "Human" brand personality.

- **Components:** Standard buttons and input fields use a `0.5rem` (8px) radius. 
- **Product Cards:** Large item cards use `1rem` (16px) to feel friendly and distinct from the background.
- **Interactive Feedback:** Focus states should follow the container's radius, with a 2px offset for clarity.
- **Pills:** Use pill-shapes (rounded-full) exclusively for status indicators like "Paid," "Pending," or "Refunded."

## Components

- **Buttons:** 
  - **Primary:** SalePilot Green background, white text. Large vertical padding (16px+) for easy tapping.
  - **Secondary:** Transparent with a 2px Deep Charcoal border.
- **Input Fields:** 
  - Background: White. Border: 1px Warm Gray. On focus, the border changes to SalePilot Green with a soft glow. 
  - Labels are always persistent (not floating) to ensure clarity during fast entry.
- **Product Chips:** Small, tappable tags for categories or modifiers. Use the Warm Gray background with Label-LG typography.
- **Data Lists:** For the shopping cart. High-contrast price on the right, product name on the left. Includes a subtle divider between rows to keep the eye aligned.
- **The "Big Green Button":** The final "Pay" or "Charge" action should be a full-width persistent bar at the bottom of the cart, utilizing the Primary Green color.
- **Feedback Toasts:** Use the Amber/Gold accent for non-critical alerts (e.g., "Paper low") and Green for success states.