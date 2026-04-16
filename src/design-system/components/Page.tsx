import type { ParentProps } from "solid-js"
import { Stack } from "../primitives/Stack"

export function Page(props: ParentProps) {
  return (
    <main class="ds-page">
      <Stack gap="xl">{props.children}</Stack>
    </main>
  )
}
