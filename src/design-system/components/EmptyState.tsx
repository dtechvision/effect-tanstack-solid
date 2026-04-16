import { Card } from "./Card"
import { Heading } from "./Heading"
import { Stack } from "../primitives/Stack"
import { Text } from "./Text"

type EmptyStateProps = {
  readonly title: string
  readonly description: string
}

export function EmptyState(props: EmptyStateProps) {
  return (
    <Card tone="subtle">
      <Stack gap="2xs">
        <Heading as="h3" tone="section">{props.title}</Heading>
        <Text tone="muted">{props.description}</Text>
      </Stack>
    </Card>
  )
}
