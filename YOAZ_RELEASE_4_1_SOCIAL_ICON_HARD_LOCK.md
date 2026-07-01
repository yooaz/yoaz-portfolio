# YOAZ Release V4.1 — Social Icon Hard Lock

Fix targeted at mobile social icon flicker/morphing.

## Changes
- Previous inline SVG/img/font glyphs are visually hidden.
- Stable CSS-mask icons are used for Instagram, Behance, Dribbble, LinkedIn, Facebook and Linktree.
- Covers both old class names (`social-ig`) and new class names (`social-instagram`).
- Mobile icon labels remain hidden; desktop labels remain available.
- Removes/ignores malformed social links and any `undefined` labels.
- No resize-based icon rebuild is required for visual stability.

## Why
Several old release scripts still rebuilt social markup after load or language changes. Chrome mobile could show one icon set, then another after delayed scripts. The visual icon layer is now controlled by CSS only, so the icon shape remains stable even if older scripts update the DOM.
