import type { TodoGroup } from "../../api/todo-schema"
import { Badge } from "../../design-system/components/Badge"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { Inline } from "../../design-system/primitives/Inline"
import { Stack } from "../../design-system/primitives/Stack"
import { TodoItem } from "./todo-item"

type TodoGroupSectionProps = {
  readonly group: TodoGroup
}

export function TodoGroupSection(props: TodoGroupSectionProps) {
  return (
    <Stack gap="m">
      <Inline align="between" wrap>
        <Stack gap="2xs">
          <Heading as="h3" tone="section">{props.group.label}</Heading>
          <Text tone="muted">
            {props.group.count === 0
              ? "No tasks in this group."
              : `${props.group.count} task${props.group.count === 1 ? "" : "s"}`}
          </Text>
        </Stack>
        <Badge tone="neutral">{props.group.count}</Badge>
      </Inline>
      <Stack gap="s">
        {props.group.todos.map((todo) => <TodoItem todo={todo} />)}
      </Stack>
    </Stack>
  )
}
