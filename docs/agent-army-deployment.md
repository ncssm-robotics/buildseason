# Agent Army Deployment Plan

## Orchestrating Parallel AI Development at Scale

**Version:** 1.0
**Date:** December 30, 2025
**Status:** Draft
**Purpose:** Define optimal strategy for deploying Claude agents to build BuildSeason

---

## Executive Summary

BuildSeason is a ~1000-2000 bead project. With access to an army of AI agents, we can parallelize development dramatically — but we need orchestration to avoid chaos.

**Key Principles:**

1. **Speed over cost** — Use the fastest capable model, not the cheapest
2. **Parallel where safe** — Independent work streams run concurrently
3. **Human checkpoints** — Review gates at key milestones prevent wasted work
4. **Fresh context per bead** — Avoid context pollution, recycle after each task
5. **Right model for right task** — Opus for architecture, Sonnet for implementation, Haiku for simple tasks

---

## Current State Analysis

### Open Work Summary

| Category            | Epics  | Tasks    | Status      |
| ------------------- | ------ | -------- | ----------- |
| MVP Completion      | 6      | ~15      | 80% done    |
| UI Refocus          | 12     | ~70      | Not started |
| GLaDOS Agent        | 1      | 8        | Not started |
| OnShape Integration | 1      | 6        | Not started |
| Vendor Catalog      | 1      | 5        | Not started |
| Infrastructure      | 3      | ~10      | Partial     |
| **Total**           | **24** | **~114** |             |

### Dependency Graph (Simplified)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    WAVE 0: Foundation                    │
                    │         (Complete existing MVP, establish patterns)      │
                    └─────────────────────────┬───────────────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │  CHECKPOINT 1: MVP Review     │
                              │  (Human validates patterns)   │
                              └───────────────────┬───────────┘
                                                  │
                    ┌─────────────────────────────┴─────────────────────────────┐
                    │                                                           │
                    ▼                                                           ▼
    ┌───────────────────────────────┐                       ┌───────────────────────────────┐
    │   WAVE 1: Navigation (b5u.1)  │                       │   WAVE 1: Discord Bot (il2)   │
    │   (New sidebar, routes)       │                       │   (Foundation only)           │
    └───────────────┬───────────────┘                       └───────────────┬───────────────┘
                    │                                                       │
                    ▼                                                       │
    ┌───────────────────────────────┐                                       │
    │  CHECKPOINT 2: Nav Review     │                                       │
    └───────────────┬───────────────┘                                       │
                    │                                                       │
    ┌───────────────┴───────────────┐                                       │
    │                               │                                       │
    ▼                               ▼                                       │
┌─────────────┐             ┌─────────────┐                                 │
│ WAVE 2:     │             │ WAVE 2:     │                                 │
│ Dashboard   │             │ Calendar    │                                 │
│ (b5u.2)     │             │ (b5u.3)     │                                 │
└──────┬──────┘             └──────┬──────┘                                 │
       │                           │                                        │
       └───────────┬───────────────┘                                        │
                   │                                                        │
                   ▼                                                        │
   ┌───────────────────────────────┐                                        │
   │  CHECKPOINT 3: Core UX        │◄───────────────────────────────────────┘
   └───────────────┬───────────────┘
                   │
    ┌──────────────┴──────────────┬──────────────────────────┐
    │                             │                          │
    ▼                             ▼                          ▼
┌─────────────┐           ┌─────────────┐            ┌─────────────┐
│ WAVE 3:     │           │ WAVE 3:     │            │ WAVE 3:     │
│ Robots+BOM  │           │ OnShape     │            │ Vendor      │
│ (b5u.4)     │           │ (kue)       │            │ (84j)       │
└─────────────┘           └─────────────┘            └─────────────┘
                   │
                   ▼
   ┌───────────────────────────────┐
   │  CHECKPOINT 4: Integration    │
   └───────────────┬───────────────┘
                   │
    ┌──────────────┴──────────────┬──────────────────────────┐
    │                             │                          │
    ▼                             ▼                          ▼
┌─────────────┐           ┌─────────────┐            ┌─────────────┐
│ WAVE 4:     │           │ WAVE 4:     │            │ WAVE 4:     │
│ GLaDOS Full │           │ Outreach    │            │ Operations  │
│ (il2)       │           │ (b5u.6)     │            │ (b5u.7)     │
└─────────────┘           └─────────────┘            └─────────────┘
                   │
                   ▼
              [Continue to Phases 8-12...]
```

---

## Wave Definitions

### WAVE 0: Foundation Completion

**Goal:** Complete existing MVP work to establish solid patterns

**Parallel Groups:**
| Group | Beads | Model | Can Parallelize? |
|-------|-------|-------|------------------|
| UI Framework | 8o9._ remaining | sonnet | Yes (1 agent) |
| Auth & Team | 5pw._ remaining | sonnet | Yes (1 agent) |
| Vendor Directory | ck0._, jxl | sonnet | Yes (1 agent) |
| BOM | 03y._, 9rw, xd9 | sonnet | Yes (1 agent) |
| Robots | 8mf.\*, nz1, nty, oyj, p1y | sonnet | Yes (1 agent) |

**Estimated Agents:** 5 parallel
**Estimated Duration:** 2-4 hours

---

### CHECKPOINT 1: MVP Review

**Type:** Human gate
**Reviewer:** @caryden
**Criteria:**

- [ ] App runs without errors
- [ ] All pages render correctly
- [ ] Data flows work (create, read, update, delete)
- [ ] Patterns are consistent and extensible
- [ ] Code quality meets standards

**Bead:** `buildseason-6ea`
**Blocks:** Wave 1 (b5u.1, il2.1)

---

### WAVE 1: Navigation + Discord Foundation

**Goal:** New team-centric nav structure + Discord bot skeleton

**Parallel Groups:**
| Group | Beads | Model | Notes |
|-------|-------|-------|-------|
| Navigation Restructure | b5u.1.\* | sonnet | New sidebar, routes |
| Discord Bot Setup | il2.1 | sonnet | discord.js foundation |

**Estimated Agents:** 2 parallel
**Estimated Duration:** 2-3 hours

---

### CHECKPOINT 2: Navigation Review

**Type:** Human gate
**Reviewer:** @caryden
**Criteria:**

- [ ] New navigation structure matches spec
- [ ] All routes exist (even if placeholder)
- [ ] Breadcrumbs work correctly
- [ ] Mobile responsive
- [ ] Discord bot connects and responds

**Bead:** `buildseason-2zlp`
**Blocks:** Wave 2 (b5u.2, b5u.3, il2.2)

---

### WAVE 2: Dashboard + Calendar

**Goal:** Core UX differentiators

**Parallel Groups:**
| Group | Beads | Model | Notes |
|-------|-------|-------|-------|
| Action Center Dashboard | b5u.2._ | opus | Complex UX, needs careful design |
| Team Calendar | b5u.3._ | sonnet | Standard calendar patterns |
| Claude SDK Integration | il2.2, il2.3 | sonnet | Agent intelligence layer |

**Estimated Agents:** 3 parallel
**Estimated Duration:** 4-6 hours

---

### CHECKPOINT 3: Core UX Review

**Type:** Human gate
**Reviewer:** @caryden
**Criteria:**

- [ ] Action Center shows meaningful items
- [ ] "This Week" layout works as designed
- [ ] Calendar displays events correctly
- [ ] GLaDOS personality is engaging
- [ ] Agent responds appropriately to queries

**Bead:** `buildseason-z942`
**Blocks:** Wave 3 (b5u.4, kue, 84j, il2.4)

---

### WAVE 3: Robots + Integrations

**Goal:** Robot/BOM with OnShape, Vendor link-drop

**Parallel Groups:**
| Group | Beads | Model | Notes |
|-------|-------|-------|-------|
| Robots & BOM Enhanced | b5u.4._ | sonnet | Per-robot BOMs |
| OnShape Integration | kue._ | sonnet | OAuth, BOM sync |
| Vendor Link-Drop | 84j.\* | sonnet | URL extraction |
| Agent Tools | il2.4 | sonnet | Inventory, budget, etc. |

**Estimated Agents:** 4 parallel
**Estimated Duration:** 4-6 hours

---

### CHECKPOINT 4: Integration Review

**Type:** Human gate
**Reviewer:** @caryden
**Criteria:**

- [ ] OnShape OAuth flow works
- [ ] BOM sync pulls correct data
- [ ] Link-drop extracts product info
- [ ] Agent tools query data correctly
- [ ] Cross-system integration is solid

**Bead:** `buildseason-4a5n`
**Blocks:** Wave 4 (b5u.5, b5u.6, b5u.7, il2.5)

---

### WAVE 4: Agent Complete + Expansion Start

**Goal:** Full GLaDOS + begin expansion phases

**Parallel Groups:**
| Group | Beads | Model | Notes |
|-------|-------|-------|-------|
| GLaDOS Workflows | il2.5, il2.6, il2.7 | sonnet | Temporal workflows |
| Outreach Hub | b5u.6._ | sonnet | Events, hours |
| Operations | b5u.7._ | sonnet | Competitions, travel |
| Sponsorships | b5u.8.\* | sonnet | Relationships |

**Estimated Agents:** 4-6 parallel
**Estimated Duration:** 6-8 hours

---

### WAVE 5+: Remaining Phases

**Goal:** Complete expansion

**Phases:** Marketing (b5u.9), Finance (b5u.10), Settings (b5u.11), Chat Interface (b5u.12)

**Estimated Agents:** 4 parallel per wave
**Estimated Duration:** 4-6 hours per wave

---

## Model Routing Strategy

### Model Selection Criteria

| Model      | Use When                                                                             | Speed   | Cost | Examples                                         |
| ---------- | ------------------------------------------------------------------------------------ | ------- | ---- | ------------------------------------------------ |
| **opus**   | Architecture decisions, complex UX design, code review, integration design, planning | Slower  | $$$  | Dashboard design, agent behavior, system prompts |
| **sonnet** | Core implementation, debugging, refactoring, most coding tasks                       | Fast    | $$   | Components, API routes, database queries         |
| **haiku**  | Simple components, tests, docs, well-specified CRUD, boilerplate                     | Fastest | $    | Unit tests, type definitions, simple forms       |

### Bead Label Schema

```
Labels:
  model:opus     - Use Claude Opus 4.5
  model:sonnet   - Use Claude Sonnet 4.5
  model:haiku    - Use Claude Haiku 3.5

  parallel:<group>  - Can run with other beads in same group
  sequential        - Must complete before next bead starts

  checkpoint        - Human review gate
  human             - Requires human action (not AI)

  foundation        - Must complete before parallel work begins
```

---

## Tooling Requirements

### 1. Bead Orchestrator Skill

**Purpose:** Launch parallel agents for a wave of beads

**Command:** `/army deploy <wave>`

**Behavior:**

1. Query beads for specified wave (by label or list)
2. Check dependencies are satisfied
3. Launch subagent per bead with fresh context
4. Each subagent:
   - Reads bead description
   - Loads relevant files (from bead metadata or auto-detected)
   - Executes task
   - Updates bead status
   - Commits changes to feature branch
5. Orchestrator monitors completion
6. Reports summary to human

**Implementation:** Claude Code skill + subagents

---

### 2. Model Router Hook

**Purpose:** Automatically select model based on bead label

**Hook Type:** `PreToolCall` or custom

**Behavior:**

```typescript
// .claude/hooks/model-router.ts
export async function routeModel(bead: Bead): Promise<ModelId> {
  const labels = bead.labels || [];

  if (labels.includes("model:opus")) return "claude-opus-4-5";
  if (labels.includes("model:haiku")) return "claude-haiku-3-5";
  return "claude-sonnet-4-5"; // default
}
```

**Note:** May require Claude Code configuration or wrapper script.

---

### 3. Context Loader

**Purpose:** Load relevant files for a bead without polluting context

**Command:** `/bead load <bead-id>`

**Behavior:**

1. Read bead description
2. Extract file paths mentioned
3. Use Explore agent to find related files
4. Load into context (Read tool)
5. Summarize what's loaded

**Implementation:** Skill that invokes Explore subagent

---

### 4. Checkpoint Gate System

**Purpose:** Block downstream work until human approves

**Bead Structure:**

```yaml
id: buildseason-cp1
type: checkpoint
title: "CHECKPOINT 1: MVP Review"
assignee: human
blocks:
  - buildseason-b5u.1
  - buildseason-il2.1
criteria:
  - App runs without errors
  - All pages render correctly
  - Data flows work
  - Patterns are consistent
```

**Behavior:**

- `/army deploy wave1` checks if checkpoint-blocking beads are closed
- If checkpoint open, refuses to deploy and shows what's blocking
- Human closes checkpoint bead when satisfied
- Downstream waves become deployable

---

### 5. Branch Strategy

**Purpose:** Avoid merge conflicts between parallel agents

**Strategy:**

```
main
 └── wave-0-foundation
      ├── agent-1-ui-framework
      ├── agent-2-auth
      ├── agent-3-vendor
      ├── agent-4-bom
      └── agent-5-robots
```

**Merge Order:**

1. Each agent works on feature branch
2. On completion, agent creates PR
3. Human (or orchestrator) merges in dependency order
4. Conflicts resolved before next wave

**Alternative:** Trunk-based with careful file allocation (each agent owns specific files)

---

### 6. Progress Dashboard

**Purpose:** Visualize army progress

**Command:** `/army status`

**Output:**

```
WAVE 0: Foundation [████████░░] 80%
  ├─ UI Framework    [██████████] 100% ✓
  ├─ Auth & Team     [████████░░] 83%
  ├─ Vendor          [██████░░░░] 67%
  ├─ BOM             [███░░░░░░░] 33%
  └─ Robots          [░░░░░░░░░░] 0%

CHECKPOINT 1: MVP Review [PENDING]
  Blocked by: Auth, Vendor, BOM, Robots

WAVE 1: Navigation [BLOCKED]
  Waiting for: CHECKPOINT 1
```

---

## Implementation Priority

### Phase 1: Manual Orchestration (Now)

- Create checkpoint beads
- Add model labels to existing beads
- Add parallel group labels
- Human manually launches agents per wave
- Human manages branches and merges

### Phase 2: Basic Tooling (This Week)

- `/army status` skill for progress view
- `/bead load` skill for context loading
- Branch naming conventions
- Basic orchestration documentation

### Phase 3: Automated Orchestration (Next Week)

- `/army deploy` skill for parallel launch
- Model router hook
- Automated PR creation
- Checkpoint gate enforcement

### Phase 4: Advanced Features (Future)

- Progress dashboard (web UI)
- Automatic conflict detection
- Cost tracking per wave
- Performance analytics

---

## Estimated Timeline

| Wave    | Duration       | Agents | Checkpoint         |
| ------- | -------------- | ------ | ------------------ |
| Wave 0  | 2-4 hours      | 5      | MVP Review         |
| Wave 1  | 2-3 hours      | 2      | Nav Review         |
| Wave 2  | 4-6 hours      | 3      | Core UX Review     |
| Wave 3  | 4-6 hours      | 4      | Integration Review |
| Wave 4  | 6-8 hours      | 6      | Agent Review       |
| Wave 5+ | 4-6 hours each | 4      | Per-phase          |

**Total Estimated Time:** 24-40 hours of parallel agent work
**With Human Review:** 2-3 days calendar time

**Traditional Estimate:** 2-3 months

---

## Slash Commands (Implemented)

### `/army` Command

**Location:** `.claude/commands/army.md`

```
/army status              # Show wave progress and checkpoint gates
/army deploy <wave>       # Launch parallel agents for a wave
/army review <wave>       # Review completed work before closing checkpoint
```

**Usage Flow:**

1. `/army status` — See current state
2. `/army deploy 0` — Launch agents for Wave 0
3. Wait for agents to complete
4. `/army review 0` — Review the work
5. `bd close buildseason-6ea` — Close checkpoint to unblock next wave
6. Repeat for next wave

### `/bead` Command

**Location:** `.claude/commands/bead.md`

```
/bead work <id>           # Pick up a bead, load context, start working
/bead show <id>           # Show bead details
/bead close <id>          # Mark a bead complete
```

**Usage:**

- Use `/bead work xyz` when you want to manually work on a specific bead
- The command loads relevant files and specs into context

---

## Next Steps

1. [x] Create checkpoint beads (cp1, cp2, cp3, cp4)
2. [ ] Label existing beads with model recommendations
3. [ ] Label existing beads with parallel groups
4. [x] Implement `/army` command
5. [x] Implement `/bead` command
6. [ ] Document branch strategy
7. [ ] Deploy Wave 0

---

## Appendix: Bead Labeling Commands

```bash
# Add model labels
bd label buildseason-b5u.2 model:opus    # Dashboard needs careful design
bd label buildseason-il2.3 model:sonnet  # Personality is implementation
bd label buildseason-26d model:haiku     # Simple test task

# Add parallel groups
bd label buildseason-8o9 parallel:wave0-ui
bd label buildseason-5pw parallel:wave0-auth
bd label buildseason-ck0 parallel:wave0-vendor

# Add checkpoint label
bd label buildseason-cp1 checkpoint human
```

---

## Continuous Learning Loop

### The Problem with Traditional Org Memory

The naive approach to organizational learning is to accumulate rules in AGENTS.md:

```markdown
# AGENTS.md (anti-pattern - grows forever)

- Always use aria-labels on buttons (learned from issue #123)
- Always validate API inputs with Zod (learned from issue #456)
- Never use inline styles (learned from issue #789)
- Always check for null before accessing nested properties...
- ... (500 more rules)
```

**Problems:**

1. **Context bloat** — Every rule loads on every turn, regardless of relevance
2. **Signal dilution** — Important rules buried in noise
3. **No structure** — Hard to find related patterns
4. **No validation** — Rules can conflict or become stale
5. **No composition** — Can't combine related knowledge

### The Solution: Skill-Based Learning

Instead of accumulating rules, capture patterns in **focused skills**:

```
.claude/commands/
├── ui-components.md      # Component patterns, shadcn usage
├── api-validation.md     # Zod schemas, error handling
├── accessibility.md      # ARIA, focus, keyboard nav
├── data-fetching.md      # TanStack Query patterns
└── testing.md            # Test structure, mocking
```

**Benefits:**

1. **Targeted loading** — Only invoked when relevant
2. **Encapsulated knowledge** — Patterns AND anti-patterns together
3. **Testable** — Skills can be validated independently
4. **Composable** — Bead templates reference relevant skills
5. **Evolvable** — Update once, all future work benefits

### Wave Lifecycle (Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE WAVE LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────────┘

1. PLAN
   └─► Review specs, create beads, define missions, assign models

2. DEPLOY
   └─► Launch parallel agents for missions
   └─► Each agent references relevant skills from bead template

3. EXECUTE
   └─► Agents complete beads, commit to branches
   └─► Agents close beads when done

4. REVIEW (3 parallel)
   ├─► Code Review — patterns, tests, architecture
   ├─► Security Review — auth, validation, injection
   └─► UI/UX Review — visual verification via Chrome MCP

5. FIX
   └─► Deploy fix agents for discovered issues
   └─► Re-run failing checks

6. RETROSPECTIVE (After-Action Review)
   └─► Analyze what went wrong/right
   └─► Propose process improvements
   └─► Create or update skills
   └─► Tag improvements: process-improvement, discovered-from:<retro-bead>

7. CHECKPOINT
   └─► Human reviews summary
   └─► Answers questions (human-tagged beads)
   └─► Closes checkpoint to unblock next wave

8. PREPARE NEXT WAVE
   └─► Forward-looking skill creation
   └─► Update bead templates with skill references
   └─► Preemptively create skills for anticipated patterns
```

### After-Action Review (Retrospective)

**Command:** `/army retro <wave>`

**Process:**

1. **Gather Inputs:**
   - Review findings (code, security, UI/UX)
   - Fixes applied
   - Bead outcomes (success/failure/rework)
   - Time spent per mission
   - Model performance (opus vs sonnet vs haiku accuracy)

2. **Analysis (Opus model):**
   - What patterns led to issues?
   - Which agents struggled? Why?
   - What knowledge was missing?
   - What worked exceptionally well?

3. **Generate Improvements:**
   - **New skills** — Capture recurring patterns/anti-patterns
   - **Skill updates** — Enhance existing skills with learned edge cases
   - **Template updates** — Add skill references to bead templates
   - **Process changes** — Adjust review checklists, agent prompts
   - **Forward-looking** — Pre-create skills for next wave's needs

4. **Create Beads:**
   ```bash
   bd create --title="Skill: <name>" --type=task --priority=2 \
     --label="process-improvement" \
     --label="discovered-from:<retro-bead-id>"
   ```

### Skill Categories

| Category          | Purpose               | Example Skills                                        |
| ----------------- | --------------------- | ----------------------------------------------------- |
| **UI/Visual**     | Consistent appearance | `ui-components`, `branding`, `dark-mode`              |
| **API/Backend**   | Server patterns       | `api-validation`, `error-handling`, `auth-middleware` |
| **Data**          | State management      | `tanstack-query`, `form-state`, `optimistic-updates`  |
| **Testing**       | Test patterns         | `unit-tests`, `integration-tests`, `mocking`          |
| **Accessibility** | A11y compliance       | `accessibility`, `keyboard-nav`, `screen-reader`      |
| **Security**      | Security patterns     | `input-sanitization`, `csrf`, `rate-limiting`         |
| **Domain**        | Project-specific      | `ftc-robotics`, `bom-management`, `vendor-catalog`    |

### Skill Anatomy

```markdown
---
description: "UI component patterns for BuildSeason"
invocation: "automatic" # or "manual" or "on-reference"
applies_to:
  - "apps/web/src/components/**"
  - "apps/web/src/routes/**"
triggers:
  - "creating a component"
  - "updating UI"
  - "fixing visual bug"
---

# UI Components Skill

## DO (Patterns)

- Use shadcn/ui components from @/components/ui
- Apply Tailwind classes, never inline styles
- Use CSS variables for theme colors (--primary, --muted, etc.)
- Include loading and error states
- Add aria-labels to interactive elements

## DON'T (Anti-Patterns)

- ❌ Create custom components when shadcn has one
- ❌ Use hex colors directly (breaks dark mode)
- ❌ Skip empty states
- ❌ Forget keyboard navigation

## Examples

### Good: Card with proper states

\`\`\`tsx
<Card>
{isLoading ? (
<Skeleton className="h-24" />
) : error ? (
<ErrorState message={error.message} />
) : items.length === 0 ? (
<EmptyState icon={Package} title="No items" />
) : (
items.map(item => <ItemRow key={item.id} item={item} />)
)}
</Card>
\`\`\`

### Bad: Missing states

\`\`\`tsx
// ❌ No loading, error, or empty handling
<Card>
{items.map(item => <ItemRow key={item.id} item={item} />)}
</Card>
\`\`\`

## Learned From

- Wave 0: Missing empty states (buildseason-xyz)
- Wave 1: Inconsistent loading patterns (buildseason-abc)
```

### Bead Template Enhancement

Beads should reference relevant skills:

```yaml
id: buildseason-abc123
title: "Add parts search component"
type: feature
priority: 2

# NEW: Skills to apply
skills:
  - ui-components # Component patterns
  - data-fetching # TanStack Query patterns
  - accessibility # ARIA, keyboard nav

# Existing fields
description: |
  Create a search component for the parts page with:
  - Debounced input
  - Loading state
  - Empty results state

files:
  - apps/web/src/components/parts/search.tsx
  - apps/web/src/routes/team/$program/$number/parts/index.tsx
```

**Agent Behavior:**

When an agent picks up this bead:

1. Load bead description
2. For each skill in `skills:`, invoke `/skill <name>` to load patterns
3. Apply patterns during implementation
4. Reference skills in commit message for traceability

### Forward-Looking Skill Creation

Before each wave, analyze upcoming beads and preemptively create skills:

**Command:** `/army prepare <wave>`

**Process:**

1. **Scan upcoming beads:**

   ```bash
   bd list --wave=2 --status=open
   ```

2. **Identify patterns:**
   - Multiple beads touching calendar → create `calendar-patterns` skill
   - GLaDOS integration beads → create `agent-tools` skill
   - New data models → create `schema-patterns` skill

3. **Create preemptive skills:**
   - Research best practices
   - Document patterns before implementation
   - Reference in bead templates

4. **Example output:**

   ```
   WAVE 2 PREPARATION
   ==================

   Analyzing 12 beads...

   RECOMMENDED SKILLS:

   1. calendar-patterns (NEW)
      - 4 beads touch calendar functionality
      - Should document: event types, recurring events, timezone handling

   2. action-center (NEW)
      - Dashboard redesign with GLaDOS suggestions
      - Should document: action item structure, approval flow, undo patterns

   3. ui-components (UPDATE)
      - Add: Timeline component, Progress ring, Status indicators

   Create these skills? [Y/n]
   ```

### Metrics & Tracking

Track learning effectiveness:

| Metric                 | Description                          | Target           |
| ---------------------- | ------------------------------------ | ---------------- |
| **Rework Rate**        | Beads requiring fixes after review   | < 20%            |
| **Pattern Violations** | Issues from ignoring existing skills | 0                |
| **Skill Coverage**     | % of beads with skill references     | > 80%            |
| **Review Findings**    | Issues found per wave                | Decreasing trend |
| **Time to Fix**        | Hours to resolve review findings     | Decreasing trend |

### Example: Learning from Wave 0

**Issue Found:** Robots page crashed because API response structure wasn't handled correctly.

**Root Cause:** Frontend expected `Season[]` but API returned `{ seasons: Season[], activeSeasonId: string }`.

**Retrospective Action:**

1. **Create skill: `api-response-patterns`**

   ```markdown
   # API Response Patterns

   ## Standard Response Structure

   All list endpoints return wrapped responses:
   \`\`\`typescript
   type ApiListResponse<T> = {
   items: T[]; // or domain-specific key like 'seasons'
   total?: number;
   metadata?: Record<string, unknown>;
   };
   \`\`\`

   ## Frontend Pattern

   Always destructure API responses:
   \`\`\`typescript
   const { data } = useQuery({
   queryFn: async () => {
   const res = await fetch('/api/things');
   const json = await res.json();
   return json.things; // Extract the array
   }
   });
   \`\`\`

   ## Anti-Pattern

   \`\`\`typescript
   // ❌ Assuming response IS the array
   return res.json() as Promise<Thing[]>;
   \`\`\`
   ```

2. **Update bead templates** for data fetching beads to reference this skill

3. **Add to review checklist:** "Verify API response structure matches frontend expectations"

### Integration with `/army` Command

The army skill should be updated to include retrospective:

```
/army status              # Show wave progress
/army deploy <wave>       # Launch parallel agents
/army review <wave>       # Run code, security, UI/UX reviews
/army deploy-fixes <wave> # Fix discovered issues
/army retro <wave>        # Run after-action review
/army prepare <wave>      # Forward-looking skill creation
/army checkpoint <wave>   # Generate human review summary
```

---

## Next Steps (Updated)

1. [x] Create checkpoint beads (cp1, cp2, cp3, cp4)
2. [ ] Label existing beads with model recommendations
3. [ ] Label existing beads with parallel groups
4. [x] Implement `/army` command
5. [x] Implement `/bead` command
6. [ ] Document branch strategy
7. [x] Deploy Wave 0
8. [ ] **NEW:** Implement `/army retro` subcommand
9. [ ] **NEW:** Create initial skills from Wave 0 learnings
10. [ ] **NEW:** Implement `/army prepare` subcommand
11. [ ] **NEW:** Add skills field to bead templates

---

_Document maintained at: buildseason/docs/agent-army-deployment.md_
