/**
 * Design system component registry.
 */
export const registry = {
  foundation: {
    "foundation/classes.ts": "cx helper for DS internals",
    "foundation/tokens.ts": "typed spacing tokens"
  },
  primitives: {
    "primitives/Stack.tsx": "vertical layout primitive",
    "primitives/Inline.tsx": "horizontal layout primitive",
    "primitives/Grid.tsx": "named responsive grid layouts",
    "primitives/Expand.tsx": "flex grow primitive",
    "primitives/Surface.tsx": "semantic surface wrapper"
  },
  components: {
    "components/Page.tsx": "page wrapper",
    "components/Card.tsx": "content surface",
    "components/Button.tsx": "semantic button",
    "components/Heading.tsx": "semantic headings",
    "components/Text.tsx": "semantic text",
    "components/Badge.tsx": "status badge",
    "components/TextField.tsx": "labeled text input",
    "components/Checkbox.tsx": "labeled checkbox",
    "components/Tabs.tsx": "tab list with counts",
    "components/PageHeader.tsx": "title and description pattern",
    "components/StatCard.tsx": "dashboard metric card",
    "components/EmptyState.tsx": "empty data pattern",
    "components/ErrorState.tsx": "error recovery pattern"
  }
} as const

export const registeredPaths: ReadonlyArray<string> = [
  ...Object.keys(registry.foundation),
  ...Object.keys(registry.primitives),
  ...Object.keys(registry.components),
  "registry.ts"
]
