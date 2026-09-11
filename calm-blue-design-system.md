# Calm Blue — AI-Ready Design System

## Design Direction

**Style:** minimal, calm, clean, airy, modern, elegant, refined, slightly editorial.

The interface should communicate calmness, trust, clarity, freshness, simplicity, and sophistication.

Avoid neon/cyberpunk blue, excessive gradients, heavy shadows, excessive rounded cards, clutter, glassmorphism overload, generic SaaS styling, and unnecessary decoration.

---

## Exact Color Palette

**Do not substitute these colors with similar shades.**

| Name | HEX | RGB | Usage |
|---|---|---|---|
| Sky Blue | `#90D5FF` | `144, 213, 255` | Light backgrounds, soft highlights, large calm areas |
| Bright Blue | `#57B9FF` | `87, 185, 255` | Primary buttons, links, active states, main accents |
| Dusty Blue | `#77B1D4` | `119, 177, 212` | Secondary accents, supporting UI, icons |
| Slate Blue | `#517891` | `81, 120, 145` | Dark sections, footer, strong text, depth |

### Color hierarchy

```text
#517891  → darkest / strongest
#57B9FF  → bright primary blue
#77B1D4  → muted medium blue
#90D5FF  → lightest sky blue
```

### Recommended balance

```text
White / neutral space: 50–70%
#90D5FF:               10–20%
#57B9FF:                5–15%
#77B1D4:                5–10%
#517891:                5–15%
```

The design should feel airy rather than saturated.

---

## Typography

### Required Font

**Tenor Sans**

Use Tenor Sans as the primary typeface throughout the interface.

Tenor Sans should retain its elegant, lightweight, modern, editorial character.

Use it for:

- Page titles
- Headings
- Navigation
- Buttons
- Labels
- Body text
- Captions
- UI controls
- Numbers
- Section headings

Do not replace it with Inter, Roboto, Poppins, Montserrat, Arial, Open Sans, or another font unless explicitly instructed.

### Typography personality

- Elegant
- Minimal
- Sophisticated
- Lightweight
- Modern
- Editorial
- Refined
- Calm

Create hierarchy primarily through font size, line height, spacing, and layout rather than excessive boldness.

---

## Typography Hierarchy

Example:

```text
MAIN PAGE TITLE
Tenor Sans
Large, clean, regular/light appearance

Section Heading
Tenor Sans
Medium-large, clean appearance

Body Text
Tenor Sans
Comfortable reading size

Small Label
Tenor Sans
Smaller size with controlled letter spacing
```

Prefer generous line height, comfortable reading width, moderate letter spacing, and strong whitespace.

Avoid extremely bold typography, tight line spacing, excessive uppercase text, decorative fonts, and multiple unrelated typefaces.

---

## Layout

Prioritize:

- Generous whitespace
- Clean alignment
- Strong hierarchy
- Simple grids
- Comfortable spacing
- Clear visual rhythm
- Easy scanning
- Minimal visual noise

Preferred rhythm:

```text
Whitespace
    ↓
Large typography
    ↓
Content
    ↓
Soft blue accent
    ↓
Whitespace
```

---

## UI Guidance

### Primary Button

```text
Background: #57B9FF
Text:       #FFFFFF
Font:       Tenor Sans
```

### Secondary Button

```text
Background: #90D5FF
Text:       #517891
Font:       Tenor Sans
```

### Dark Button

```text
Background: #517891
Text:       #FFFFFF
Font:       Tenor Sans
```

### Cards

Prefer:

```text
Background: #90D5FF or #FFFFFF
Text:       #517891
Accent:     #57B9FF
```

Keep cards light, spacious, and understated. Do not make every card heavily rounded or heavily shadowed.

### Links

```text
Color: #57B9FF
Font: Tenor Sans
```

Hover states may transition toward `#517891`.

---

## Accessibility

Never communicate information through color alone.

Use text, icons, borders, shapes, labels, or position in addition to color.

Pay special attention to contrast when using `#90D5FF` and `#57B9FF` as backgrounds. Use dark text such as `#517891` when light text does not provide sufficient contrast.

Keyboard focus states must always be clearly visible.

---

## Responsive Design

Support:

- Mobile
- Tablet
- Laptop
- Desktop
- Large screens

Use a mobile-first approach.

On small screens:

- Reduce spacing proportionally
- Preserve readable typography
- Stack columns when necessary
- Prevent horizontal overflow
- Keep controls touch-friendly
- Preserve the calm, spacious appearance

Do not simply shrink the desktop layout.

---

## CSS Tokens

```css
:root {
  --color-sky-blue: #90D5FF;
  --color-bright-blue: #57B9FF;
  --color-dusty-blue: #77B1D4;
  --color-slate-blue: #517891;

  --color-white: #FFFFFF;
  --color-off-white: #FAFCFF;

  --font-primary: "Tenor Sans", sans-serif;
}
```

---

## AI Implementation Rules

1. Use the exact four HEX colors.
2. Never replace them with approximate shades.
3. Use Tenor Sans as the primary font.
4. Preserve Tenor Sans's elegant, lightweight character.
5. Use generous whitespace.
6. Keep the interface calm and uncluttered.
7. Use `#57B9FF` for primary actions and accents.
8. Use `#90D5FF` for soft backgrounds and highlights.
9. Use `#77B1D4` for secondary accents.
10. Use `#517891` for dark areas and strong text.
11. Avoid excessive gradients.
12. Avoid heavy shadows.
13. Avoid excessive rounded UI.
14. Avoid unnecessary decoration.
15. Do not introduce unnecessary colors.
16. Make the design responsive.
17. Maintain accessible contrast.
18. Maintain visible keyboard focus.
19. Keep typography spacious and readable.
20. Maintain a premium, minimal, editorial visual character.

---

## Copy-Paste Prompt for an AI Coding/Design Agent

> Use the **Calm Blue** design system for the entire interface. The visual style is minimal, calm, clean, airy, modern, elegant, refined, and slightly editorial. Use these exact colors without substitution: **Sky Blue `#90D5FF`**, **Bright Blue `#57B9FF`**, **Dusty Blue `#77B1D4`**, and **Slate Blue `#517891`**. Use `#90D5FF` for light backgrounds and soft highlights, `#57B9FF` for primary buttons, links, active states and important accents, `#77B1D4` for secondary accents and supporting UI, and `#517891` for dark sections, strong text and visual depth. The required font is **Tenor Sans**. Use Tenor Sans throughout the interface and preserve its elegant, lightweight, modern editorial character. Prioritize generous whitespace, clean alignment, strong typography hierarchy, comfortable line height, restrained color usage, and a sophisticated calm aesthetic. Avoid neon/cyberpunk blue, excessive gradients, heavy shadows, excessive rounded cards, excessive glassmorphism, clutter, generic SaaS styling, and unnecessary decorative elements. The final identity should communicate **calm blue + minimalism + editorial elegance + modern UI**.

---

## Quick Reference

```text
DESIGN SYSTEM
Calm Blue

COLORS
Sky Blue     → #90D5FF
Bright Blue → #57B9FF
Dusty Blue  → #77B1D4
Slate Blue  → #517891

FONT
Tenor Sans

STYLE
Minimal
Calm
Clean
Airy
Modern
Elegant
Refined
Editorial

CORE CONCEPT
Soft Blue
    +
Minimalism
    +
Editorial Elegance
    +
Modern UI
```
