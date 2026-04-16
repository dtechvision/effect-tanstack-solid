import type { ParentProps } from "solid-js"
import { cx } from "../foundation/classes"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

type ButtonProps = ParentProps<{
  readonly variant?: ButtonVariant
  readonly loading?: boolean
  readonly disabled?: boolean
  readonly type?: "button" | "submit" | "reset"
  readonly onClick?: (event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => void
}>

export function Button(props: ButtonProps) {
  return (
    <button
      type={props.type ?? "button"}
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
      class={cx("ds-button", `ds-button-${props.variant ?? "secondary"}`)}
    >
      {props.loading ? "Working..." : props.children}
    </button>
  )
}
