import * as Effect from "effect/Effect"
import * as Option from "effect/Option"

/**
 * AsyncResult represents the state of an asynchronous operation.
 * This is the Effect-native equivalent of React Query's states.
 * 
 * @template A The success value type
 * @template E The error type
 */
export type AsyncResult<A, E = never> =
  | { readonly _tag: "Idle" }
  | { readonly _tag: "Loading"; readonly previousData: Option.Option<A> }
  | { readonly _tag: "Success"; readonly data: A; readonly updatedAt: number }
  | { readonly _tag: "Error"; readonly error: E; readonly previousData: Option.Option<A> }

/**
 * Constructors for AsyncResult states.
 */
export const AsyncResult = {
  idle: (): AsyncResult<never, never> => ({ _tag: "Idle" }),
  
  loading: <A>(previousData?: A): AsyncResult<A, never> => ({
    _tag: "Loading",
    previousData: previousData === undefined ? Option.none() : Option.some(previousData),
  }),
  
  success: <A>(data: A): AsyncResult<A, never> => ({
    _tag: "Success",
    data,
    updatedAt: Date.now(),
  }),
  
  error: <E, A = never>(error: E, previousData?: A): AsyncResult<A, E> => ({
    _tag: "Error",
    error,
    previousData: previousData === undefined ? Option.none() : Option.some(previousData),
  }),
} as const

/**
 * Type guards for AsyncResult.
 */
export const isIdle = <A, E>(result: AsyncResult<A, E>): result is { _tag: "Idle" } =>
  result._tag === "Idle"

export const isLoading = <A, E>(result: AsyncResult<A, E>): result is {
  _tag: "Loading"
  readonly previousData: Option.Option<A>
} => result._tag === "Loading"

export const isSuccess = <A, E>(result: AsyncResult<A, E>): result is {
  _tag: "Success"
  readonly data: A
  readonly updatedAt: number
} => result._tag === "Success"

export const isError = <A, E>(result: AsyncResult<A, E>): result is {
  _tag: "Error"
  readonly error: E
  readonly previousData: Option.Option<A>
} => result._tag === "Error"

/**
 * Get current data from AsyncResult if available.
 */
export const getData = <A, E>(result: AsyncResult<A, E>): Option.Option<A> => {
  switch (result._tag) {
    case "Idle":
      return Option.none()
    case "Loading":
      return result.previousData
    case "Success":
      return Option.some(result.data)
    case "Error":
      return result.previousData
  }
}

/**
 * Map over the success value.
 */
export const map = <A, B>(f: (a: A) => B) =>
  <E>(result: AsyncResult<A, E>): AsyncResult<B, E> => {
    switch (result._tag) {
      case "Idle":
        return result
      case "Loading":
        return {
          ...result,
          previousData: Option.map(result.previousData, f),
        }
      case "Success":
        return AsyncResult.success(f(result.data))
      case "Error":
        return {
          ...result,
          previousData: Option.map(result.previousData, f),
        }
    }
  }

/**
 * Fold an AsyncResult into a single value.
 */
export const match = <A, B, E>(options: {
  readonly onIdle: () => B
  readonly onLoading: (previousData: Option.Option<A>) => B
  readonly onSuccess: (data: A, updatedAt: number) => B
  readonly onError: (error: E, previousData: Option.Option<A>) => B
}) =>
  (result: AsyncResult<A, E>): B => {
    switch (result._tag) {
      case "Idle":
        return options.onIdle()
      case "Loading":
        return options.onLoading(result.previousData)
      case "Success":
        return options.onSuccess(result.data, result.updatedAt)
      case "Error":
        return options.onError(result.error, result.previousData)
    }
  }

/**
 * Create an AsyncResult from an Effect by matching on its result.
 * This handles loading, success, and error states automatically.
 */
export const fromEffect = <A, E>(
  effect: Effect.Effect<A, E, never>,
  previousData?: A
): Effect.Effect<AsyncResult<A, E>, never, never> =>
  Effect.match(effect, {
    onFailure: (error) => AsyncResult.error(error, previousData),
    onSuccess: (data) => AsyncResult.success(data),
  })
