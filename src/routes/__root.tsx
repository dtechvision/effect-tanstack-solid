/// <reference types="vite/client" />
import "../index.css"
import { RegistryProvider } from "@effect/atom-solid"
import { createRootRoute, Outlet, Scripts } from "@tanstack/solid-router"
import { HydrationScript } from "@solidjs/web"
import { type JSX, Loading } from "solid-js"

if (import.meta.env.DEV && !import.meta.env.SSR) {
  void import("react-grab")
}

export const Route = createRootRoute({
  component: RootComponent
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument(props: Readonly<{ children: JSX.Element }>) {
  return (
    <html lang="en">
      <head>
        <HydrationScript />
        <title>effect-tanstack-solid</title>
      </head>
      <body>
        <RegistryProvider defaultIdleTTL={60_000}>
          <Loading fallback={<div>Loading...</div>}>{props.children}</Loading>
        </RegistryProvider>
        <Scripts />
      </body>
    </html>
  )
}
