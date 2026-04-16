# Agent Skills Registry

This directory contains specialized agent skills integrated from external repositories, adapted for this Solid 2.0 + Effect project. Each skill provides domain-specific guidance for AI-assisted development.

## Skills Overview

| Skill                    | Source                                                                                                          | Version | Last Updated | Description                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | ------- | ------------ | ---------------------------------------------------- |
| `solid-best-practices`   | Adapted from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | 1.0.0   | 2026-04-16   | Solid 2.0 performance optimization (70+ rules)       |
| `composition-patterns`   | Adapted from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns) | 1.0.0   | 2026-04-16   | Component composition patterns for Solid             |
| `react-view-transitions` | Adapted from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-view-transitions) | 1.0.0   | 2026-04-16   | View Transition API guide (adapted for TanStack Start) |
| `versioncontrol`         | local                                                                                                           | -       | -            | Git/jj version control workflow (see ~/git/effect-tanstack-baseline) |

## Source Repository

**Primary external source:**

- **URL:** https://github.com/vercel-labs/agent-skills
- **Branch:** `main`
- **License:** MIT

## Checking for Updates

To check for skill updates from upstream:

```bash
# Check the latest commit dates on the source repo
curl -s https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/react-best-practices/SKILL.md | head -20
curl -s https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/composition-patterns/SKILL.md | head -20
curl -s https://api.github.com/repos/vercel-labs/agent-skills/commits?path=skills/react-view-transitions/SKILL.md | head -20

# Compare with local files (check git history for .agents/skills/)
git log --oneline --all -- .agents/skills/react-best-practices/SKILL.md
```

## Updating Skills

To update a skill from upstream:

1. Check the source repository for changes
2. Download updated files (preserve local modifications like `tanstack-start.md`)
3. Update the version and date in this README
4. Update the frontmatter in the skill's `SKILL.md`
5. Document any local modifications in the skill's notes below

## Local Modifications

### solid-best-practices

- **Adapted from:** `react-best-practices` 
- **Changes:** React → Solid 2.0 mappings
  - `useState` → `createSignal`
  - `useEffect` → `createEffect`
  - `useMemo` → `createMemo`
  - `useCallback` → Not needed (Solid functions are stable)
  - `Suspense` → `Show` component
  - `startTransition` from Solid
  - `useNavigate` from `@tanstack/solid-router`
- **Date:** 2026-04-16

### react-view-transitions

- **Modified:** `references/nextjs.md` → `references/tanstack-start.md`
- **Reason:** Project uses TanStack Start + Vite instead of Next.js
- **Date:** 2026-04-16
- **Upstream check:** If Next.js guide changes, adapt patterns to TanStack Start

## Skill File Structure

Each skill follows this structure:

```
skills/<skill-name>/
├── SKILL.md          # Skill metadata, triggers, quick reference
├── AGENTS.md         # Full compiled documentation
└── [references/]     # Optional additional guides
    └── *.md
```

The `SKILL.md` frontmatter includes:

- `name`: Unique skill identifier
- `description`: When to use this skill
- `license`: Source license
- `metadata.source`: Git repository URL
- `metadata.version`: Skill version (track upstream)
- `metadata.imported`: Date of last import
- `metadata.commit`: Source commit hash (for precise tracking)
- `metadata.modified`: Whether local modifications were made
- `metadata.modifications`: List of modifications with reasons

## Adding New Skills

When integrating a new skill from vercel-labs/agent-skills:

1. Create directory: `mkdir -p skills/<skill-name>`
2. Download `SKILL.md` and `AGENTS.md` from source
3. Download any `references/*.md` files
4. **Adapt for Solid 2.0:**
   - Replace React hooks with Solid primitives
   - Update imports from `@tanstack/react-router` to `@tanstack/solid-router`
   - Replace `Suspense` with `Show`
   - Remove `useCallback` (not needed in Solid)
5. Update frontmatter with source tracking metadata
6. Add entry to this README
7. Document any local modifications
8. Commit with message: `feat(agents): add <skill-name> skill`
