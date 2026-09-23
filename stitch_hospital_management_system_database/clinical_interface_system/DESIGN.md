---
name: Clinical Interface System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006398'
  on-secondary: '#ffffff'
  secondary-container: '#5bb8fe'
  on-secondary-container: '#00476e'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#00201d'
  on-tertiary-container: '#0c9488'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#cce5ff'
  secondary-fixed-dim: '#93ccff'
  on-secondary-fixed: '#001d31'
  on-secondary-fixed-variant: '#004b73'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  data-mono:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a clinical, highly dependable interface engineered for Hospital Management Systems (HMS) and healthcare database management portals. The target audience comprises clinical practitioners, nurses, department administrators, lab technicians, and hospital operators who require maximum legibility and zero friction during time-sensitive tasks.

The visual style is rooted in modern corporate functionalism with strict clinical ergonomics:
- **Immediate Legibility:** High data density balanced by explicit optical boundaries, preventing visual fatigue across 12-hour shifts.
- **Institutional Trust:** Deep, grounded slate tones paired with precise, objective status cues communicate stability, compliance, and clinical rigor.
- **Zero Ambiguity:** Status indicators, critical metrics, and emergency signals use standardized chromatic tiers to guarantee instant cognitive parsing in high-stakes environments.

## Colors

The palette operates under a high-contrast clinical hierarchy calibrated specifically for light mode workspaces:

- **Primary (`#0F172A` / `#1E293B`):** Deep Navy Slate serves as the dominant structural base—used for core interactive controls, high-level navigation, primary headings, and grounding chrome.
- **Secondary Accent (`#0284C7`):** Clinical Cyan drives focused interactive cues, selected states, patient chart links, and active progress tabs.
- **Tertiary Accent (`#0D9488`):** Medical Teal denotes diagnostic confirmations, stable flow validations, and non-emergency telemetry markers.
- **Neutral Foundation (`#64748B`):** Cool slate gray provides accessible subordinate labels, secondary meta-text, and structural divider strokes.
- **Surfaces:** Base viewport background is pure neutral tint `#F8FAFC`, card containers and interactive data grids use `#FFFFFF`, and structural partition boundaries use `#E2E8F0`.
- **System Diagnostics & Clinical Triage:**
  - Emergency / Critical Alert: `#EF4444` (Stat labs, ICU alerts, vitals collapse, contraindications)
  - Warning / Watch: `#F59E0B` (Pending labs, drug interaction warnings, triage priority 2)
  - Normal / Success: `#10B981` (Discharged, normalized vitals, validated orders)

## Typography

Typography relies entirely on `Inter` with tabular numeral features enabled (`tnum`, `cv05`) across all clinical data streams. 

- **Scale Rationale:** The baseline scale favors high-density readability (`body-md` at 14px / 20px leading and `body-sm` at 12px / 16px leading), ensuring multi-attribute patient records can be audited without unnecessary scrolling.
- **Headlines:** Display titles are restrained and compact. `headline-lg` and `headline-md` establish spatial anchors without dominating available screen real estate.
- **Data & Vitals Display:** The `data-mono` role is dedicated to lab results, dosages, medical record numbers (MRNs), and physiological readings, ensuring strict vertical number alignment across dense grids.
- **Labels:** Micro-copy (`label-sm`) enforces uppercase tracking (+0.04em) for table column headers, triage severity tags, and metric unit identifiers.

## Layout & Spacing

The layout model balances high information density with visual separation:
- **Grid Architecture:** A fluid 12-column system anchored by a permanent 260px administrative left rail on desktop displays. Gutter widths shift from `1rem` on mobile and tablet to `1.5rem` on workstations.
- **Canvas Margins:** Fixed at `2rem` on wide desktop consoles to maintain perimeter breathing room, reducing to `1rem` on tablet/mobile views.
- **Rhythm & Padding:** Built on an uncompromising 4px metric base. Internal data cells use compact vertical padding (`space-xs` and `space-sm`) paired with moderate horizontal margins (`space-md`) to ensure uninterrupted scan lines across large tabular datasets.
- **Responsive Handling:** Multi-column patient summary views collapse into stacked cards at `< 1024px`. In tabbed charting environments, secondary split panes dock into bottom slide-up sheets on screen viewports below `< 768px`.

## Elevation & Depth

Visual hierarchy uses crisp, low-contrast structural borders and subtle ambient drop shadows rather than heavy blurs or dramatic skeuomorphism:

- **Surface Base:** Level 0 sits on `#F8FAFC`.
- **Card Containers & Modules (Level 1):** Solid `#FFFFFF` enclosed in a 1px border of `#E2E8F0` complemented by a shallow, cool-tinted shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05)`.
- **Flyouts, Dropdowns & Context Popovers (Level 2):** Elevated with `0 4px 12px -1px rgba(15, 23, 42, 0.08)`, 1px border of `#CBD5E1`.
- **Modals, Emergency Order Overlays & Drawer Panels (Level 3):** Grounded by a backdrop scrim of `#0F172A` at 45% opacity, pairing the elevated panel with `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.
- **Data Tables:** Pure flat architecture. Depth is communicated strictly through horizontal divider lines (`#E2E8F0`) and alternating row surface transitions (`#F8FAFC` on hover), eliminating vertical visual noise.

## Shapes

The shape language reflects institutional discipline with controlled soft corners:
- **Standard Corners (`roundedness: 1`):** Core UI controls (inputs, interactive buttons, data grid wrappers, and panel containers) feature a precise 0.25rem (4px) corner radius. This conveys architectural solidity and maximizes tabular pixel real estate.
- **Pill Badges (Exceptions):** Patient status flags, severity pills, and triage categories break from the 4px baseline into full stadium/pill shapes (9999px border radius) to visually distinguish immutable status attributes from actionable structural cards.

## Components

### Buttons
- **Primary:** Background `#0F172A`, text `#FFFFFF`, 4px radius, 36px height (standard desktop), font `label-lg`. Hover: `#1E293B`. Focus: 2px ring offset with `#0284C7`.
- **Secondary:** Background `#FFFFFF`, 1px border `#CBD5E1`, text `#0F172A`. Hover: `#F8FAFC`.
- **Critical / Emergency:** Background `#EF4444`, text `#FFFFFF`. Hover: `#DC2626`. Focus ring `#F87171`.

### Status Badges (Pills)
- **Geometry:** 20px height, full pill radius (9999px), horizontal padding 8px, typography `label-sm`.
- **Tiers:**
  - *Normal:* Background `#ECFDF5`, text `#065F46`, border 1px solid `#A7F3D0`.
  - *Observation / Pending:* Background `#FFFBEB`, text `#92400E`, border 1px solid `#FDE68A`.
  - *Critical / High Alert:* Background `#FEF2F2`, text `#991B1B`, border 1px solid `#FECACA`.
  - *Active Procedure:* Background `#F0F9FF`, text `#075985`, border 1px solid `#BAE6FD`.

### Data Tables
- **Header:** Height 36px, background `#F8FAFC`, bottom border 1px solid `#E2E8F0`, typography `label-sm` with text color `#64748B`.
- **Row:** Height 44px (standard) or 36px (compact density), alternating hover background `#F1F5F9`. Border bottom 1px solid `#F1F5F9`. Cell text `body-md` in `#0F172A`.

### Form Fields & Inputs
- **Base Style:** 36px height, 4px radius, background `#FFFFFF`, border 1px solid `#CBD5E1`, padding `0 10px`, typography `body-md`.
- **States:** Focus replaces border with `#0284C7` and adds a 1px box shadow in `#0284C7`. Error state changes border to `#EF4444` accompanied by an inline micro-label below in `#DC2626`.

### Checkboxes & Radios
- **Checkboxes:** 16x16px, 3px corner radius, border 1.5px solid `#94A3B8`. Checked state fills with `#0F172A` with a white checkmark icon.
- **Radios:** 16x16px circle, border 1.5px solid `#94A3B8`. Selected state features an inner concentric circle of `#0284C7` (8px).

### Clinical Cards & Metric Indicators
- **Card Container:** Background `#FFFFFF`, 4px radius, border 1px solid `#E2E8F0`, interior padding `space-lg`.
- **Metric Widgets:** Large numerical readout in `headline-lg` (`#0F172A`), label in `label-md` (`#64748B`), paired with an inline status pill or micro trend delta (+/-) indicating deviation from normal physiological ranges.