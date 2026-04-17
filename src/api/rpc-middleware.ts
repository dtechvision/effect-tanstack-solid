import * as Effect from "effect/Effect"

/**
 * RPC error to HTTP status code mapping.
 * This is a utility for manual error handling in RPC handlers.
 */
export const getHttpStatus = (error: unknown): number => {
  // Check for Schema validation errors
  if (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    error._tag === "ParseError"
  ) {
    return 400 // Bad request for validation errors
  }
  
  // Check for tagged errors with httpApiStatus
  if (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error
  ) {
    // Business errors should be defined with { httpApiStatus: number }
    const errorWithStatus = error as { httpApiStatus?: number }
    if (typeof errorWithStatus.httpApiStatus === "number") {
      return errorWithStatus.httpApiStatus
    }
    
    // Default business errors to 400
    return 400
  }
  
  return 500
}

/**
 * Log RPC error with context.
 */
export const logRpcError = (context: string, error: unknown): Effect.Effect<void> => {
  if (
    typeof error === "object" &&
    error !== null &&
    "_tag" in error
  ) {
    return Effect.logError(`[${context}] RPC Error (${String(error._tag)}):`, error)
  }
  
  return Effect.logError(`[${context}] RPC Error:`, error)
}

/**
 * Wrap an RPC handler with error logging.
 */
export const withErrorLogging = <A, E, R>(
  handler: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  handler.pipe(
    Effect.tapError((error) => logRpcError("RpcHandler", error)),
    Effect.tapDefect((defect) => Effect.logError("[RpcHandler] Defect:", defect))
  )

/**
 * Wrap an RPC handler with timing.
 */
export const withTiming = <A, E, R>(
  handler: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  Effect.gen(function*() {
    const start = performance.now()
    const result = yield* handler
    const duration = performance.now() - start
    yield* Effect.logInfo(`RPC call completed in ${duration.toFixed(2)}ms`)
    return result
  })

/**
 * Combined middleware.
 */
export const withMiddleware = <A, E, R>(
  handler: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  handler.pipe(withErrorLogging, withTiming)
