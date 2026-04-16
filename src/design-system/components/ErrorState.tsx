import { Button } from "./Button"
import { Card } from "./Card"
import { Heading } from "./Heading"
import { Stack } from "../primitives/Stack"
import { Text } from "./Text"

type ErrorStateProps = {
  readonly title: string
  readonly description: string
  readonly actionLabel?: string
  readonly onAction?: () => void
}

export function ErrorState(props: ErrorStateProps) {
  return (
    <Card tone="danger">
      <Stack gap="s">
        <Stack gap="2xs">
          <Heading as="h3" tone="section">{props.title}</Heading>
          <Text tone="muted">{props.description}</Text>
        </Stack>
        {props.actionLabel && props.onAction
          ? (
            <div>
              <Button variant="secondary" onClick={props.onAction}>{props.actionLabel}</Button>
            </div>
          )
          : null}
      </Stack>
    </Card>
  )
}
