import { createSignal, Show } from "solid-js"
import type { Todo } from "../../api/todo-schema"
import { Badge } from "../../design-system/components/Badge"
import { Button } from "../../design-system/components/Button"
import { Card } from "../../design-system/components/Card"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { TextField } from "../../design-system/components/TextField"
import { Expand } from "../../design-system/primitives/Expand"
import { Inline } from "../../design-system/primitives/Inline"
import { Stack } from "../../design-system/primitives/Stack"
import { useDashboard, updateTodoRpc, deleteTodoRpc, isRpcError, toError } from "./dashboard-context"
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
  const [error, setError] = createSignal<string | null>(null)
  const { refetch } = useDashboard()

  const handleToggle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await updateTodoRpc(props.todo.id, { completed: !props.todo.completed })
      refetch()
    } catch (err) {
      const error = toError(err)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await deleteTodoRpc(props.todo.id)
      refetch()
    } catch (err) {
      const error = toError(err)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    const title = editTitle().trim()
    if (title.length === 0) return

    setIsLoading(true)
    setError(null)
    try {
      await updateTodoRpc(props.todo.id, {
        title,
        dueDate: parseTodoDateInput(editDueDate())
      })
      setIsEditing(false)
      refetch()
    } catch (err) {
      const error = toError(err)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card as="article" tone={error() ? "danger" : "default"}>
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
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </Inline>
          </form>
        </Show>

        <Show when={error()}>
          <Inline gap="xs" wrap>
            <Text tone="danger">{error()}</Text>
            <Button variant="secondary" onClick={() => { setError(null); refetch() }}>
              Refresh dashboard
            </Button>
          </Inline>
        </Show>
      </Stack>
    </Card>
  )
}
