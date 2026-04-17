import { createSignal, Show } from "solid-js"
import * as Effect from "effect/Effect"
import type { Todo, UpdateTodoInput } from "../../api/todo-schema"
import { Badge } from "../../design-system/components/Badge"
import { Button } from "../../design-system/components/Button"
import { Card } from "../../design-system/components/Card"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { TextField } from "../../design-system/components/TextField"
import { Expand } from "../../design-system/primitives/Expand"
import { Inline } from "../../design-system/primitives/Inline"
import { Stack } from "../../design-system/primitives/Stack"
import { useDashboard, updateTodo, deleteTodo, toError } from "./dashboard-context"
import { formatTodoDate, parseTodoDateInput, todayTodoDate } from "./todo-date"

const dueTone = (todo: Todo): "accent" | "danger" | "success" | "neutral" => {
  if (todo.completed) return "success"
  if (todo.dueDate === null) return "neutral"
  return todo.dueDate < todayTodoDate() ? "danger" : "accent"
}

const dueLabel = (todo: Todo): string => {
  if (todo.completed) return todo.dueDate === null ? "Completed" : `Completed · due ${formatTodoDate(todo.dueDate)}`
  if (todo.dueDate === null) return "Unscheduled"
  return `Due ${formatTodoDate(todo.dueDate)}`
}

const updatedLabel = (todo: Todo): string => `Updated ${new Date(todo.updatedAt).toLocaleString()}`

export function TodoItem(props: { readonly todo: Todo }) {
  const [isEditing, setIsEditing] = createSignal(false)
  const [editTitle, setEditTitle] = createSignal(props.todo.title)
  const [editDueDate, setEditDueDate] = createSignal(props.todo.dueDate ?? "")
  const [isLoading, setIsLoading] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const { refetch } = useDashboard()

  const handleOperation = async (operation: () => Promise<void>) => {
    setErrorMessage(null)
    setIsLoading(true)
    
    try {
      await operation()
      refetch()
    } catch (err) {
      setErrorMessage(toError(err).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    handleOperation(async () => {
      await Effect.runPromise(updateTodo(props.todo.id, { completed: !props.todo.completed }))
    })
  }

  const handleDelete = () => {
    handleOperation(async () => {
      await Effect.runPromise(deleteTodo(props.todo.id))
    })
  }

  const handleSaveEdit = () => {
    const title = editTitle().trim()
    if (title.length === 0) return

    handleOperation(async () => {
      await Effect.runPromise(updateTodo(props.todo.id, {
        title,
        dueDate: parseTodoDateInput(editDueDate())
      }))
      setIsEditing(false)
    })
  }

  return (
    <Card as="article" tone={errorMessage() ? "danger" : "default"}>
      <Stack gap="m">
        <Inline align="between" wrap>
          <Expand>
            <label class="ds-checkbox-label">
              <Inline gap="s" align="start">
                <input
                  type="checkbox"
                  checked={props.todo.completed}
                  disabled={isLoading()}
                  onChange={handleToggle}
                />
                <div>
                  <Heading as="h4" tone="card">{props.todo.title}</Heading>
                  <Text tone="caption">{updatedLabel(props.todo)}</Text>
                </div>
              </Inline>
            </label>
          </Expand>
          <Inline gap="xs" wrap>
            <Badge tone={dueTone(props.todo)}>{dueLabel(props.todo)}</Badge>
            <Button variant="ghost" onClick={() => setIsEditing(true)} disabled={isLoading()}>Edit</Button>
            <Button variant="danger" onClick={handleDelete} loading={isLoading()}>Delete</Button>
          </Inline>
        </Inline>

        <Show when={isEditing()}>
          <form
            class="ds-grid ds-grid-form"
            onSubmit={(event) => {
              event.preventDefault()
              handleSaveEdit()
            }}
          >
            <TextField label="Task title" value={editTitle()} onInput={(event) => setEditTitle(event.currentTarget.value)} />
            <TextField label="Due date" type="date" value={editDueDate()} onInput={(event) => setEditDueDate(event.currentTarget.value)} />
            <Inline gap="xs" wrap>
              <Button type="submit" loading={isLoading()}>Save</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditTitle(props.todo.title)
                  setEditDueDate(props.todo.dueDate ?? "")
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
            </Inline>
          </form>
        </Show>

        <Show when={errorMessage()}>
          <Inline gap="xs" wrap>
            <Text tone="danger">{errorMessage()}</Text>
            <Button variant="secondary" onClick={refetch}>Refresh</Button>
          </Inline>
        </Show>
      </Stack>
    </Card>
  )
}
