import type { JSX } from "solid-js"
import { Inline } from "../primitives/Inline"
import { Text } from "./Text"

type CheckboxProps = {
  readonly checked: boolean
  readonly disabled?: boolean
  readonly onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
  readonly label: JSX.Element
  readonly hint?: string
}

export function Checkbox(props: CheckboxProps) {
  return (
    <div class="ds-checkbox">
      <Inline gap="s" align="start">
        <input
          type="checkbox"
          checked={props.checked}
          disabled={props.disabled}
          onChange={props.onChange}
        />
        <div>
          {props.label}
          {props.hint ? <Text tone="caption">{props.hint}</Text> : null}
        </div>
      </Inline>
    </div>
  )
}
