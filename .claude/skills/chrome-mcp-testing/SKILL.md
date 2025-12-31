---
name: chrome-mcp-testing
description: >-
  UI validation with Chrome MCP browser automation.
  Use when testing UI components, verifying pages render correctly,
  testing forms and interactions, or validating visual changes.
allowed-tools: Read, Glob, Grep, mcp__claude-in-chrome__*
---

# Chrome MCP Testing

All UI beads must be tested with Chrome MCP before closing.

## Related Skills

- **brand-guidelines** - Typography, colors, and design patterns to verify

## When to Use

- Any bead that adds/modifies UI components
- Form submissions and validation
- Navigation flows
- React component interactions
- Visual layout verification

## Testing Checklist

Before closing a UI bead:

1. Get tab context first (`tabs_context_mcp`)
2. Navigate to affected page(s) (`navigate`)
3. Verify elements render (`read_page` or screenshot)
4. Test interactive elements (clicks, form fills)
5. Verify navigation works
6. Check for console errors (`read_console_messages`)

## Example Workflow

```
# Get tab context first (required at session start)
tabs_context_mcp -> get available tabs or create new one

# Navigate to the page
navigate -> http://localhost:5173/team/FTC/12345/parts

# Take accessibility snapshot (preferred over screenshot)
read_page -> get accessibility tree

# Test form interaction
find -> "Add Part" button
computer(left_click) -> click the button
form_input -> fill part details
computer(left_click) -> Submit button

# Verify success
read_page -> confirm redirect/success message
```

## Tools Reference

| Tool                    | Use For                            |
| ----------------------- | ---------------------------------- |
| `tabs_context_mcp`      | Get tab context (REQUIRED first)   |
| `tabs_create_mcp`       | Create new tab in MCP group        |
| `navigate`              | Go to URL or back/forward          |
| `read_page`             | Get accessibility tree (preferred) |
| `computer(screenshot)`  | Take visual screenshot             |
| `computer(left_click)`  | Click elements                     |
| `computer(type)`        | Type text                          |
| `find`                  | Find elements by natural language  |
| `form_input`            | Set form field values              |
| `read_console_messages` | Check for JS errors                |
| `get_page_text`         | Extract raw text content           |

## Authentication

Chrome MCP runs in your actual browser with existing cookies:

- If logged in, authenticated routes work directly
- For fresh sessions, log in via OAuth first
- Use `tabs_context_mcp` at session start to see existing tabs

## Common Issues

| Issue             | Solution                                        |
| ----------------- | ----------------------------------------------- |
| Page not loading  | Check dev server running at localhost:5173      |
| Auth redirect     | Log in manually first, or use existing session  |
| Element not found | Use `read_page` to see actual DOM structure     |
| Console errors    | Use `read_console_messages` with pattern filter |

## Visual Design Verification

When testing UI, verify against **brand-guidelines** skill:

### Typography

- Headings use `font-display` (Oxanium) - check `font-family` in DevTools
- Body text uses `font-body` (IBM Plex Sans)
- Data values use `font-mono` (JetBrains Mono) with `tabular-nums`
- Status badges: uppercase, wide tracking

### Colors

- Background: Dark industrial (`oklch(14% 0.01 250)`)
- Primary: Electric Cyan (`oklch(75% 0.18 195)` / #00d4ff)
- Text: Light foreground (`oklch(92% 0.01 250)`)
- Muted text: `text-muted-foreground` class

### Design Elements

- Cards use `border-border bg-card`
- Primary buttons have cyan glow on hover
- Data displays use `metric-box` or `font-mono tabular-nums`
- Section headers have cyan bar accent

### Quick Checks

```
[ ] Headings are Oxanium (geometric, technical look)
[ ] Data values are monospace with aligned digits
[ ] Primary color is cyan, not blue
[ ] Dark theme (industrial, not pure black)
[ ] Icons use text-primary or text-muted-foreground
```

## Dev vs Production URLs

- **Development**: `http://localhost:5173` (Vite dev server)
- **API in dev**: `http://localhost:3000` (but use 5173 for UI)
- **Production**: `https://buildseason.app`

Always test against dev server (5173) during development.
