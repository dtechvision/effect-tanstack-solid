import { For } from "solid-js"
import { Button } from "./Button"

type TabItem<T extends string> = {
  readonly key: T
  readonly label: string
  readonly count: number
}

type TabsProps<T extends string> = {
  readonly id: string
  readonly activeTab: T
  readonly items: ReadonlyArray<TabItem<T>>
  readonly onChange: (key: T) => void
}

export function Tabs<T extends string>(props: TabsProps<T>) {
  return (
    <div class="ds-tabs" role="tablist" aria-label={props.id}>
      <For each={props.items}>
        {(item) => (
          <Button
            variant={props.activeTab === item().key ? "primary" : "secondary"}
            onClick={() => props.onChange(item().key)}
          >
            {`${item().label} ${item().count}`}
          </Button>
        )}
      </For>
    </div>
  )
}
