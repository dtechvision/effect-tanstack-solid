# Agent Skills Registry

This directory contains specialized agent skills for AI-assisted development with Solid 2.0, Effect, and TanStack Start.

## Skills Overview

| Skill                    | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `solid-best-practices`   | Solid 2.0 performance optimization (70+ rules)       |
| `composition-patterns`   | Component composition patterns for scalable Solid apps |
| `view-transitions`       | View Transition API guide for TanStack Solid Start   |
| `versioncontrol`         | Git/jj version control workflow enforcement          |

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
- `license`: License information
- `metadata.version`: Skill version
- `metadata.updated`: Date of last update

## Adding New Skills

When adding a new skill:

1. Create directory: `mkdir -p skills/<skill-name>`
2. Create `SKILL.md` with frontmatter and quick reference
3. Create `AGENTS.md` with full documentation
4. Add any reference files in `references/`
5. Add entry to this README
6. Commit with message: `feat(agents): add <skill-name> skill`
