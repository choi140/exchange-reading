# LLM Multimodal Vision Prompts for Visual Verification

This document contains standardized, battle-tested system and user prompt templates for executing the visual similarity & discrepancy analysis loop using multimodal models (`read_image`, Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o).

---

## 1. Visual Token Decomposition Prompt (Phase 1)

Use this prompt when ingesting a raw reference image before writing code:

```text
You are an expert design systems engineer and frontend architect.
Inspect the attached reference image carefully and decompose it into an actionable, pixel-accurate design contract.

Return your response in the following structured format:

### 1. Viewport & Canvas
- Estimated canvas dimensions (Width x Height)
- Max content container width (e.g. 1440px, 1200px, 100% full-bleed)
- Outer horizontal margins and gutters

### 2. Color Tokens (Hex & Tailwind)
- Background Canvas: #______ (`bg-...`)
- Card / Panel Surfaces: #______ (`bg-...`)
- Primary Brand Accent: #______ (`bg-... text-...`)
- Secondary / Utility Accents: #______
- Border & Divider Lines: #______ (`border-...`)
- Text Hierarchy: Primary (#______), Muted (#______), Subdued (#______)

### 3. Typography Hierarchy
- Font classification (Geometric Sans, Neo-grotesque, Serif, Monospace)
- Heading Scale: H1 (size, weight, line-height), H2, H3
- Body Text: size, weight, line-height, letter-spacing
- Contrast ratios against respective backgrounds

### 4. Layout Architecture
- Top-level structure (Header, Hero, Feature Grid, Split Panels, Footer)
- Flex/Grid specifications (column counts, gap sizes)
- Padding rhythm (vertical section padding, card internal padding)

### 5. Component Inventory
- Buttons: Padding, border-radius, background, hover states
- Badges / Tags: Pill radius, border stroke, typography
- Icons: Recognized iconography and stroke widths (Zero Unicode emojis)
- Inputs / Form elements: Height, border, placeholder styling
```

---

## 2. LLM Visual Similarity & Discrepancy Prompt (Phase 4)

Use this prompt when comparing the **Reference Design** against the **Candidate Render**:

```text
You are a ruthless visual quality auditor and design QA engineer.
You are given two images:
1. Image A: REFERENCE DESIGN (Target Truth)
2. Image B: CANDIDATE IMPLEMENTATION (Current Code Render)

Conduct a forensic pixel-level comparison across four dimensions:
1. Layout, Spatial Alignment & Box Model (40% Weight)
2. Typography, Font Scaling & Text Hierarchy (25% Weight)
3. Color Palette, Surfaces & Elevation (20% Weight)
4. Component Fidelity, Radii & Micro-details (15% Weight)

Return your evaluation strictly in the following format:

### 1. Scorecard
- Layout Fidelity Score: [0-100] / 100 (Weight: 40%)
- Typography Score:      [0-100] / 100 (Weight: 25%)
- Color & Surface Score: [0-100] / 100 (Weight: 20%)
- Component Score:        [0-100] / 100 (Weight: 15%)
- COMPOSITE VISUAL SIMILARITY INDEX (S_sim): [0-100] / 100

### 2. Discrepancy Matrix
List every visual drift in descending order of severity:
| Severity | Location / Element | Expected in Reference | Actual in Implementation | Recommended Remediation Patch (CSS / Tailwind) |
|---|---|---|---|---|
| Critical/Major/Minor | ... | ... | ... | ... |

### 3. Actionable Code Remediation Steps
Provide the exact, drop-in HTML / Tailwind CSS modifications required to eliminate the Critical and Major discrepancies and bring S_sim >= 95%.
```

---

## 3. Discrepancy Spot-Check Patch Prompt (Phase 5)

Use this prompt when refining an isolated component that failed a visual gate:

```text
The component in the candidate implementation has visual discrepancies compared to the reference design.
Specific defect: {DISCREPANCY_DESCRIPTION}
Reference coordinates / region: {REGION_BBOX}

Analyze the visual difference and output ONLY the corrected HTML / Tailwind CSS snippet that replaces the existing element to achieve 100% visual parity.
```
