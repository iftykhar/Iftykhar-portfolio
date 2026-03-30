# High-End Engineering Portfolio: Design System Documentation

## 1. Overview & Creative North Star: "The Digital Architect"
This design system moves beyond the standard "developer portfolio" template to create a high-end editorial experience. Our Creative North Star is **"The Digital Architect."** It envisions the frontend engineer not just as a coder, but as a curator of digital space. 

To achieve this, we break the "bootstrap" look through **intentional asymmetry**, massive typographic scales, and **tonal layering**. We avoid rigid boxes in favor of breathing room and overlapping elements that suggest depth. The interface should feel like a high-end physical gallery—dark, focused, and sophisticated—where the work is the exhibit and the UI is the invisible, premium glass housing it.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a "Deep Space" black, utilizing a spectrum of purples and indigos to create a sense of futuristic luxury.

### Color Tokens
- **Background (`surface`):** `#131313` — The foundation of the portfolio.
- **Primary Gradient:** `#6366F1` to `#A855F7` — Used sparingly for high-impact CTAs and "Visual Soul."
- **Tertiary (`accent`):** `#4cd7f6` (Cyan) — Reserved for technical data points and interactive feedback.
- **On-Surface (Text):** `#e5e2e1` (White-ish) for high readability; `#c7c4d7` (`on_surface_variant`) for secondary metadata.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Traditional dividers are prohibited. Boundaries must be defined solely through:
1.  **Background Color Shifts:** Transitioning from `surface` to `surface_container_low`.
2.  **Negative Space:** Using the `16` (5.5rem) or `20` (7rem) spacing tokens to create a "mental" break between content blocks.

### The "Glass & Gradient" Rule
To create a premium feel, floating elements (modals, navigation bars) must use **Glassmorphism**. 
- **Recipe:** `surface_container` at 60% opacity + `backdrop-filter: blur(20px)`.
- **The Signature Glow:** Use a subtle `primary` to `primary_container` gradient on hero backgrounds or behind key project cards to provide a "diffused light" effect that mimics high-end studio photography.

---

## 3. Typography: The Editorial Edge
We use a high-contrast pairing: **Plus Jakarta Sans** for an authoritative, geometric display feel, and **Inter** for technical precision in body copy.

- **Display-LG (3.5rem):** Set in Plus Jakarta Sans Bold. Used for hero statements. Kerning should be tightened (`letter-spacing: -0.04em`) to feel "locked in."
- **Headline-MD (1.75rem):** The primary section header. Use `on_surface` color.
- **Body-LG (1rem):** Set in Inter Regular. Used for project descriptions. High line-height (`1.6`) is required to maintain the editorial "airy" feel.
- **Label-MD (0.75rem):** Set in Inter Medium, All-Caps, with `letter-spacing: 0.1em`. Use for "TECHNICAL STACK" or "DATE" labels.

---

## 4. Elevation & Depth: Tonal Layering
In "The Digital Architect," depth is not a shadow; it is a shift in light.

### The Layering Principle
Stack tiers to create a "Soft Lift." 
- **Level 0 (Base):** `surface` (`#131313`)
- **Level 1 (Section):** `surface_container_low` (`#1c1b1b`)
- **Level 2 (Card):** `surface_container_highest` (`#353534`)

### Ambient Shadows
When an element must "float" (e.g., a hovered project card), use an extra-diffused shadow:
- `box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);`
- Add a 1px **Ghost Border** using `outline_variant` at 15% opacity to catch the "rim light" of the element without looking like a hard stroke.

---

## 5. Components

### Buttons: The Signature Action
- **Primary:** No solid background. Use a 1.5px border with a `primary` to `secondary` gradient stroke. On hover, fill with the gradient and add a `primary_fixed` outer glow (8px blur).
- **Tertiary:** Text-only in `tertiary` (cyan) with a 2px underline that expands from the center on hover.

### Cards: The Gallery Frame
- **Construction:** No borders. Use `surface_container_lowest`.
- **Constraint:** Forbid divider lines within cards. Separate the title from the metadata using a `3` (1rem) spacing gap.
- **Interaction:** On hover, the card should scale slightly (1.02x) and the background should shift to `surface_bright`.

### Input Fields: Minimalist Technicality
- **Style:** Underline only. Use `outline` color for the resting state. 
- **Focus:** Transition the underline to a `primary` gradient and add a subtle `primary_container` glow beneath the text.

### Selection Chips: The Technical Tag
- Use `surface_container_high` with `label-sm` typography. 
- **Roundedness:** Always use `full` (9999px) for chips to contrast against the `xl` (0.75rem) corners of project cards.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical layouts. If a project image is on the left, let the text on the right sit 2rem lower than the top of the image.
- **Do** use "Breathing Room." If you think a section needs more space, use the next size up in the spacing scale.
- **Do** use subtle motion. Elements should "float" into view using a `cubic-bezier(0.16, 1, 0.3, 1)` easing.

### Don’t:
- **Don’t** use 100% white text for everything. It causes "haloing" on dark backgrounds. Use `on_surface` (`#e5e2e1`) for primary text.
- **Don’t** use standard "Drop Shadows." They look muddy on deep black backgrounds. Use tonal shifts or blurs instead.
- **Don’t** use hard corners. Stick strictly to the `xl` (0.75rem) roundedness for large containers to keep the "Modern/Futuristic" feel soft and approachable.