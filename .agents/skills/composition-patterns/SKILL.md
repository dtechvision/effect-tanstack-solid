---
name: composition-patterns
description:
  Component composition patterns that scale. Use when refactoring components with
  boolean prop proliferation, building flexible component libraries, or
  designing reusable APIs. Triggers on tasks involving compound components,
  context providers, or component architecture. Adapted for Solid 2.0.
license: MIT
metadata:
  author: vercel (adapted for Solid)
  version: '1.0.0'
  source: "https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns"
  imported: "2026-04-16"
  commit: "7f05869"
  modified: true
  modifications:
    - skill: "composition-patterns"
      adapted_for: "Solid 2.0"
      changes:
        - "React references → Solid 2.0"
        - "useContext → useContext (same API)"
        - "Removed forwardRef section (not applicable)"
      reason: "Project uses Solid 2.0 instead of React"
---

# Composition Patterns

Composition patterns for building flexible, maintainable components. Avoid
boolean prop proliferation by using compound components, lifting state, and
composing internals. These patterns make codebases easier for both humans and AI
agents to work with as they scale.

## When to Apply

Reference these guidelines when:

- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |

## Quick Reference

### 1. Component Architecture (HIGH)

- `architecture-avoid-boolean-props` - Don't add boolean props to customize
  behavior; use composition
- `architecture-compound-components` - Structure complex components with shared
  context

### 2. State Management (MEDIUM)

- `state-decouple-implementation` - Provider is the only place that knows how
  state is managed
- `state-context-interface` - Define generic interface with state, actions, meta
  for dependency injection
- `state-lift-state` - Move state into provider components for sibling access

### 3. Implementation Patterns (MEDIUM)

- `patterns-explicit-variants` - Create explicit variant components instead of
  boolean modes
- `patterns-children-over-render-props` - Use children for composition instead
  of renderX props

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
