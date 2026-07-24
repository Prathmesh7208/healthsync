# Phase 1 — UX & UI Guidelines

**Module Prefix:** `UXG`
**Priority:** P1 — Must Have
**Status:** Draft

---

## 18.1 Purpose

The UX & UI Guidelines establish the core visual language, accessibility standards, component rules, design tokens, and user experience principles for HealthSync. The goal is to build a human-centric, trustworthy, accessible, and responsive healthcare interface across all platforms (mobile, tablet, desktop web).

---

## 18.2 Core UX Design Principles

1. **Clarity Over Complexity** — Clinical data must be readable at a glance without visual noise.
2. **Accessible to All** — Designed specifically for users across age groups (including elderly) and varying technical literacy.
3. **Speed & Efficiency** — Core user journeys (booking an appointment, checking in, viewing prescriptions) must be completable in 3 taps or fewer.
4. **Contextual Transparency** — Always provide visual feedback, current queue position, and clear system status.
5. **Calm & Trustworthy Aesthetic** — Utilize a curated palette of blues, greens, and clean neutrals to instill healthcare confidence.

---

## 18.3 Design System & Tokens

### Color Palette

| Token Name | Hex Code | Usage / Context |
|------------|----------|-----------------|
| `color-primary` | `#0284C7` (Sky Blue 600) | Primary actions, headers, active tabs |
| `color-primary-dark` | `#0369A1` (Sky Blue 700) | Hover/pressed states for primary actions |
| `color-secondary` | `#0D9488` (Teal 600) | Secondary callouts, medical indicators, success badges |
| `color-surface` | `#FFFFFF` | Card backgrounds, dialog containers |
| `color-background` | `#F8FAFC` (Slate 50) | Main app screen background |
| `color-text-primary` | `#0F172A` (Slate 900) | Headings, primary body text (high contrast) |
| `color-text-secondary` | `#475569` (Slate 600) | Labels, metadata, subheadings |
| `color-error` | `#DC2626` (Red 600) | Emergency buttons, error alerts, cancellation statuses |
| `color-warning` | `#D97706` (Amber 600) | Queue delays, pending approvals, warning alerts |
| `color-success` | `#16A34A` (Green 600) | Confirmed slots, completed consultations, verified badges |

### Typography Scale

- **Primary Font Family:** Inter or Roboto (Google Fonts fallback to system default)
- **Display / H1:** 24sp / SemiBold (Screen Headers, Patient Greeting)
- **Section / H2:** 18sp / SemiBold (Section Headers, Card Titles)
- **Subheading / H3:** 16sp / Medium (Doctor Names, Sub-sections)
- **Body / Regular:** 14sp / Regular (Standard text, descriptions — *Minimum body text size*)
- **Caption / Label:** 12sp / Medium (Timestamps, status tags, badges)

---

## 18.4 Accessibility Requirements (WCAG 2.1 AA Compliance)

| ID | Requirement | Specification | Priority |
|----|-------------|---------------|----------|
| UXG-001 | Touch Targets | Minimum touch target of 48x48dp for all interactive buttons and icons | P1 |
| UXG-002 | Body Typography | Text size MUST NOT be smaller than 14sp for body content | P1 |
| UXG-003 | Color Contrast | Contrast ratio MUST be at least 4.5:1 for normal text and 3:1 for large text | P1 |
| UXG-004 | System Font Scaling | UI MUST accommodate up to 200% system font scaling without breaking layout | P1 |
| UXG-005 | Screen Reader | All images and interactive icons MUST include explicit semantic labels (`Semantics` in Flutter) | P1 |
| UXG-006 | Color Independence | Information MUST NOT be conveyed solely through color; use icons/labels alongside colors | P1 |

---

## 18.5 Component Standards

### Buttons
- **Primary Buttons:** High-emphasis, solid `color-primary` background with white text. Height: 48dp.
- **Secondary Buttons:** Medium-emphasis, outlined border with `color-primary` text.
- **Danger / Emergency Button:** Prominently styled in `color-error` (Red 600) with full screen width on Patient Dashboard.

### Cards & Surfaces
- Elevation: Low (1-2dp shadow) with subtle border radius (12dp).
- Content padding: 16dp uniform padding.

### Form Inputs
- Clear label above input field.
- Explicit inline error message below field when validation fails.
- Minimum field height: 48dp.

---

## 18.6 Localization & Multi-Language UX

- **Supported Languages (Phase 1):** English, Hindi (हिन्दी), Marathi (मराठी).
- **Language Switcher:** Accessible during first launch onboarding and inside user profile settings.
- **Layout Flow:** Flexible widget containers to prevent text overflow when translating from English to longer Hindi/Marathi strings.

---

## 18.7 Acceptance Criteria

| ID | Criteria |
|----|----------|
| UXG-AC-001 | Touch targets for all clickable widgets measure at least 48x48dp. |
| UXG-AC-002 | Automated visual accessibility scans confirm WCAG 2.1 AA contrast ratios across all screens. |
| UXG-AC-003 | App UI layout scales smoothly when system text scaling is set to 150% and 200%. |
| UXG-AC-004 | Switching language between English, Hindi, and Marathi instantly updates all strings without text clipping. |
| UXG-AC-005 | Primary actions on core screens can be performed within 3 taps. |
