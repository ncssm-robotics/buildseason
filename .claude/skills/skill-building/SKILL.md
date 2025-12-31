---
name: skill-building
description: Create, structure, and optimize Claude Code skills. Use when creating a new skill, improving an existing skill, or needing guidance on skill design patterns, triggers, frontmatter, progressive disclosure, or skill testing.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir:*), Bash(chmod:*)
---

# Skill Building Guide

A meta-skill for creating effective Claude Code skills. Skills teach Claude domain-specific expertise that activates automatically based on context matching.

## Quick Reference

| Element         | Purpose                                  | Example                                                 |
| --------------- | ---------------------------------------- | ------------------------------------------------------- |
| `name`          | Unique identifier (kebab-case)           | `api-validation`                                        |
| `description`   | Triggers + capabilities (max 1024 chars) | "Validate API responses. Use when writing endpoints..." |
| `allowed-tools` | Restrict tool access                     | `Read, Grep, Glob`                                      |
| `SKILL.md`      | Core instructions (max ~500 lines)       | Overview, patterns, quick examples                      |
| Reference files | Detailed docs loaded on-demand           | `REFERENCE.md`, `EXAMPLES.md`                           |
| Scripts         | Executable utilities (zero context cost) | `scripts/validate.py`                                   |

## Skills vs Commands vs CLAUDE.md

| Type          | Invocation                    | Use Case                              |
| ------------- | ----------------------------- | ------------------------------------- |
| **Skill**     | Automatic (semantic matching) | Domain expertise, multi-file patterns |
| **Command**   | Explicit (`/command`)         | User-triggered actions, workflows     |
| **CLAUDE.md** | Always loaded                 | Project-wide rules, environment setup |

**Rule of thumb:** If you want Claude to automatically know when to apply knowledge, use a skill. If the user needs to explicitly request it, use a command.

## Skill Anatomy

```
.claude/skills/my-skill/
├── SKILL.md          # Required - core instructions
├── REFERENCE.md      # Optional - detailed API/patterns
├── EXAMPLES.md       # Optional - concrete examples
├── CHECKLIST.md      # Optional - verification steps
└── scripts/          # Optional - executable utilities
    ├── validate.sh
    └── generate.py
```

## Writing the Description (Critical)

The description determines when Claude activates the skill. It must answer:

1. **WHAT** does this skill do? (capabilities)
2. **WHEN** should Claude use it? (trigger keywords)

### Good Descriptions

```yaml
# Specific capabilities + clear triggers
description: >-
  Validate API request/response schemas using Zod. Use when creating
  API endpoints, writing request handlers, validating user input,
  or fixing validation errors.
```

```yaml
# Multiple trigger scenarios
description: >-
  Component patterns for React with shadcn/ui. Use when creating
  components, updating UI, fixing styling issues, or implementing
  accessible interfaces.
```

### Bad Descriptions

```yaml
# Too vague - won't trigger reliably
description: Helps with API stuff.

# Missing triggers - Claude won't know when to use it
description: Contains patterns for form validation.

# Too broad - will trigger when inappropriate
description: Use for any code-related task.
```

## Frontmatter Reference

```yaml
---
name: my-skill-name # Required: kebab-case, max 64 chars
description: >- # Required: max 1024 chars
  What this skill does.
  Use when [trigger conditions].
allowed-tools: Read, Grep # Optional: restrict to these tools
model: claude-sonnet-4-20250514 # Optional: force specific model
---
```

### Tool Restriction Patterns

```yaml
# Read-only skill (safe for sensitive codebases)
allowed-tools: Read, Grep, Glob

# Can run specific commands
allowed-tools: Read, Write, Edit, Bash(npm:*), Bash(bun:*)

# Full access (omit field entirely)
# allowed-tools: (not specified)
```

## Progressive Disclosure

Keep SKILL.md focused. Link to details that load only when needed:

```markdown
# API Validation Skill

## Quick Start

[Essential patterns here - what 80% of users need]

## Detailed Reference

For schema patterns, see [REFERENCE.md](REFERENCE.md).
For migration examples, see [EXAMPLES.md](EXAMPLES.md).

## Utilities

Validate a schema file:
\`\`\`bash
./scripts/validate.sh schema.ts
\`\`\`
```

**Benefits:**

- Claude reads linked files only when task requires them
- Scripts execute without loading content (zero token cost)
- SKILL.md stays under ~500 lines

**One-level rule:** Link directly from SKILL.md. Avoid A→B→C chains.

## Content Structure

### DO Patterns (What to do)

```markdown
## Patterns

- Use Zod for all request validation
- Return typed error responses
- Include field-level error messages
- Validate at API boundary, trust internal calls
```

### DON'T Patterns (Anti-patterns)

```markdown
## Anti-Patterns

- ❌ Inline validation logic in handlers
- ❌ Catch-all error messages ("Invalid input")
- ❌ Skip validation for "trusted" internal routes
- ❌ Validate same data multiple times
```

### Examples (Concrete code)

```markdown
## Examples

### Good: Typed validation with clear errors

\`\`\`typescript
const CreateUserSchema = z.object({
email: z.string().email("Invalid email format"),
name: z.string().min(1, "Name is required"),
});

app.post("/users", async (c) => {
const result = CreateUserSchema.safeParse(await c.req.json());
if (!result.success) {
return c.json({ errors: result.error.flatten() }, 400);
}
// result.data is typed
});
\`\`\`

### Bad: Untyped, unclear errors

\`\`\`typescript
// ❌ No schema, no types, generic error
app.post("/users", async (c) => {
const body = await c.req.json();
if (!body.email) return c.json({ error: "Bad request" }, 400);
});
\`\`\`
```

## Including Scripts

Scripts execute without loading content - use them for:

- Validation utilities
- Code generation
- Linting/formatting
- Complex transformations

```markdown
## Utilities

Generate a Zod schema from TypeScript:
\`\`\`bash
./scripts/ts-to-zod.sh src/types/user.ts
\`\`\`

Validate all schemas:
\`\`\`bash
./scripts/validate-all.sh
\`\`\`
```

Make scripts executable:

```bash
chmod +x scripts/*.sh scripts/*.py
```

## Skill Categories

| Category      | Purpose           | Examples                                        |
| ------------- | ----------------- | ----------------------------------------------- |
| **Universal** | Any project       | `testing-guide`, `code-review`, `accessibility` |
| **Framework** | Tech-specific     | `tanstack-query`, `hono-api`, `drizzle-orm`     |
| **Domain**    | Business-specific | `ftc-robotics`, `bom-management`                |
| **Process**   | Workflow-specific | `pr-review`, `deployment`, `security-audit`     |

## Testing Skills

### Verify skill loads

```
What skills are available?
```

### Test trigger matching

Ask something that should match the description:

```
How should I validate this API request?
```

Claude should ask permission to use the skill.

### Debug mode

```bash
claude --debug
```

Shows skill loading, errors, registration.

### Checklist

- [ ] Description includes WHAT and WHEN
- [ ] SKILL.md under ~500 lines
- [ ] Examples show good AND bad patterns
- [ ] Scripts are executable
- [ ] Tool restrictions match skill purpose
- [ ] Tested with realistic prompts

## Common Mistakes

| Mistake                | Fix                                  |
| ---------------------- | ------------------------------------ |
| Vague description      | Add specific trigger keywords        |
| SKILL.md too long      | Extract to REFERENCE.md, EXAMPLES.md |
| No anti-patterns       | Always show what NOT to do           |
| Scripts not executable | `chmod +x scripts/*`                 |
| Nested file links      | Keep one level deep                  |
| Hardcoded secrets      | Use env vars, MCP connections        |

## Skill Creation Workflow

1. **Identify the need** - Repeated prompts? Domain expertise? Pattern enforcement?
2. **Draft description** - Write WHAT + WHEN triggers
3. **Structure content** - Core in SKILL.md, details in linked files
4. **Add examples** - Good and bad patterns with code
5. **Create utilities** - Scripts for validation, generation
6. **Test activation** - Does it trigger on right prompts?
7. **Iterate** - Refine description based on real usage

## Template

Use this to start a new skill:

```markdown
---
name: my-skill
description: >-
  [What this skill does - specific capabilities].
  Use when [trigger scenario 1], [trigger scenario 2],
  or [trigger scenario 3].
allowed-tools: Read, Write, Edit, Glob, Grep
---

# [Skill Name]

[One paragraph overview of what this skill provides]

## Quick Start

[Most common use case with minimal example]

## Patterns

- [Pattern 1]
- [Pattern 2]
- [Pattern 3]

## Anti-Patterns

- ❌ [Anti-pattern 1]
- ❌ [Anti-pattern 2]

## Examples

### Good: [Descriptive title]

\`\`\`typescript
// Good example code
\`\`\`

### Bad: [Descriptive title]

\`\`\`typescript
// ❌ Bad example code
\`\`\`

## Additional Resources

- For detailed patterns, see [REFERENCE.md](REFERENCE.md)
- For more examples, see [EXAMPLES.md](EXAMPLES.md)
```

## References

- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Skills Explained Blog Post](https://claude.com/blog/skills-explained)
- [Extending Claude with Skills and MCP](https://claude.com/blog/extending-claude-capabilities-with-skills-mcp-servers)
