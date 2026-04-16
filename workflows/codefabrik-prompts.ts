import { buildDefaultSpecPrompt } from "./codefabrik-default-spec"

export type ValidationSection = {
  success: boolean
  errors: Array<string>
}

export type ValidationResult = {
  success: boolean
  typecheck: ValidationSection
  lint: ValidationSection
  test: ValidationSection
  build: ValidationSection
}

type CommitOutput = {
  changeId: string
  description: string
}

type DiscoverOutput = {
  done: boolean
  ticket: string
  context: string
  remainingCount: number
}

type ImplementOutput = {
  summary: string
  changes: Array<string>
}

type ReviewOutput = {
  issues: Array<string>
}

export type PromptContext = {
  latest(output: "discover", id: "discover"): DiscoverOutput | undefined
  latest(output: "implement", id: "implement"): ImplementOutput | undefined
  latest(output: "review", id: "review"): ReviewOutput | undefined
  latest(output: "validate", id: "validate"): ValidationResult | undefined
  outputs(output: "commit"): Array<CommitOutput> | undefined
}

type RevisionState = {
  changeId: string
  hasDescription: boolean
  isEmpty: boolean
}

/**
 * Parse jj revision state from a fixed newline-delimited template.
 * @param stdout Raw jj log output.
 * @returns Parsed revision metadata.
 */
export function parseRevisionState(stdout: string): RevisionState {
  const [changeId = "", isEmpty = "false", hasDescription = "false"] = stdout
    .split("\n")

  return {
    changeId,
    hasDescription: hasDescription === "true",
    isEmpty: isEmpty === "true",
  }
}

/**
 * Determine whether a revision is an orphaned empty transition commit.
 * @param state Parsed revision metadata.
 * @returns Whether the revision should be abandoned before commit.
 */
export function isRevisionStateEmptyUndescribed(
  state: RevisionState,
): boolean {
  return state.isEmpty && !state.hasDescription
}

const emptyValidationResult: ValidationResult = {
  success: true,
  typecheck: { success: true, errors: [] },
  lint: { success: true, errors: [] },
  test: { success: true, errors: [] },
  build: { success: true, errors: [] },
}

/**
 * Render validation failures for the fix prompt.
 * @param validation Validation result to render.
 * @returns Prompt-ready validation errors.
 */
export function formatValidationErrors(validation: ValidationResult): string {
  const sections: Array<string> = []
  if (!validation.typecheck.success) {
    sections.push(
      `## TypeScript errors\n${validation.typecheck.errors.join("\n")}`,
    )
  }
  if (!validation.lint.success) {
    sections.push(`## Lint errors\n${validation.lint.errors.join("\n")}`)
  }
  if (!validation.test.success) {
    sections.push(`## Test failures\n${validation.test.errors.join("\n")}`)
  }
  if (!validation.build.success) {
    sections.push(`## Build errors\n${validation.build.errors.join("\n")}`)
  }
  return sections.join("\n\n") || "No errors found."
}

/**
 * Build the spec section used by discovery.
 * @param spec Inline spec input.
 * @param specsPath Spec entrypoint path.
 * @param todoPath Todo path.
 * @returns Discover prompt input section.
 */
export function buildSpecSection(
  spec: string | undefined,
  specsPath: string,
  todoPath: string,
): string {
  const defaultPrompt = buildDefaultSpecPrompt(specsPath, todoPath)
  return spec
    ? `${defaultPrompt}\n\n## Additional run input\n${spec}`
    : defaultPrompt
}

/**
 * Summarize earlier commits from this run.
 * @param ctx Workflow context.
 * @returns Summary of previous commits.
 */
export function formatPreviousWork(ctx: PromptContext): string {
  const commits = ctx.outputs("commit")
  if (!commits || commits.length === 0) {
    return "No commits yet - this is the first iteration."
  }

  return commits
    .map((commit) => `- [${commit.changeId}] ${commit.description}`)
    .join("\n")
}

/**
 * Summarize the previous discovery step.
 * @param ctx Workflow context.
 * @returns Summary of the previous discovery step.
 */
export function formatPreviousDiscovery(ctx: PromptContext): string {
  const previousDiscovery = ctx.latest("discover", "discover")
  if (!previousDiscovery) {
    return "First discovery."
  }

  return `Last ticket: "${previousDiscovery.ticket}" (remaining: ${previousDiscovery.remainingCount})`
}

/**
 * Build the prompt for the discover task.
 * @param ctx Workflow context.
 * @param spec Inline spec input.
 * @param specsPath Spec entrypoint path.
 * @param todoPath Todo path.
 * @returns Discover-task prompt.
 */
export function buildDiscoverPrompt(
  ctx: PromptContext,
  spec: string | undefined,
  specsPath: string,
  todoPath: string,
): string {
  return `You are a spec-driven ticket decomposer.

${buildSpecSection(spec, specsPath, todoPath)}

## Your job
Read the workflow inputs and the current codebase. Identify what remains to be done.
Return the NEXT SINGLE ticket to implement: the smallest meaningful vertical slice.

If everything in the spec is already implemented, tested, and passing, set done=true.

## Previous work this run
${formatPreviousWork(ctx)}

## Previous discovery
${formatPreviousDiscovery(ctx)}

Return done=false with a clear ticket description, or done=true if the spec is fully implemented.`
}

/**
 * Build the prompt for the implement task.
 * @param ctx Workflow context.
 * @returns Implement-task prompt.
 */
export function buildImplementPrompt(ctx: PromptContext): string {
  return `Read prompts/reviewers/TIGERSTYLE.md for code quality standards.
Read AGENTS.md for project conventions.

## Ticket
${ctx.latest("discover", "discover")?.ticket ?? "No ticket available."}

## Context
${ctx.latest("discover", "discover")?.context ?? ""}

Implement this ticket. Write tests alongside code. Keep changes minimal and focused.
If already implemented, report a no-op.`
}

/**
 * Build the prompt for the review task.
 * @param ctx Workflow context.
 * @returns Review-task prompt.
 */
export function buildReviewPrompt(ctx: PromptContext): string {
  return `Review the implementation of this ticket against prompts/reviewers/TIGERSTYLE.md and AGENTS.md.

## Ticket
${ctx.latest("discover", "discover")?.ticket ?? ""}

## Implementation summary
${ctx.latest("implement", "implement")?.summary ?? "No implementation summary."}

## Changes
${ctx.latest("implement", "implement")?.changes?.join("\n") ?? "None"}

Return approved=true only if code is consistent, explicit, type-safe.
If issues found, list them - the next iteration's implement step will see them.`
}

/**
 * Build the prompt for the fix task.
 * @param ctx Workflow context.
 * @returns Fix-task prompt.
 */
export function buildFixPrompt(ctx: PromptContext): string {
  const validation = ctx.latest("validate", "validate") ?? emptyValidationResult
  return `Validation failed after implementing this ticket. Fix the errors.
Do NOT disable lint rules, skip tests, or use \`any\`. Fix root causes.

## Ticket that was implemented
${ctx.latest("discover", "discover")?.ticket ?? ""}

## Review issues
${ctx.latest("review", "review")?.issues?.join("\n") ?? "None"}

## Validation errors
${formatValidationErrors(validation)}`
}
