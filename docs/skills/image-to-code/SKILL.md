---
name: image-to-code
description: Autonomous, pixel-accurate UI reverse-engineering and code generation engine for Antigravity CLI and multi-agent fleet. Transpiles visual reference images, Figma designs, wireframes, and screenshots into production-grade HTML/Tailwind, React, Vue, Svelte, or Django templates, powered by an automated multi-phase LLM visual similarity & discrepancy analysis loop using read_image/multimodal inspection to achieve >=95% visual fidelity before release. Use whenever the user provides an image, mockup, screenshot, or UI spec and asks to implement, reverse-engineer, clone, or visually refine it into code.
---

# Image to Code Engine (`image-to-code`)

Convert any visual reference (Figma export, UI mockup, screenshot, photo of wireframe, or dashboard capture) into clean, production-grade, responsive code (HTML5 + Tailwind CSS, React, Vue, Svelte, or Django templates) with **automated closed-loop visual verification**.

This skill pairs visual decomposition with headless browser rendering and **LLM multimodal similarity/discrepancy analysis** using `read_image` / multimodal inspection to measure visual fidelity, identify pixel/spatial drift, and iterate autonomously until the implementation matches the reference with $\ge 95\%$ visual accuracy.

---

## When to Use

- Converting UI screenshots, Figma exports, or design mockups into production code (HTML/Tailwind, React, Vue, Svelte, Django/HTMX).
- Auditing visual fidelity between a reference design and an existing implementation.
- Reverse-engineering complex layouts, dashboards, marketing landing pages, or mobile app screens from screenshots.
- Running automated visual regression testing and receiving an actionable discrepancy matrix with exact CSS/Tailwind patches.
- Generating pixel-accurate components that adhere to the host repository's design system and accessibility requirements.

---

## The 5-Phase Closed-Loop Architecture

```
[ Reference Image ]
        │
        ▼ (Phase 1: Visual Token Decomposition)
┌───────────────────────────────────────────────┐
│ • Layout hierarchy, grid margins, container   │
│ • Color tokens (canvas, surface, borders)     │
│ • Typography scale, weights, line-heights     │
│ • Pure vector SVG / icon recognition          │
└───────────────────────────────────────────────┘
        │
        ▼ (Phase 2: Code Synthesis)
┌───────────────────────────────────────────────┐
│ Generate semantic, accessible implementation  │
│ (HTML + Tailwind, React, Vue, Django, etc.)   │
└───────────────────────────────────────────────┘
        │
        ▼ (Phase 3: Headless Capture)
┌───────────────────────────────────────────────┐
│ `render_screenshot.py` renders candidate at   │
│ identical viewport (Desktop 1440px / Mobile)  │
└───────────────────────────────────────────────┘
        │
        ▼ (Phase 4: LLM Multimodal Similarity & Discrepancy Analysis)
┌───────────────────────────────────────────────┐
│ `read_image` reference vs candidate render    │
│ Compute Composite Visual Similarity Index     │
│ Generate Discrepancy Matrix (Critical/Major)  │
└───────────────────────────────────────────────┘
        │
        ├────────────[ S_sim < 95% ]────────────┐
        │                                       │ (Phase 5: Auto-Remediation)
        │                                       ▼
        │                       ┌───────────────────────────────┐
        │                       │ Apply CSS/Tailwind deltas     │
        │                       │ Re-render and re-compare      │
        │                       └───────────────────────────────┘
        ▼ [ S_sim >= 95% ]
[ Certified Production Code + Verification Scorecard ]
```

---

## Phase 1: Reference Ingestion & Visual Token Decomposition

Before writing any code, inspect the reference image using visual inspection (`read_image` or multimodal file reading) and extract the **Visual Design Contract**:

1. **Viewport & Spatial Bounds:**
   - Detect canvas dimensions and aspect ratio (e.g., Desktop `1440x900`, Tablet `768x1024`, Mobile `375x812`).
   - Identify outer container constraints (e.g., `max-w-7xl mx-auto px-6` or fixed-width grid).
2. **Color Palette & Surface Elevation:**
   - Background canvas hex codes (e.g., `#0F172A`, `#FAF9F6`).
   - Card surfaces, modals, and panel fills.
   - Text hierarchy colors: Primary, Muted, Subdued, Inverted.
   - Border colors, divider strokes, and elevation shadows (`shadow-sm`, `shadow-xl`, ring offsets).
3. **Typography Scale & Weight:**
   - Primary font classification (Geometric Sans, Humanist Sans, Serif, Monospace).
   - Heading scale ($H_1$ to $H_4$), body size, letter-spacing (`tracking-tight`), and line-height.
4. **Layout & Box Model:**
   - Flex vs. Grid layout structures.
   - Explicit padding, margins, and gaps between elements.
5. **Component & Icon Inventory:**
   - Buttons (primary, secondary, outline, ghost) and interactive states.
   - Icons: Identify vector icons (Lucide, Heroicons, Feather) and transcribe directly into stroke-based SVGs. **Strictly avoid Unicode emojis in production UI.**

---

## Phase 2: Production Code Synthesis

Generate clean, semantic, and accessible code following these standards:

- **Semantic HTML5:** Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, and `<footer>`.
- **Accessibility (WAI-ARIA):** All interactive elements must have accessible labels (`aria-label`, `role="combobox"`, keyboard focus indicators).
- **Tailwind CSS Best Practices:**
  - Prefer modern flex/grid utilities (`flex flex-col gap-4`, `grid grid-cols-1 md:grid-cols-3 gap-6`).
  - Use exact arbitrary values only when standard tokens do not match the reference (e.g., `max-w-[1440px]`, `bg-[#07090E]`).
- **Responsive Fluidity:** Mobile-first approach scaling to tablet (`md:`) and desktop (`lg:`, `xl:`).

---

## Phase 3: Headless Visual Capture

Render the candidate code locally using headless Chromium / Playwright at the exact viewport dimensions of the reference image:

```bash
# Render candidate HTML or web component to candidate screenshot
python3 scripts/render_screenshot.py \
  --input path/to/component.html \
  --output artifacts/renders/candidate_desktop.png \
  --viewport 1440x900
```

For full-stack or framework components (React, Vue, Next.js, Django), launch the local dev server and capture the target route:

```bash
python3 scripts/render_screenshot.py \
  --url http://localhost:8000/my-page/ \
  --output artifacts/renders/candidate_desktop.png \
  --viewport 1440x900 \
  --wait-until networkidle
```

---

## Phase 4: LLM Multimodal Similarity & Discrepancy Analysis

Perform a rigorous visual comparison between the **Reference Image** and the **Candidate Render** using `read_image` and the analysis script:

### 1. Dual Inspection
Inspect both images side-by-side using `read_image(reference_path)` and `read_image(candidate_path)`.

### 2. Algorithmic Baseline Metrics
Run `scripts/visual_compare.py` to calculate structural metrics and generate a pixel diff overlay:

```bash
python3 scripts/visual_compare.py \
  --reference path/to/reference.png \
  --candidate artifacts/renders/candidate.png \
  --output-diff artifacts/renders/visual_diff.png
```

### 3. LLM Qualitative Evaluation Rubric
Compute the **Composite Visual Similarity Index ($S_{sim}$)** out of 100 points:

$$S_{sim} = 0.40 \times S_{\text{layout}} + 0.25 \times S_{\text{typography}} + 0.20 \times S_{\text{color}} + 0.15 \times S_{\text{components}}$$

| Dimension | Weight | Focus Areas |
| :--- | :---: | :--- |
| **Layout & Grid ($S_{\text{layout}}$)** | 40% | Margins, padding, element alignments, flex wrapping, container bounds, vertical rhythm. |
| **Typography ($S_{\text{typography}}$)** | 25% | Font family pairing, font weights, size ratios, line heights, letter tracking. |
| **Color & Surface ($S_{\text{color}}$)** | 20% | Canvas background, card fills, border contrast, gradients, elevation drop shadows. |
| **Component Details ($S_{\text{components}}$)** | 15% | Border radius curvature, icon scale and stroke width, button padding, badge styling. |

### 4. Discrepancy Matrix Schema
Document every detected visual defect in a structured discrepancy matrix:

```markdown
| Severity | Component / Area | Reference Expected | Candidate Actual | Recommended Remediation Patch |
|:---|:---|:---|:---|:---|
| **Critical** | Hero CTA Button | Emerald green (`#10B981`) with 12px pill radius | Cyan (`#06B6D4`) with square corners | Change `bg-cyan-500 rounded` to `bg-emerald-500 rounded-full px-6 py-3` |
| **Major** | Card Grid Gaps | 32px (`gap-8`) between cards | 16px (`gap-4`) with crowded text | Update container class to `grid gap-8` |
| **Minor** | Subtitle Tracking | Tight tracking (`tracking-tight`) | Normal spacing | Add `tracking-tight text-slate-400` |
```

---

## Phase 5: Autonomous Self-Correction Loop

If $S_{sim} < 95\%$:

1. Apply the top-ranked remediation patches directly to the codebase.
2. Re-render the screenshot using `scripts/render_screenshot.py`.
3. Re-evaluate visual similarity with `scripts/visual_compare.py` and `read_image`.
4. Continue looping until $S_{sim} \ge 95\%$ or all Critical/Major discrepancies are resolved.
5. Record the final visual regression report in `artifacts/visual_verification_report.md`.

---

## Auxiliary Resources & Scripts

- **`scripts/render_screenshot.py`**: Headless Playwright capture engine for HTML files and URLs.
- **`scripts/visual_compare.py`**: Automated perceptual diff generator and SSIM calculator.
- **`references/visual-discrepancy-rubric.md`**: Authoritative 100-point visual inspection grading criteria.
- **`references/tailwind-design-tokens-cheat-sheet.md`**: Instant pixel-to-Tailwind spacing and typography conversion table.
- **`references/llm-vision-prompts.md`**: Specialized prompt templates for multimodal vision models.
- **`templates/similarity_report_template.md`**: Standardized Markdown template for visual acceptance sign-off.
