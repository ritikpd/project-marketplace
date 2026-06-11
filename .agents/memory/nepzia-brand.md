---
name: NEPZIA Brand Colors
description: Electric blue rebrand — primary color, gradient anchors, logo convention, and Clerk theme colors.
---

## Primary Color
`hsl(227 83% 60%)` ≈ `#4361EE` (Electric Blue)
Set in `artifacts/nepzia/src/index.css` under both `:root` and `.dark` as `--primary`.

## Gradient Palette
- From: `#3B4FD4`
- Via: `#4361EE` (primary)
- To: `#0DCAF0` (cyan)

Used in announcement bar, hero heading, and section accents.

## Light Variant
`#5B78FF` — used for hover states where `#4361EE` is base.

## Logo Convention
- File: `/logo.png` (N-icon with transparent background, blue/cyan/purple)
- NOT `/logo.svg` — the SVG was replaced in favor of the PNG icon
- Displayed with a "NEPZIA" wordmark `<span>` next to it in Navbar and Footer
- Clerk `logoImageUrl` also points to `/logo.png`

## Clerk Theme Colors
```
colorPrimary: "hsl(227 83% 60%)"
formButtonPrimary: bg-[#4361EE] hover:bg-[#5B78FF]
formFieldInput focus border: #4361EE
alert border/bg: #4361EE
footerActionLink: text-[#4361EE] hover:text-[#5B78FF]
```

**Why:** Full rebrand from red (`#e81c44`) to electric blue to match the dark-premium aesthetic and uploaded N-icon branding.

**How to apply:** Any new component using brand color should reference `var(--primary)` / `text-primary` / `bg-primary` via Tailwind. Never hardcode old red values.
