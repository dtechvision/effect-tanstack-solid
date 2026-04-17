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
import { 
  useDashboard, 
  updateTodoRpc, 
  deleteTodoRpc,
  createErrorMessage,
  isNetworkError,
  logError
} from "./dashboard-context"
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

/**
 * Individual todo item component with full error handling.
 * 
 * Error handling features:
 * - Network errors: Show retry option
 * - Business errors (not found): Inform user
 * - Generic errors: Display message with refresh option
 * - Error logging: Full context preserved in console
 */
export function TodoItem(props: { readonly todo: Todo }) {
  const [isEditing, setIsEditing] = createSignal(false)
  const [editTitle, setEditTitle] = createSignal(props.todo.title)
  const [editDueDate, setEditDueDate] = createSignal(props.todo.dueDate ?? "")
  const [isLoading, setIsLoading] = createSignal(false)
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)
  const [isRetryable, setIsRetryable] = createSignal(false)
  const { refetch } = useDashboard()

  /**
   * Handle async operation with comprehensive error handling.
   * 
   * Pattern:
   * 1. Clear previous error state
   * 2. Set loading state
   * 3. Execute operation
   * 4. On success: refresh dashboard
   * 5. On error: classify, log, and display appropriate message
   * 6. Always: clear loading state
   */
  const handleOperation = async (
    operation: () => Promise<void>,
    context: string
  ) => {
    setErrorMessage(null)
    setIsRetryable(false)
    setIsLoading(true)
    
    try {
      await operation()
      // Success: refresh dashboard to show updated state
      refetch()
    } catch (err) {
      // Error: classify and handle appropriately
      logError(context, err)
      
      // Check if this is a retryable network error
      if (isNetworkError(err)) {
        setIsRetryable(true)
      }
      
      // Create user-friendly message
      setErrorMessage(createErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    handleOperation(
      async () => {
        await updateTodoRpc(props.todo.id, { completed: !props.todo.completed })
      },
      `TodoItem.toggle(${props.todo.id})`
    )
  }

  const handleDelete = () => {
    handleOperation(
      async () => {
        await deleteTodoRpc(props.todo.id)
      },
      `TodoItem.delete(${props.todo.id})`
    )
  }

  const handleSaveEdit = () => {
    const title = editTitle().trim()
    if (title.length === 0) return

    handleOperation(
      async () => {
        await updateTodoRpc(props.todo.id, {
          title,
          dueDate: parseTodoDateInput(editDueDate())
        })
        setIsEditing(false)
      },
      `TodoItem.saveEdit(${props.todo.id})`
    )
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
                  setErrorMessage(null)
                  setIsRetryable(false)
                }}
              >
                Cancel
              </Button>
            </Inline>
          </form>
        </Show>

        {/* Error Display with Retry Option */}
        <Show when={errorMessage()}>
          <Inline gap="xs" wrap>
            <Text tone="danger">{errorMessage()}</Text>
            
            {isRetryable() ? (
              <Button 
                variant="secondary" 
                onClick={() => { 
                  setErrorMessage(null)
                  refetch() 
                }}
              >
                Retry
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                onClick={() => { 
                  setErrorMessage(null)
                  refetch() 
                }}
              >
                Refresh dashboard
              </Button>
            )}
          </Inline>
        </Show>
      </Stack>
    </Card>
  )
}
