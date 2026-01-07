# Agent Army Command Specification

> "Every piece of terrain has exactly one owner. Ambiguity kills."

This specification defines the `/army` command for orchestrating parallel AI agent development, incorporating lessons from U.S. Army battlespace management doctrine.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Concepts](#core-concepts)
3. [Current State Analysis](#current-state-analysis)
4. [Target Architecture](#target-architecture)
5. [Subcommand Reference](#subcommand-reference)
6. [Data Model](#data-model)
7. [Migration Plan](#migration-plan)
8. [Plugin Packaging](#plugin-packaging)
9. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Problem Statement

Multiple AI agents working in parallel will conflict if they touch the same files. Git merge conflicts are the agent equivalent of friendly fire—wasted effort, broken code, confused state. The current `/army` command handles wave deployment and review but lacks explicit territorial boundaries, leading to:

- Agents occasionally modifying files outside their scope
- Merge conflicts when waves run in parallel
- Unclear ownership when agents discover cross-cutting concerns
- No pre-deployment conflict detection

### Solution

Adopt U.S. Army battlespace management principles:

| Army Concept            | Agent Implementation                                         |
| ----------------------- | ------------------------------------------------------------ |
| Area of Operations (AO) | Files a mission OWNS and can modify                          |
| Area of Interest (AI)   | Files a mission READS but cannot modify                      |
| Boundaries              | Hard lines between missions; crossing requires coordination  |
| No-Fire Areas           | Protected files nobody modifies (package.json, schema index) |
| Phase Lines             | Waves synchronized by checkpoints                            |
| Synchronization Matrix  | File × Mission grid showing ownership before deployment      |

### Expected Outcomes

- **Zero merge conflicts** in parallel deployments (AO exclusivity)
- **Clear escalation path** when agents need files outside their AO
- **Pre-deployment validation** via synchronization matrix
- **Reusable plugin** extractable for other projects

---

## Core Concepts

### Area of Operations (AO)

**Definition:** Files and directories a mission owns. Agents can freely modify anything in their AO. No merge conflicts possible because no other mission touches these files.

```yaml
mission: auth-team
area_of_operations:
  - apps/api/src/routes/auth/**
  - apps/api/src/routes/teams/**
  - apps/web/src/features/auth/**
  - drizzle/schema/users.ts
  - drizzle/schema/teams.ts
```

**Rules:**

- Agent has FULL authority within AO
- No coordination needed for modifications
- AO must be EXCLUSIVE within a wave (no overlaps)

### Area of Interest (AI)

**Definition:** Files a mission reads but doesn't modify. Dependencies that the mission relies on but doesn't own.

```yaml
mission: auth-team
area_of_interest:
  - apps/api/src/lib/db.ts # Read for DB connection
  - apps/api/src/index.ts # Read for route registration
  - drizzle/schema/index.ts # Read for schema imports
```

**Rules:**

- Agent may READ files in AI
- Agent CANNOT modify files in AI
- To modify AI files, agent must request coordination

### Boundaries

**Definition:** The explicit file list defines the boundary. Agents don't cross boundaries without explicit coordination.

**Agent Prompt Enforcement:**

```
BOUNDARY RULES:
- You may MODIFY any file in your AO
- You may READ files in your AI but NOT modify them
- Files outside both lists are OFF LIMITS
- If you need a file outside your AO, STOP and create:
  bd create --title="Coordination: need to modify <file>" \
    --label="coordination-required"
```

### No-Fire Areas (Protected Files)

**Definition:** Files that affect everyone and require human approval or dedicated infrastructure missions.

```yaml
protected_files:
  - package.json
  - bun.lock
  - drizzle/schema/index.ts
  - apps/api/src/index.ts
  - .env.example
  - tsconfig.json
```

**Rules:**

- No mission claims AO on protected files
- Changes require human coordination
- Violations flagged during `/army plan`

### Waves as Phase Lines

**Definition:** All missions in Wave N must complete before Wave N+1 begins. Checkpoints are the gates.

```
WAVE 0 ──────────────────────────────────────────────
   │
   ├── Mission: Auth+Team (AO: auth/**, teams/**)
   ├── Mission: Vendors (AO: vendors/**)
   ├── Mission: Parts/BOM (AO: parts/**)
   │
   ▼
══════════════════ CHECKPOINT 1 ═════════════════════
   │
   │  Human reviews, closes checkpoint
   │
   ▼
WAVE 1 ──────────────────────────────────────────────
   │
   ├── Mission: Navigation (AO: components/nav/**)
   ├── Mission: Discord Bot (AO: packages/bot/**)
   │
   ▼
══════════════════ CHECKPOINT 2 ═════════════════════
```

**Why waves work:** Within a wave, missions have non-overlapping AOs—they run safely in parallel. Between waves, checkpoints ensure stability before new work begins.

### Synchronization Matrix

**Definition:** A grid showing what every mission owns, revealing conflicts before deployment.

```
                      │ auth/** │ teams/** │ vendors/** │ parts/** │ shared/ui/** │
──────────────────────┼─────────┼──────────┼────────────┼──────────┼──────────────│
Mission: Auth+Team    │   AO    │    AO    │     -      │    -     │      AI      │
Mission: Vendors      │    -    │     -    │     AO     │    AI    │      AI      │
Mission: Parts/BOM    │    -    │     -    │     AI     │    AO    │      AI      │
Mission: UI Polish    │    -    │     -    │     -      │    -     │      AO      │
```

**Conflict Detection:** If two missions both have `AO` in the same column, you have a conflict. Resolve before deploying.

### Deconfliction Rules

1. **Exclusive AO:** No two missions in the same wave can have overlapping AOs
2. **AI is Read-Only:** Files in your AI can be read but never modified
3. **Protected Files Require Coordination:** No-fire areas need human approval
4. **Main Effort Gets Priority:** When conflicts arise, main effort mission gets the file
5. **Boundary Crossings Create Beads:** Need a file outside AO? Create coordination bead

---

## Current State Analysis

### What Works Well

| Feature           | Status | Notes                          |
| ----------------- | ------ | ------------------------------ |
| Wave deployment   | ✓      | Parallel agent launch works    |
| Checkpoint gates  | ✓      | Blocking dependencies enforced |
| Review workflow   | ✓      | Code/Security/UI reviews       |
| Fix deployment    | ✓      | Automated issue resolution     |
| Retro process     | ✓      | Skills created from learnings  |
| Skill preparation | ✓      | Forward-looking skill creation |

### Gaps to Address

| Gap                     | Impact                     | Solution                           |
| ----------------------- | -------------------------- | ---------------------------------- |
| No AO/AI definitions    | Agents may modify any file | Add territory metadata to missions |
| No conflict detection   | Merge conflicts possible   | Add `/army plan` with sync matrix  |
| No boundary enforcement | Agents exceed scope        | Add boundary rules to prompts      |
| No protected files list | Infrastructure can break   | Add no-fire areas config           |
| BuildSeason-specific    | Not reusable               | Extract to plugin                  |

### Current Subcommands

```
status             - Wave progress and checkpoint gates
deploy <wave>      - Launch parallel agents
review <wave>      - Code/Security/UI audits
deploy-fixes       - Fix discovered issues
prepare-checkpoint - Generate human review doc
process-feedback   - Convert feedback to beads
retro <wave>       - After-action review
prepare <wave>     - Forward-looking skills
```

---

## Target Architecture

### New Subcommand: `plan`

**Usage:** `/army plan <wave>`

**Purpose:** Generate and validate the synchronization matrix before deployment.

**Output (Clean):**

```
═══════════════════════════════════════════════════════════════
                 WAVE 1 SYNCHRONIZATION MATRIX
═══════════════════════════════════════════════════════════════

Missions: 2
  • Navigation (buildseason-b5u.1)
  • Discord Bot (buildseason-il2.1)

File Ownership Matrix:
                          │ nav/**  │ bot/**  │ shared/** │
──────────────────────────┼─────────┼─────────┼───────────│
Mission: Navigation       │   AO    │    -    │    AI     │
Mission: Discord Bot      │    -    │   AO    │    AI     │

Conflicts: NONE ✓

Protected Files:
  • package.json — NO MISSIONS TOUCH ✓
  • drizzle/schema/index.ts — NO MISSIONS TOUCH ✓

Ready to deploy: /army deploy 1
═══════════════════════════════════════════════════════════════
```

**Output (Conflict Detected):**

```
CONFLICT DETECTED:
  • Navigation and UI-Polish both claim AO on: components/sidebar/**

Resolution options:
  1. Sequence: Run Navigation first, then UI-Polish
  2. Merge: Combine into single mission
  3. Refactor: Split sidebar into nav-specific and general components

Cannot deploy until resolved.
```

### Enhanced `deploy` Prompt

Agent prompts now include explicit boundary rules:

```markdown
You are an agent in the BuildSeason army.

MISSION: Auth & Team Management
BEAD: buildseason-5pw.2 (Team CRUD)

AREA OF OPERATIONS (you may modify):

- apps/api/src/routes/teams/\*\*
- apps/web/src/features/teams/\*\*
- drizzle/schema/teams.ts

AREA OF INTEREST (read-only):

- apps/api/src/lib/db.ts
- drizzle/schema/index.ts

BOUNDARY RULES:
✓ Full authority to modify ANY file in your AO
✓ May read files in your AI
✗ Do NOT modify files in your AI
✗ Do NOT touch files outside both lists

If you need a file outside your AO:

1. STOP current work
2. Create coordination bead:
   bd create --title="Coordination: need <file>" --label="coordination-required"
3. Continue with other aspects of your task
4. Note the dependency in your commit message
```

### Mission Definition Schema

Each mission (epic bead) should define:

```yaml
mission:
  id: buildseason-5pw
  name: "Auth & Team Management"
  wave: 0

  # WHY this mission exists
  purpose: |
    Enable multi-user team collaboration so robotics teams
    can coordinate parts ordering and robot builds.

  # WHAT success looks like
  end_state: |
    Users can create accounts, form teams, invite members,
    and manage roles. All auth flows work on mobile and desktop.

  # Files this mission OWNS
  area_of_operations:
    - apps/api/src/routes/auth/**
    - apps/api/src/routes/teams/**
    - apps/web/src/features/auth/**
    - drizzle/schema/users.ts
    - drizzle/schema/teams.ts

  # Files this mission READS
  area_of_interest:
    - apps/api/src/lib/db.ts
    - apps/api/src/lib/auth.ts
    - drizzle/schema/index.ts

  # Child beads (tasks)
  tasks:
    - buildseason-5pw.1 # User registration
    - buildseason-5pw.2 # Team CRUD
    - buildseason-5pw.3 # Invite flow

  # Missions that cannot run in parallel (AO conflicts)
  conflicts: []

  # Missions that must complete first
  dependencies: []
```

### Configuration File

New file: `.claude/army.yaml`

```yaml
# Agent Army Configuration

version: "1.0"

# Project-specific protected files
protected_files:
  - package.json
  - bun.lock
  - drizzle/schema/index.ts
  - apps/api/src/index.ts
  - .env.example
  - tsconfig.json
  - tsconfig.*.json

# Default model for agents
default_model: sonnet

# Wave definitions (can also be derived from beads)
waves:
  0:
    checkpoint: buildseason-6ea
    missions:
      - buildseason-8o9 # UI Framework
      - buildseason-5pw # Auth & Team
      - buildseason-ck0 # Vendor Directory
      - buildseason-03y # BOM
      - buildseason-8mf # Robots & Seasons
  1:
    checkpoint: buildseason-2zlp
    requires: buildseason-6ea
    missions:
      - buildseason-b5u.1 # Navigation
      - buildseason-il2.1 # Discord Bot
  2:
    checkpoint: buildseason-z942
    requires: buildseason-2zlp
    missions:
      - buildseason-b5u.2 # Dashboard
      - buildseason-b5u.3 # Calendar
      - buildseason-il2.2 # Agent SDK
      - buildseason-il2.3 # Claude MCP

# Review configuration
reviews:
  code:
    skill: code-review
    run_in_background: true
  security:
    skill: security-review
    run_in_background: true
  ui:
    skill: ui-design-review
    run_in_background: false # Chrome MCP requires foreground
```

---

## Subcommand Reference

### Updated Workflow

```
/army plan N                ← NEW: Validate sync matrix, detect conflicts
    ↓
/army deploy N              ← Enhanced with AO/AI in prompts
    ↓
Wave N Agents Complete
    ↓
/army review N              ← Code+Security parallel, UI foreground
    ↓
/army deploy-fixes N        ← Fix P0-P1 issues
    ↓
/army prepare-checkpoint N  ← Generate CP doc
    ↓
Human Review + Feedback
    ↓
/army process-feedback N    ← Convert feedback → beads
    ↓
Human closes checkpoint
    ↓
/army retro N               ← After-action review
    ↓
/army prepare N+1           ← Forward-looking skills
    ↓
/army plan N+1              ← Validate next wave
```

### Subcommand Summary

| Subcommand           | Purpose                             | Key Changes                     |
| -------------------- | ----------------------------------- | ------------------------------- |
| `plan`               | **NEW** - Pre-deployment validation | Sync matrix, conflict detection |
| `status`             | Show progress                       | Add AO conflict warnings        |
| `deploy`             | Launch agents                       | Add AO/AI to prompts            |
| `review`             | Run audits                          | No change                       |
| `deploy-fixes`       | Fix issues                          | Add boundary awareness          |
| `prepare-checkpoint` | Generate summary                    | Include boundary violations     |
| `process-feedback`   | Handle feedback                     | No change                       |
| `retro`              | After-action                        | Track boundary issues           |
| `prepare`            | Forward skills                      | Include AO planning             |

---

## Data Model

### Bead Metadata Extensions

Add to mission (epic) beads:

```yaml
# In bead description or structured metadata
metadata:
  type: mission
  wave: 0
  area_of_operations:
    - apps/api/src/routes/auth/**
    - apps/web/src/features/auth/**
  area_of_interest:
    - apps/api/src/lib/db.ts
```

### Label Conventions (Extended)

| Label                   | Meaning                          |
| ----------------------- | -------------------------------- |
| `ao:<pattern>`          | Area of Operations pattern       |
| `ai:<pattern>`          | Area of Interest pattern         |
| `coordination-required` | Needs cross-mission coordination |
| `boundary-violation`    | Agent modified outside AO        |
| `main-effort`           | Priority mission for this wave   |

### Graph Structure

```
Wave Epic (buildseason-w0)
│
├── Mission: Auth (buildseason-5pw)
│   │   labels: [ao:apps/api/src/routes/auth/**, ao:drizzle/schema/users.ts]
│   │
│   ├── Task: Registration (buildseason-5pw.1)
│   ├── Task: Team CRUD (buildseason-5pw.2)
│   └── Task: Invites (buildseason-5pw.3)
│
├── Mission: Vendors (buildseason-ck0)
│   │   labels: [ao:apps/api/src/routes/vendors/**]
│   │
│   └── Task: Vendor CRUD (buildseason-ck0.1)
│
└── Checkpoint: CP1 (buildseason-6ea)
        blocks: [Wave 1 Epic]
```

---

## Migration Plan

### Phase 1: Configuration (1 session)

1. Create `.claude/army.yaml` with protected files
2. Add wave definitions to config
3. No changes to existing beads or workflow

**Validation:** `/army status` still works

### Phase 2: AO Labels (1-2 sessions)

1. Add `ao:<pattern>` labels to existing mission beads
2. Add `ai:<pattern>` labels for read dependencies
3. Update mission bead descriptions with structured metadata

**Commands:**

```bash
bd label buildseason-5pw ao:apps/api/src/routes/auth/**
bd label buildseason-5pw ao:apps/web/src/features/auth/**
bd label buildseason-5pw ai:apps/api/src/lib/db.ts
```

**Validation:** Labels visible in `bd show`

### Phase 3: Plan Subcommand (1 session)

1. Implement `/army plan <wave>`
2. Parse AO labels from mission beads
3. Generate synchronization matrix
4. Detect and report conflicts

**Validation:** `/army plan 2` shows matrix, detects any conflicts

### Phase 4: Enhanced Prompts (1 session)

1. Update `/army deploy` to include AO/AI in agent prompts
2. Add boundary rules section
3. Include coordination bead creation instructions

**Validation:** Deployed agents respect boundaries (manual observation)

### Phase 5: Boundary Tracking (ongoing)

1. Add `boundary-violation` label for issues
2. Include boundary metrics in retros
3. Update review skills to check for violations

**Validation:** Retros report boundary compliance %

### Migration Checklist

```
[ ] Phase 1: Create .claude/army.yaml
[ ] Phase 1: Add protected_files list
[ ] Phase 1: Add wave definitions
[ ] Phase 2: Label mission beads with ao: patterns
[ ] Phase 2: Label mission beads with ai: patterns
[ ] Phase 3: Implement /army plan subcommand
[ ] Phase 3: Add sync matrix generation
[ ] Phase 3: Add conflict detection
[ ] Phase 4: Update deploy prompts with AO/AI
[ ] Phase 4: Add boundary rules to prompts
[ ] Phase 5: Track boundary-violation labels
[ ] Phase 5: Add boundary metrics to retro
```

---

## Plugin Packaging

### Goal

Extract the `/army` command, related skills, and configuration into a standalone Claude Code plugin that can be:

1. Published to a marketplace repository
2. Installed in other projects
3. Maintained independently

### Plugin Structure

```
claude-army-plugin/
├── plugin.yaml              # Plugin manifest
├── README.md                # Documentation
├── LICENSE                  # MIT or similar
│
├── commands/
│   └── army.md              # Main /army command
│
├── skills/
│   ├── army-concepts/       # AO/AI/Boundaries documentation
│   │   └── SKILL.md
│   ├── code-review/
│   │   └── SKILL.md
│   ├── security-review/
│   │   └── SKILL.md
│   └── ui-design-review/
│       └── SKILL.md
│
├── templates/
│   ├── army.yaml.template   # Project config template
│   ├── mission.yaml         # Mission definition template
│   └── checkpoint.md        # Checkpoint doc template
│
├── hooks/
│   └── pre-deploy.sh        # Optional pre-deployment hook
│
└── tests/
    ├── test-plan.md         # Manual test scenarios
    └── fixtures/            # Test bead fixtures
```

### Plugin Manifest (`plugin.yaml`)

```yaml
name: claude-army
version: "1.0.0"
description: >
  Agent army orchestration for parallel AI development.
  Based on U.S. Army battlespace management doctrine.

author: BuildSeason
repository: https://github.com/caryden/claude-army-plugin
license: MIT

# Plugin capabilities
provides:
  commands:
    - army
  skills:
    - army-concepts
    - code-review
    - security-review
    - ui-design-review

# Dependencies
requires:
  - beads # Depends on beads plugin for issue tracking

# Project configuration
config_file: army.yaml
config_template: templates/army.yaml.template

# Installation hooks
hooks:
  post_install: |
    echo "Claude Army installed!"
    echo "Run: /army status to get started"
    echo "Configure: .claude/army.yaml"
```

### Installation Methods

**Method 1: Direct from GitHub**

```bash
# In Claude Code session
claude plugins install github:caryden/claude-army-plugin
```

**Method 2: From marketplace (future)**

```bash
claude plugins install army
```

**Method 3: Local development**

```bash
# Clone plugin repo
git clone https://github.com/caryden/claude-army-plugin.git

# Link to current project
claude plugins link ./claude-army-plugin
```

### Configuration Merging

When installed, the plugin provides defaults that merge with project config:

```yaml
# Plugin defaults (in plugin)
protected_files:
  - package.json
  - "*.lock"
  - tsconfig.json

# Project overrides (in .claude/army.yaml)
protected_files:
  - package.json
  - bun.lock
  - drizzle/schema/index.ts  # Project-specific
```

### Extracting from BuildSeason

**Step 1: Create plugin repo**

```bash
mkdir -p ~/github/claude-army-plugin
cd ~/github/claude-army-plugin
git init
```

**Step 2: Copy and generalize files**

```bash
# Copy command
cp ~/github/buildseason/.claude/commands/army.md commands/

# Copy skills
cp -r ~/github/buildseason/.claude/skills/code-review skills/
cp -r ~/github/buildseason/.claude/skills/security-review skills/
cp -r ~/github/buildseason/.claude/skills/ui-design-review skills/

# Remove BuildSeason-specific references
# - Replace "buildseason-" bead prefixes with "<project>-"
# - Remove hardcoded wave definitions
# - Generalize checkpoint bead references
```

**Step 3: Create templates**

```bash
# army.yaml template with placeholders
# Mission definition template
# Checkpoint document template
```

**Step 4: Update BuildSeason to use plugin**

```bash
# In buildseason project
claude plugins install github:caryden/claude-army-plugin

# Create project-specific army.yaml
cat > .claude/army.yaml << 'EOF'
# BuildSeason Army Configuration
# Extends: claude-army-plugin defaults

project_prefix: buildseason

waves:
  0:
    checkpoint: buildseason-6ea
    missions: [...]
  # ...
EOF
```

### Testing Plugin Installation

**Test in fresh project:**

```bash
# Create test project
mkdir /tmp/test-army-plugin
cd /tmp/test-army-plugin
git init

# Install plugin
claude plugins install github:caryden/claude-army-plugin

# Verify
claude /army status
# Should show: "No army.yaml found. Run /army init to create one."

# Initialize
claude /army init
# Creates .claude/army.yaml from template

# Verify configuration
cat .claude/army.yaml
```

**Test in BuildSeason:**

```bash
cd ~/github/buildseason

# Remove local army.md (will use plugin version)
mv .claude/commands/army.md .claude/commands/army.md.backup

# Install plugin
claude plugins install github:caryden/claude-army-plugin

# Verify existing workflow still works
claude /army status
claude /army plan 2
```

### Versioning Strategy

- **Major:** Breaking changes to command interface
- **Minor:** New subcommands, backward-compatible features
- **Patch:** Bug fixes, documentation updates

```yaml
# In plugin.yaml
version: "1.0.0"

# Changelog in CHANGELOG.md
## [1.0.0] - 2025-01-01
### Added
- Initial release
- Core subcommands: status, plan, deploy, review
- AO/AI boundary enforcement
- Synchronization matrix
```

---

## Testing Strategy

### Unit Tests

| Test                 | Description               |
| -------------------- | ------------------------- |
| Config parsing       | army.yaml loads correctly |
| AO pattern matching  | Glob patterns match files |
| Conflict detection   | Overlapping AOs flagged   |
| Protected file check | No-fire areas enforced    |

### Integration Tests

| Test                 | Description                         |
| -------------------- | ----------------------------------- |
| Wave deployment      | Agents launch with correct prompts  |
| Boundary enforcement | Agent stops at AO boundary          |
| Coordination flow    | Coordination bead created correctly |
| Review workflow      | All three reviews complete          |

### Manual Test Scenarios

**Scenario 1: Clean Deploy**

```
Given: Wave 1 with no AO conflicts
When: /army plan 1
Then: Sync matrix shows CLEAN, ready to deploy
```

**Scenario 2: Conflict Detection**

```
Given: Two missions both claim sidebar/**
When: /army plan 1
Then: CONFLICT flagged, resolution options shown
```

**Scenario 3: Boundary Crossing**

```
Given: Agent needs file outside AO
When: Agent attempts modification
Then: Agent creates coordination bead, continues other work
```

**Scenario 4: Plugin Install**

```
Given: Fresh project with no army config
When: claude plugins install github:caryden/claude-army-plugin
Then: /army status shows init prompt
When: /army init
Then: army.yaml created with defaults
```

---

## Appendix A: Army Doctrine Reference

| Army Term                      | Definition                            | Agent Analog        |
| ------------------------------ | ------------------------------------- | ------------------- |
| AO (Area of Operations)        | Geographic area assigned to commander | Files mission owns  |
| AI (Area of Interest)          | Area that could affect operations     | Files mission reads |
| Boundary                       | Line between units                    | File pattern edge   |
| Phase Line                     | Control measure for timing            | Wave checkpoint     |
| Main Effort                    | Priority unit                         | Main effort mission |
| Fire Support Coordination Line | Beyond which fires are OK             | Outside all AOs     |
| No-Fire Area                   | Protected zone                        | Protected files     |
| Synchronization Matrix         | Time × Unit grid                      | File × Mission grid |

## Appendix B: Label Quick Reference

```bash
# AO/AI labels
bd label <mission> ao:apps/api/src/routes/auth/**
bd label <mission> ai:apps/api/src/lib/db.ts

# Coordination
bd create --title="Coordination: need <file>" --label="coordination-required"

# Violations
bd label <issue> boundary-violation

# Priority
bd label <mission> main-effort
```

## Appendix C: Prompt Template

```markdown
You are an agent in the ${PROJECT} army.

MISSION: ${MISSION_NAME}
BEAD: ${BEAD_ID}
TASK: ${TASK_TITLE}

AREA OF OPERATIONS (you may modify):
${AO_LIST}

AREA OF INTEREST (read-only):
${AI_LIST}

BOUNDARY RULES:
✓ Full authority to modify ANY file in your AO
✓ May read files in your AI
✗ Do NOT modify files in your AI
✗ Do NOT touch files outside both lists

If you need a file outside your AO:

1. STOP current work
2. Create coordination bead:
   bd create --title="Coordination: need <file>" --label="coordination-required"
3. Continue with other aspects of your task
4. Note the dependency in your commit message

DESCRIPTION:
${TASK_DESCRIPTION}

INSTRUCTIONS:

1. Read any files mentioned in the description
2. Read relevant spec docs
3. Implement the required changes
4. Verify: ${VERIFY_COMMAND}
5. Commit with message referencing ${BEAD_ID}
6. Close bead: bd close ${BEAD_ID}
```
