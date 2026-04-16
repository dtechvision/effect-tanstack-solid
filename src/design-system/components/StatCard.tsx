import { Card } from "./Card"
import { Heading } from "./Heading"
import { Stack } from "../primitives/Stack"
import { Text } from "./Text"

type StatCardProps = {
  readonly label: string
  readonly value: number
  readonly helper: string
  readonly tone?: "default" | "accent" | "danger"
}

export function StatCard(props: StatCardProps) {
  const tone = props.tone === "accent"
    ? "accent"
    : props.tone === "danger"
      ? "danger"
      : "default"

  return (
    <Card tone={tone}>
      <Stack gap="2xs">
        <Text tone="caption">{props.label}</Text>
        <Heading as="h3" tone="card">{props.value}</Heading>
        <Text tone="muted">{props.helper}</Text>
      </Stack>
    </Card>
  )
}
