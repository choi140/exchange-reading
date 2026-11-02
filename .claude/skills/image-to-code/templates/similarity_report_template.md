# Visual Verification & Similarity Report

**Component / Target:** `{TARGET_NAME}`  
**Reference Image:** `{REFERENCE_PATH}`  
**Candidate Render:** `{CANDIDATE_PATH}`  
**Diff Image:** `{DIFF_IMAGE_PATH}`  
**Timestamp:** `{TIMESTAMP}`  
**Evaluator:** `{EVALUATOR_MODEL}`  

---

## 1. Executive Summary

| Metric | Score | Target | Verdict |
|:---|:---:|:---:|:---|
| **Composite Visual Similarity Index ($S_{sim}$)** | **{COMPOSITE_SCORE} / 100** | **$\ge 95.0$** | **{STATUS_BADGE}** |
| Layout & Spatial Alignment ($S_{\text{layout}}$) | {LAYOUT_SCORE} / 100 | $\ge 95.0$ | {LAYOUT_STATUS} |
| Typography & Hierarchy ($S_{\text{typography}}$) | {TYPO_SCORE} / 100 | $\ge 90.0$ | {TYPO_STATUS} |
| Color, Surfaces & Elevation ($S_{\text{color}}$) | {COLOR_SCORE} / 100 | $\ge 95.0$ | {COLOR_STATUS} |
| Component Fidelity & Details ($S_{\text{components}}$) | {COMPONENT_SCORE} / 100 | $\ge 90.0$ | {COMPONENT_STATUS} |

---

## 2. Visual Tri-Panel Comparison

```
+---------------------------+---------------------------+---------------------------+
|    REFERENCE DESIGN       |   CANDIDATE IMPLEMENTATION|    DISCREPANCY OVERLAY    |
|                           |                           |    (Magenta = Drift)      |
+---------------------------+---------------------------+---------------------------+
```

---

## 3. Discrepancy Matrix

| # | Severity | Region / Element | Reference Expected | Candidate Actual | Remediation Delta | Status |
|:---:|:---:|:---|:---|:---|:---|:---:|
| 1 | {SEVERITY} | {ELEMENT} | {EXPECTED} | {ACTUAL} | `{REMEDIATION_CODE}` | {RESOLVED_STATUS} |

---

## 4. Sign-Off & Next Actions

- [ ] All Critical and Major visual defects remediated.
- [ ] Responsive viewports verified (Desktop 1440px, Tablet 768px, Mobile 375px).
- [ ] Accessibility contrast and keyboard navigation confirmed.
- [ ] Certified ready for production deployment.
