# Telemetry Guide

Complete guide to observability with OpenTelemetry, Sentry, and Grafana Loki.

## Overview

```mermaid
graph LR
    App[Application] --> Logs[Grafana Loki]
    App --> Traces[Grafana Tempo]
    App --> Errors[Sentry]

    Logs --> Grafana[Grafana Dashboards]
    Traces --> Grafana

    style App fill:#4ecdc4
    style Grafana fill:#ff6b6b
```

See [TESTING_AND_TELEMETRY.md](../../TESTING_AND_TELEMETRY.md) for complete documentation.

## Quick Start

### Server-Side Tracing

**Profiling note:** Continuous profiling (Pyroscope) is **Node-only**. Bun runs without profiling.

```typescript
import { Effect } from "effect"
import { createSentryTelemetryLayer } from "./lib/telemetry-server"

const TelemetryLive = createSentryTelemetryLayer({
  serviceName: "my-service",
  environment: "production",
})

const program = Effect
  .gen(function*() {
    yield* Effect.log("Processing request")
    // Your code here
  })
  .pipe(Effect.withSpan("myOperation"))

Effect.runPromise(program.pipe(Effect.provide(TelemetryLive)))
```

#### Effect.fn Spans (Automatic)

Use `Effect.fn` for named, traced functions. This creates spans automatically at call sites when OpenTelemetry is enabled.

```typescript
import { Effect } from "effect"

const fetchUser = Effect.fn("fetchUser")(function*(userId: string) {
  // business logic
  return { id: userId }
})
```

Minimal rule: use `Effect.fn` for important service functions, and `Effect.withSpan` for ad-hoc blocks or extra attributes.

### Client-Side Error Tracking

```typescript
import { initClientSentry } from "./lib/telemetry-client"

initClientSentry({
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})
```

### Logging to Loki

```typescript
import { createLokiLoggerLayer } from "./lib/logger-loki"

const LoggerLive = createLokiLoggerLayer({
  endpoint: "http://localhost:3100/loki/api/v1/push",
  labels: { job: "my-app" },
})
```

## Viewing Data

- **Grafana**: http://localhost:3001
- **Sentry**: http://localhost:9000

See [Telemetry Example](../../src/telemetry-example.ts) for complete examples.
