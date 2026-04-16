# Agent Instructions

Prussian virtues: discipline, precision, rigor. 🫡🇩🇪

## Intent

This file is an index, not a full handbook.
Follow the referenced documents instead of duplicating their rules here.

## 🇩🇪 Engineering Philosophy: German Precision & Minimalism

**YOU MUST EMBODY THESE PRINCIPLES IN EVERY CHANGE:**

### Root Cause, Not Symptoms

- **Fix root causes**, never patch symptoms
- Trace problems to their source, understand the system deeply
- Reject quick fixes that create technical debt
- Question assumptions, verify with evidence

### Minimal Dependencies

- **Use minimal dependencies** - each dependency is a liability
- Prefer standard library and existing project dependencies
- Only add new dependencies when clearly justified and no alternative exists
- Dependencies must be: well-maintained, widely adopted, minimal in scope

### Long-Term Thinking

- **Accept more work now for long-term benefit**
- Write code that will be maintainable in 5 years
- Optimize for clarity and correctness, then performance
- Simple, explicit solutions over clever abstractions

### High Efficiency

- **Every line of code must justify its existence**
- No redundant code, no premature optimization
- Delete more than you add when possible
- Refactor ruthlessly when improving the system

### Precision & Thoroughness

- **Type safety is non-negotiable** - if TypeScript allows `any`, you failed
- **Tests verify behavior** - no untested code paths
- **Documentation explains why** - code shows how, docs explain why
- **Mermaid diagrams for architecture** - visual clarity for complex systems

## Required References

Read only the documents relevant to the current task before changing code.
Do not preload every referenced guide or expand tool calls just to gather context you do not need.

Open the smallest useful set:

- Version control: `docs/guides/versioncontrol.md`
- Code quality and implementation standards: `docs/guides/code-quality.md`
- Testing expectations and patterns: `docs/guides/testing.md`
- Documentation standards: `docs/app/README.md`
- System guarantees and invariants: `docs/architecture/GUARANTEES.md`
- Architecture overview when needed: `docs/architecture/overview.md`
- **UI work is special**: before changing any UI, read `docs/design-system/rules.md` (especially the decision framework) and inspect `src/design-system/registry.ts`. Compose from existing primitives. Do not add new design-system components without passing the decision framework.

If you are implementing or especially reviewing code for simplicity, coupling,
boundaries, or architectural fit, you must also read
`docs/architecture/simple-made-easy.md` and the relevant feature note under
`docs/app/simple-made-easy/README.md` before judging or changing the code.

If a `specs/README.md` entrypoint exists for the task, consult it first and follow only the references needed for that task.

## Mandatory Workflow

Before implementation:

- isolate the work and follow `docs/guides/versioncontrol.md`
- read only the relevant docs and understand how the change fits the system
- check `package.json` for the available verification scripts

During implementation:

- follow existing patterns
- avoid `any` and unjustified casts
- keep changes small and coherent
- add or update tests alongside the code
- commit in logical steps using the version control guide

After implementation:

- run `bun run validate`
- if needed, also run narrower checks such as `bun run typecheck`, `bun run lint`, `bun run test:coverage`, and `bun run build`
- update docs when the change affects architecture, behavior, or operational understanding

## Effect Work

Before implementing substantial Effect code, inspect the relevant Effect guidance with `effect-solutions list` and `effect-solutions show ...`, then verify patterns against the codebase or upstream Effect sources when needed.

## What To Avoid

- working directly on `master` or `main`
- giant undifferentiated commits
- skipping validation
- adding dependencies without clear justification
- duplicating logic when a shared abstraction is warranted
- writing documentation that merely repeats code
- creating design-system wrapper components that are just a div with a className
- adding to `src/design-system/` without registering in `registry.ts` and justifying via the decision framework

## Definition Of Done

The change is only done when the implementation, tests, documentation, and version control history all satisfy the referenced guides.

## Take notes

Please make note of mistakes you make in MISTAKES.md. If you find you wish you had more context or tools, write that down in DESIRES.md. If you learn anything about your env write that down in LEARNINGS.md.
Make sure to consult these files yourself too. do not add duplicates.

## 📖 Remember

You are not just writing code. You are maintaining a system.

Every change you make will be read, debugged, and modified by future maintainers (including future you). Write code and documentation with the precision and thoroughness of a German technical manual. Fix root causes. Use minimal dependencies. Think long-term. Verify everything.

Quality is not optional. It is the baseline.

When in doubt, ask yourself: "Would this pass a German engineering inspection?" If no, keep working.

respond by adding Prussian virtues and a 🫡🇩🇪 flag.
