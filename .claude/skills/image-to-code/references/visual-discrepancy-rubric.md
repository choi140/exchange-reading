# 100-Point Visual Discrepancy & Fidelity Rubric

This rubric defines the scoring criteria and classification rules for visual regression testing during image-to-code synthesis. The total Composite Visual Similarity Index ($S_{sim}$) is scored out of 100 points across four core pillars.

---

## 1. Scoring Pillars Breakdown

$$S_{sim} = 0.40 \times S_{\text{layout}} + 0.25 \times S_{\text{typography}} + 0.20 \times S_{\text{color}} + 0.15 \times S_{\text{components}}$$

### Pillar 1: Layout, Spatial Rhythm & Box Model (40 Points)
- **Viewport & Alignment (15 pts):** Grid alignment, column widths, flex wrapping, and responsive containment. Content matches canonical bounds (e.g. 1440px desktop max-width).
- **Padding & Margin Spacing (15 pts):** Element gaps, section padding, whitespace breathing room, and vertical rhythm match the reference within a $\pm 4\text{px}$ tolerance.
- **Z-Index & Stacking Context (10 pts):** Overlays, sticky navigation bars, modals, floating action buttons, and backdrops stack in the correct spatial order without clipping or z-index bleed.

### Pillar 2: Typography & Text Hierarchy (25 Points)
- **Font Pairing & Classification (10 pts):** Correct font style pairing (e.g., Geometric Sans vs. Humanist Sans vs. Serif vs. Monospace) and character styling.
- **Scale & Weight Ratios (8 pts):** Exact headline hierarchy ($H_1$ to $H_4$), body size, and relative contrast between bold, semibold, and regular weights.
- **Metrics (Line-Height & Tracking) (7 pts):** Line-height (`leading-tight`, `leading-relaxed`) and letter-spacing (`tracking-tight`, `tracking-wide`) align with the reference without awkward line wraps.

### Pillar 3: Color, Surfaces & Elevation (20 Points)
- **Palette Accuracy (8 pts):** Canvas background, surface fills, primary brand color, and semantic alert hues match within $\Delta E \le 3.0$ color distance.
- **Borders & Dividers (6 pts):** Border opacity, divider strokes, outline styles, and ring offsets reflect the intended contrast.
- **Drop Shadows & Glows (6 pts):** Elevation drop shadows (`shadow-sm`, `shadow-md`, `shadow-2xl`) match the blur radius, vertical offset, and opacity of the reference design.

### Pillar 4: Component Fidelity & Micro-Details (15 Points)
- **Border Radii & Curvature (5 pts):** Pill radius (`rounded-full`), card radius (`rounded-2xl`), or sharp square corners align with the design spec.
- **Iconography & Vector Precision (5 pts):** Clean vector SVGs with matching stroke widths (`stroke-width="1.75"` or `"2"`), viewbox bounds, and alignment. **Zero Unicode emojis in production UI.**
- **Interactive State Cues (5 pts):** Hover transitions, focus rings, disabled state styling, and cursor feedback.

---

## 2. Discrepancy Classification Tiers

Any observed difference between reference and implementation is categorized into one of three severity tiers:

### Critical Severity (Deducts 15–30 pts per occurrence)
- **Definition:** Structural break that fundamentally alters layout geometry or brand recognition.
- **Examples:**
  - Layout collapsing or wrapping onto multiple lines when reference is a single row.
  - Inverted or missing primary brand colors (e.g., blue button instead of orange).
  - Truncated or missing core hero text, pricing tables, or CTA sections.
  - Horizontal viewport overflow or mobile responsiveness failure.

### Major Severity (Deducts 5–10 pts per occurrence)
- **Definition:** Noticeable visual drift that compromises polish and professional fidelity.
- **Examples:**
  - Border radius mismatch (e.g., sharp 4px corners instead of pill-shaped 9999px).
  - Noticeable padding/margin discrepancies exceeding 12px.
  - Wrong font family weight (e.g. Regular 400 instead of Bold 700).
  - Missing drop shadows or mismatched card surface opacity.

### Minor Severity (Deducts 1–3 pts per occurrence)
- **Definition:** Subtle micro-discrepancies that do not impair user experience.
- **Examples:**
  - 2–4px vertical alignment drift.
  - Letter-spacing slightly too wide (`tracking-normal` instead of `tracking-tight`).
  - Subtle icon stroke width difference (e.g. 2px vs 1.75px).
  - Minor color saturation variance ($\Delta E \le 2.0$).

---

## 3. Certification Thresholds

| Total Score ($S_{sim}$) | Verdict | Action Required |
|:---:|:---:|:---|
| **95.0 – 100.0** | **CERTIFIED PASS** | Production-ready. Code satisfies visual regression criteria. |
| **85.0 – 94.9** | **CONDITIONAL REVIEW** | Minor visual drift. Apply top-ranked remediation patches. |
| **< 85.0** | **REVISE & LOOP** | Failed visual gate. Execute autonomous self-correction loop. |
