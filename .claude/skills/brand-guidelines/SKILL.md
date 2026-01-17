---
name: brand-guidelines
description: >-
  BuildSeason brand identity, colors, typography, and design patterns.
  Use when creating UI components, styling pages, choosing colors,
  selecting fonts, or maintaining visual consistency.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# BuildSeason Brand Guidelines

**Design System:** "Workshop Blueprint"
An industrial-engineering aesthetic for FTC/FRC robotics teams.

## Brand Identity

**Name:** BuildSeason
**Tagline:** "Stop managing spreadsheets. Start building robots."
**Voice:** Technical, empowering, workshop-practical

## Typography

### Font Stack

| Purpose     | Font           | Fallback              | Usage                              |
| ----------- | -------------- | --------------------- | ---------------------------------- |
| **Display** | Oxanium        | system-ui, sans-serif | Headings, brand name, hero text    |
| **Body**    | IBM Plex Sans  | system-ui, sans-serif | Body text, UI labels, descriptions |
| **Mono**    | JetBrains Mono | monospace             | Data values, code, status badges   |

### CSS Variables

```css
--font-display: "Oxanium", system-ui, sans-serif;
--font-body: "IBM Plex Sans", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;
```

### Typography Rules

- Headings (h1-h6): `font-display`, weight 600, tracking `-0.02em`
- Body text: `font-body`, weight 400
- Data values: `font-mono`, tabular-nums, tracking `0.02em`
- Status badges: `font-mono`, uppercase, tracking `0.1em`

### Tailwind Classes

```tsx
// Headings
<h1 className="font-display font-semibold tracking-tight">

// Data values
<span className="font-mono tabular-nums">

// Status badge
<span className="font-mono text-xs uppercase tracking-widest">
```

## Color Palette

### Core Colors (OKLCH)

| Token              | OKLCH Value            | Hex Approx | Usage              |
| ------------------ | ---------------------- | ---------- | ------------------ |
| `background`       | `oklch(14% 0.01 250)`  | #1a1a1f    | Page background    |
| `foreground`       | `oklch(92% 0.01 250)`  | #e8e8eb    | Primary text       |
| `card`             | `oklch(17% 0.015 250)` | #232328    | Card backgrounds   |
| `muted`            | `oklch(22% 0.015 250)` | #2e2e35    | Subtle backgrounds |
| `muted-foreground` | `oklch(60% 0.02 250)`  | #8888a0    | Secondary text     |
| `border`           | `oklch(30% 0.02 250)`  | #404050    | Borders, dividers  |

### Primary (Electric Cyan)

| Token                | OKLCH Value           | Hex Approx | Usage                           |
| -------------------- | --------------------- | ---------- | ------------------------------- |
| `primary`            | `oklch(75% 0.18 195)` | #00d4ff    | Primary actions, links, accents |
| `primary-foreground` | `oklch(12% 0.02 250)` | #1a1a20    | Text on primary                 |

### Accent Palette

| Token     | OKLCH Value           | Hex Approx | Usage                |
| --------- | --------------------- | ---------- | -------------------- |
| `cyan`    | `oklch(75% 0.18 195)` | #00d4ff    | Primary accent       |
| `orange`  | `oklch(72% 0.18 55)`  | #ff8844    | Warnings, highlights |
| `magenta` | `oklch(65% 0.22 330)` | #e066aa    | Special emphasis     |
| `lime`    | `oklch(80% 0.2 130)`  | #88ee44    | Success, positive    |
| `steel`   | `oklch(55% 0.03 250)` | #707080    | Neutral accent       |

### Status Colors

| Status        | OKLCH Value          | Usage                       |
| ------------- | -------------------- | --------------------------- |
| `success`     | `oklch(65% 0.2 145)` | Completed, positive         |
| `warning`     | `oklch(72% 0.18 70)` | Attention needed            |
| `destructive` | `oklch(55% 0.22 25)` | Errors, destructive actions |

## Design Elements

### Blueprint Grid Background

```tsx
// Full grid
<div className="bg-blueprint">

// Subtle grid
<div className="bg-blueprint-subtle">
```

```css
.bg-blueprint {
  background-image:
    linear-gradient(oklch(25% 0.02 250 / 0.5) 1px, transparent 1px),
    linear-gradient(90deg, oklch(25% 0.02 250 / 0.5) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### Glow Effects

```tsx
// Button/card glow
<div className="glow-cyan">

// Subtle glow
<div className="glow-cyan-sm">

// Text glow
<span className="text-glow-cyan">
```

### Corner Accents

```tsx
// Technical corner brackets
<div className="corner-accents">
```

### Section Headers

```tsx
// With cyan bar accent
<h2 className="section-header">Parts Inventory</h2>
```

## Component Patterns

### Cards

```tsx
<Card className="border-border bg-card">
  <CardHeader>
    <CardTitle className="font-display">Title</CardTitle>
  </CardHeader>
  <CardContent>{/* content */}</CardContent>
</Card>
```

### Data Display

```tsx
// Metric box
<div className="metric-box">
  <div className="metric-value">1,234</div>
  <div className="metric-label">Total Parts</div>
</div>

// Tabular data
<span className="font-mono tabular-nums">{count}</span>
```

### Status Badges

```tsx
<span className="badge-status bg-success/20 text-success">ACTIVE</span>
```

### Interactive Rows

```tsx
<tr className="table-row-interactive">
  {/* Left border highlights on hover */}
</tr>
```

## Animations

### Reveal Animation

```tsx
<div className="reveal-up">{/* Slides up and fades in */}</div>
```

### Staggered Children

```tsx
<div className="stagger-children">
  <div>First (0ms)</div>
  <div>Second (50ms)</div>
  <div>Third (100ms)</div>
</div>
```

### Loading State

```tsx
<div className="loading-bar h-1">{/* Shimmer effect */}</div>
```

### Pulse Indicator

```tsx
<div className="pulse-dot w-2 h-2 rounded-full bg-success">
  {/* Pulsing ring animation */}
</div>
```

## Logo & Brand Mark

- Robot icon with antenna (see `RobotIcon` component)
- Always pair with "BuildSeason" in `font-display`
- Primary color for icon, foreground for text

```tsx
<div className="flex items-center gap-2">
  <RobotIcon className="h-8 w-8 text-primary" />
  <span className="text-xl font-bold font-display">BuildSeason</span>
</div>
```

## Dark Mode (Default)

BuildSeason uses dark mode as the default theme. The industrial aesthetic works best with dark backgrounds.

Light mode variables are defined but dark is primary.

## Anti-Patterns

- **Hex colors** — Use OKLCH or CSS variables instead
- **Inline styles for colors** — Use Tailwind classes
- **System fonts for headings** — Always use `font-display` (Oxanium)
- **Rounded-full on cards** — Use `rounded-lg` or smaller
- **Bright backgrounds** — Keep the industrial dark aesthetic
- **Generic sans-serif** — We have specific fonts for a reason

## Quick Reference

```tsx
// Heading
<h1 className="text-4xl font-bold font-display tracking-tight">

// Primary button
<Button className="bg-primary text-primary-foreground">

// Muted text
<p className="text-muted-foreground">

// Data value
<span className="font-mono text-2xl tabular-nums text-primary">

// Card
<Card className="border-border bg-card">

// Blueprint background
<section className="bg-blueprint">
```

## File Reference

- **CSS Source:** `src/index.css`
- **Font Import:** Google Fonts (Oxanium, IBM Plex Sans, JetBrains Mono)
- **Marketing Page:** `src/routes/index.tsx`
