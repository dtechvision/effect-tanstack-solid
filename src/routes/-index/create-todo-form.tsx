import type { JSX } from "solid-js"
import { createSignal, Show } from "solid-js"
import * as Effect from "effect/Effect"
import { Card } from "../../design-system/components/Card"
import { Heading } from "../../design-system/components/Heading"
import { Text } from "../../design-system/components/Text"
import { TextField } from "../../design-system/components/TextField"
import { Stack } from "../../design-system/primitives/Stack"
import { Button } from "../../design-system/components/Button"
import { parseTodoDateInput } from "./todo-date"
import { useDashboard, createTodo, toError } from "./dashboard-context"

export function CreateTodoForm() {
  const [title, setTitle] = createSignal("")
  const [dueDate, setDueDate] = createSignal("")
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const { refetch } = useDashboard()

  const handleSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent> = async (event) => {
    event.preventDefault()
    const trimmed = title().trim()
    if (trimmed.length === 0) return

    setIsSubmitting(true)
    setError(null)

    try {
      await Effect.runPromise(
        createTodo({ title: trimmed, dueDate: parseTodoDateInput(dueDate()) })
      )
      setTitle("")
      setDueDate("")
      refetch()
    } catch (err) {
      setError(toError(err).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card as="section">
      <Stack gap="m">
        <Stack gap="2xs">
          <Heading as="h2" tone="section">Create work</Heading>
          <Text tone="muted">Give tasks a due date so the dashboard can classify urgency precisely.</Text>
        </Stack>

        <form class="ds-grid ds-grid-form" onSubmit={handleSubmit}>
          <TextField
            label="Task title"
            value={title()}
            onInput={(event) => setTitle(event.currentTarget.value)}
            placeholder="Ship the full dashboard"
            disabled={isSubmitting()}
          />
          <TextField
            label="Due date"
            type="date"
            value={dueDate()}
            onInput={(event) => setDueDate(event.currentTarget.value)}
            disabled={isSubmitting()}
          />
          <Button 
            type="submit" 
            loading={isSubmitting()} 
            disabled={title().trim().length === 0 || isSubmitting()}
          >
            Add task
          </Button>
        </form>

        <Show when={error()}>
          {(err) => <Text tone="danger">{err()}</Text>}
        </Show>
      </Stack>
    </Card>
  )
}
