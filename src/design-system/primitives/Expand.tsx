import type { ParentProps } from "solid-js"

export function Expand(props: ParentProps) {
  return <div class="ds-expand">{props.children}</div>
}
