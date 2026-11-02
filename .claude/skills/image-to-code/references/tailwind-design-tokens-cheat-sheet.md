# Tailwind CSS Design Token Cheat Sheet

Quick-reference mapping table to convert measured pixels from reference design images directly into Tailwind utility classes.

---

## 1. Spacing & Sizing Scale

| Pixels | Tailwind Token | Rem Value | Common Use Case |
|:---:|:---:|:---:|:---|
| **1px** | `p-px` / `m-px` / `gap-px` | `1px` | Fine hairline borders |
| **2px** | `0.5` | `0.125rem` | Badge micro-padding |
| **4px** | `1` | `0.25rem` | Tight tag gaps, icon padding |
| **6px** | `1.5` | `0.375rem` | Compact button vertical padding |
| **8px** | `2` | `0.5rem` | Input internal padding, icon spacing |
| **10px** | `2.5` | `0.625rem` | Compact card internal padding |
| **12px** | `3` | `0.75rem` | Standard button vertical padding |
| **14px** | `3.5` | `0.875rem` | Medium icon boxes |
| **16px** | `4` | `1rem` | Standard component padding, gutter |
| **20px** | `5` | `1.25rem` | Standard card internal padding |
| **24px** | `6` | `1.5rem` | Card padding, desktop column gaps |
| **28px** | `7` | `1.75rem` | Wide component spacing |
| **32px** | `8` | `2rem` | Section gutters, card grid gaps |
| **36px** | `9` | `2.25rem` | Modal padding |
| **40px** | `10` | `2.5rem` | Large section spacing |
| **48px** | `12` | `3rem` | Hero margins, major section padding |
| **64px** | `16` | `4rem` | Section vertical rhythm (`py-16`) |
| **80px** | `20` | `5rem` | Desktop landing page hero padding |
| **96px** | `24` | `6rem` | Generous whitespace block separators |

---

## 2. Typography Scale

| Measured Size | Tailwind Class | Equivalent Rem | Typical Font-Weight & Line-Height Pairing |
|:---:|:---:|:---:|:---|
| **11px** | `text-[11px]` | `0.6875rem` | `font-semibold leading-none uppercase tracking-wider` |
| **12px** | `text-xs` | `0.75rem` | `font-medium leading-4 text-slate-400` |
| **14px** | `text-sm` | `0.875rem` | `font-normal leading-5 text-slate-300` |
| **16px** | `text-base` | `1rem` | `font-normal leading-6 text-slate-100` |
| **18px** | `text-lg` | `1.125rem` | `font-semibold leading-7 text-white` |
| **20px** | `text-xl` | `1.25rem` | `font-bold leading-7 tracking-tight` |
| **24px** | `text-2xl` | `1.5rem` | `font-bold leading-8 tracking-tight` |
| **30px** | `text-3xl` | `1.875rem` | `font-extrabold leading-9 tracking-tight` |
| **36px** | `text-4xl` | `2.25rem` | `font-extrabold leading-10 tracking-tight` |
| **48px** | `text-5xl` | `3rem` | `font-extrabold leading-tight tracking-tight` |
| **60px** | `text-6xl` | `3.75rem` | `font-black leading-none tracking-tighter` |

---

## 3. Border Radii & Corners

| Measured Corner Radius | Tailwind Class | Visual Description |
|:---:|:---:|:---|
| **0px** | `rounded-none` | Sharp right angle |
| **2px** | `rounded-sm` | Minimal softened corner |
| **4px** | `rounded` | Default small element radius |
| **6px** | `rounded-md` | Standard button and input radius |
| **8px** | `rounded-lg` | Modern card and modal radius |
| **12px** | `rounded-xl` | Contemporary dashboard card radius |
| **16px** | `rounded-2xl` | Large hero feature card radius |
| **24px** | `rounded-3xl` | Extra-soft mobile surface radius |
| **9999px** | `rounded-full` | Circular badges, pill buttons, avatars |

---

## 4. Shadows & Elevation

| Elevation Level | Tailwind Class | CSS Representation |
|:---:|:---:|:---|
| **Subtle Stroke** | `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |
| **Card Resting** | `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` |
| **Card Hover** | `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` |
| **Dropdown / Flyout**| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` |
| **Modal / Dialog** | `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` |
| **Dramatic Hero** | `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` |
| **Color Glow** | `shadow-emerald-500/20` | Tinted ambient box glow |
