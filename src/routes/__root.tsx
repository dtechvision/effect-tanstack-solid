/// <reference types="vite/client" />
import "../index.css"
import { RegistryProvider } from "@effect/atom-solid"
import { createRootRoute, Outlet, Scripts } from "@tanstack/solid-router"
import { HydrationScript } from "@solidjs/web"
import type { JSX } from "solid-js"

if (import.meta.env.DEV && !import.meta.env.SSR) {
  void import("react-grab")
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootError,
  notFoundComponent: () => <p>Not Found</p>
})

function RootError(props: { error: Error }) {
  return (
    <div style={{ padding: "20px", color: "red" }}>
      <h1>Error</h1>
      <pre>{props.error.message}</pre>
      <pre>{props.error.stack}</pre>
    </div>
  )
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument(props: Readonly<{ children: JSX.Element }>) {
  return (
    <>
      <HydrationScript />
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>effect-tanstack-solid</title>
        </head>
        <body>
          <RegistryProvider defaultIdleTTL={60_000}>
            {props.children}
          </RegistryProvider>
          <Scripts />
        </body>
      </html>
    </>
  )
}
