import { Inline } from "../primitives/Inline"
import { Stack } from "../primitives/Stack"
import { Heading } from "./Heading"
import { Text } from "./Text"

type PageHeaderProps = {
  readonly title: string
  readonly description: string
  readonly actions?: import("solid-js").JSX.Element
}

export function PageHeader(props: PageHeaderProps) {
  return (
    <Inline align="between" wrap>
      <Stack gap="2xs">
        <Heading as="h1" tone="page">{props.title}</Heading>
        <Text tone="muted">{props.description}</Text>
      </Stack>
      {props.actions ?? null}
    </Inline>
  )
}
