---
name: Meetily Improved
description: A focused local meeting workspace for capture, notes, and recall.
colors:
  canvas: "#F2F3F5"
  surface: "#FCFCFD"
  surface-subtle: "#E9EAED"
  surface-strong: "#DDDEE3"
  ink: "#17171A"
  ink-muted: "#62636B"
  ink-faint: "#858791"
  rail: "#19191B"
  rail-hover: "#252529"
  rail-selected: "#303035"
  rail-ink: "#F4F4F6"
  rail-muted: "#A7A8B0"
  accent: "#F06A2A"
  accent-soft: "#FDEADF"
  success: "#178A55"
  warning: "#A66B08"
  danger: "#C33A45"
  info: "#3067C8"
  border: "#D5D6DB"
  border-strong: "#B9BBC3"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, sans-serif"
    fontSize: "32px"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  mono:
    fontFamily: "SFMono-Regular, ui-monospace, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  full: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "40px"
  "8": "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
    height: "36px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "9px 14px"
    height: "36px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
    height: "36px"
  navigation-item:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
    height: "36px"
  navigation-item-selected:
    backgroundColor: "{colors.rail-selected}"
    textColor: "{colors.rail-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
    height: "36px"
---

# Design System: Meetily Improved

## Overview

**Creative North Star: "The Signal Desk"**

Meetily Improved should feel like a precise desktop workbench placed beside a quiet reading desk. The graphite rail holds tools and state; the cool, near-white canvas holds the meeting. Navigation is compact, predictable, and low-chrome. Transcript, summary, notes, and local model feedback are allowed to breathe without being wrapped in a grid of decorative cards.

The system synthesizes Scoutly's token discipline and contrast, Codex's dense command clarity, and Granola's note-first reading hierarchy. It does not reproduce any reference surface. The visual signature comes from the dark utility rail, crisp cool canvas, restrained signal orange, tight geometry, and unusually clear state language.

**Key Characteristics:**

- Graphite utility rail beside a cool document canvas.
- Restrained signal orange reserved for recording, current AI work, and decisive selection.
- Flat-by-default surfaces separated by tone and one-pixel rules.
- Compact controls with generous reading width where content matters.
- State-driven motion only; no decorative page choreography.

## Colors

The palette is cool-neutral and high-contrast. Color is functional, scarce, and therefore meaningful.

### Primary

- **Graphite Ink:** primary actions, critical text, and the structural rail.
- **Signal Orange:** recording, active AI work, and rare signature emphasis. It must not become decoration.

### Secondary

- **Cool Canvas:** the application background behind working surfaces.
- **Paper Surface:** transcript, summary, editor, dialog, and field surfaces.
- **Layer Neutrals:** hover, selected, recessed, and disabled differentiation.

### Neutral

- **Muted Ink:** secondary descriptions and metadata.
- **Faint Ink:** placeholders and tertiary information only when contrast remains valid.
- **Structural Border:** one-pixel separation between adjacent functional regions.

### Named Rules

**The Signal Rule.** Signal Orange appears on no more than 8% of a screen. Use it only for recording, active local AI work, a current selection that needs immediate recognition, or the app icon.

**The Two-World Rule.** The rail is graphite; the work canvas is cool light. Do not dilute both into similar mid-gray or cream surfaces.

**The No Fake State Rule.** Semantic colors and progress treatments require authoritative application state and a text or icon label.

## Typography

**Display Font:** SF Pro Display through the native system stack.
**Body Font:** SF Pro Text through the native system stack.
**Label/Mono Font:** SF Mono through the native monospace stack.

**Character:** Native, compact, and exact. The hierarchy comes from weight, line-height, and spacing rather than decorative typefaces or oversized marketing copy.

### Hierarchy

- **Display** (650, 32px, 1.08): route-defining titles only; never a greeting that repeats the navigation context.
- **Headline** (650, 24px, 1.15): primary workspace sections and meeting titles.
- **Title** (600, 17px, 1.3): panels, dialogs, and high-value rows.
- **Body** (400, 14px, 1.55): controls and explanatory copy; long-form prose is capped at 72ch.
- **Label** (600, 12px, 0.02em): compact metadata and short section labels, normally sentence case.
- **Mono** (500, 12px, 1.4): timestamps, model identifiers, file formats, and technical values.

### Named Rules

**The Product Voice Rule.** No marketing-scale greetings inside the desktop app. The largest type names the work currently open.

**The Reading Rule.** Transcript, summary, and notes use comfortable line-height and a readable measure even when surrounding controls remain dense.

## Elevation

The system is flat by default. Depth comes from tonal layering, one-pixel borders, and fixed panel boundaries. Shadows appear only on content that temporarily floats above the workspace: menus, tooltips, dialogs, and drag overlays.

### Shadow Vocabulary

- **Floating Control** (`0 8px 24px rgba(23, 23, 26, 0.10)`): popovers, menus, and compact floating controls.
- **Dialog** (`0 24px 64px rgba(23, 23, 26, 0.18)`): blocking dialogs and recovery/import overlays.
- **Focus Halo** (`0 0 0 3px rgba(240, 106, 42, 0.18)`): keyboard focus paired with a solid accent outline.

### Named Rules

**The Flat Workspace Rule.** Static content surfaces do not float. If every region casts a shadow, the hierarchy has failed.

**The State Lift Rule.** Elevation may respond to hover, drag, menu, or modal state; it may not be permanent decoration.

## Components

Components are compact and familiar. Their personality comes from precision and state clarity rather than unusual affordances.

### Buttons

- **Shape:** compact rectangular controls with gently softened corners (6px).
- **Primary:** Graphite Ink fill, Paper Surface text, 36px height. One primary action per screen.
- **Accent:** Signal Orange only for recording or active AI operations. Pair filled orange with Graphite Ink text for contrast.
- **Hover / Focus:** tonal shift in 180ms; keyboard focus uses a solid accent outline and soft halo.
- **Secondary / Ghost:** Paper Surface with one-pixel border, or transparent when placed in a toolbar.

### Chips

- **Style:** small tonal labels with 6px corners, never decorative pills by default.
- **State:** semantic icon plus text. Selected filters may use Accent Soft with a dark orange label when selection is consequential.

### Cards / Containers

- **Corner Style:** 10px only for independent bounded objects; continuous workspace regions remain square or 4px.
- **Background:** Paper Surface or a named layer neutral.
- **Shadow Strategy:** flat at rest.
- **Border:** one-pixel Structural Border when adjacent tone is insufficient.
- **Internal Padding:** 16px compact, 24px reading, 32px major workspace.

### Inputs / Fields

- **Style:** Paper Surface, one-pixel border, 6px corners, 36px standard height.
- **Focus:** Border becomes Signal Orange and receives the Focus Halo.
- **Error / Disabled:** error includes text and icon; disabled lowers contrast without hiding the control's label.

### Navigation

The graphite rail uses muted labels at rest, a quiet darker hover layer, and a clearly filled selected row. Icons are 16–18px with consistent stroke. The recording control is separated from route navigation and uses Signal Orange only when it needs to dominate.

### Meeting Workspace

The meeting title and authoritative date establish context. Summary is the first reading surface when present. Transcript remains immediately discoverable and virtualized. Tools live in compact bars or inspectors, not inside repeated nested cards.

## Do's and Don'ts

### Do:

- **Do** use the graphite rail and cool canvas as the primary compositional break from upstream Meetily.
- **Do** keep Signal Orange scarce and tied to real recording, AI, or selection state.
- **Do** use 4/8/12/16/24/32/40/48 spacing tokens and 6/10/14px radii only.
- **Do** preserve every local command, lifecycle lock, keyboard path, and missing/error state during visual migration.
- **Do** let transcript, summary, and notes own the space instead of wrapping every section in a card.
- **Do** verify every route at the native 1100×700 window and at the supported minimum size.

### Don't:

- **Don't** use upstream Meetily's mixed utility-screen styling, hard-coded gray/blue controls, or form-first hierarchy.
- **Don't** restore the previous warm cream, rounded-card dashboard system.
- **Don't** build generic AI dashboards with oversized greetings, equal-weight card grids, decorative gradients, fake metrics, fake progress, or invented assistant states.
- **Don't** copy Granola, Codex, or Scoutly assets, layouts, protected copy, iconography, or proprietary interaction patterns.
- **Don't** use gradient text, glassmorphism, colored side-stripe borders, nested cards, or permanent decorative shadows.
- **Don't** add a visual field, badge, progress value, citation, or status that lacks an authoritative local contract.
