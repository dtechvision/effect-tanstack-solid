import type { JSX } from "solid-js"
import { Show } from "solid-js"
import { Stack } from "../primitives/Stack"
import { Text } from "./Text"

type TextFieldProps = {
  readonly label: string
  readonly value: string
  readonly type?: "text" | "date"
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>
  readonly onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
  readonly error?: string
  readonly hint?: string
  readonly id?: string
}

const toFieldId = (label: string): string =>
  `field-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "") || "input"}`

export function TextField(props: TextFieldProps) {
  const id = props.id ?? toFieldId(props.label)

  return (
    <div class="ds-field">
      <Stack gap="2xs">
        <label for={id}><Text tone="label">{props.label}</Text></label>
        <input
          id={id}
          class="ds-input"
          type={props.type ?? "text"}
          value={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          onInput={props.onInput}
          onChange={props.onChange}
        />
        <Show when={props.error}>
          <Text tone="danger">{props.error}</Text>
        </Show>
        <Show when={props.hint && !props.error}>
          <Text tone="caption">{props.hint}</Text>
        </Show>
      </Stack>
    </div>
  )
}
