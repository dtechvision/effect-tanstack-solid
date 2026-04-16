import { createFileRoute } from "@tanstack/solid-router"
import { App } from "./-index/app"

export const Route = createFileRoute("/")({
  component: App,
})
