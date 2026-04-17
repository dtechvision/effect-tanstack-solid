/**
 * AsyncResult initialization validation.
 * 
 * useAtomValue initializes to null before atom mounts. AsyncResult type guards
 * access _tag directly and crash on null. Pre-seeding with useAtomInitialValues
 * prevents this by ensuring a valid AsyncResult state from first render.
 */
import { expect, test, describe } from "vitest"
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult"

describe("AsyncResult initialization", () => {
  test("AsyncResult.initial(true) returns valid waiting state", () => {
    const initial = AsyncResult.initial(true)
    expect(AsyncResult.isInitial(initial)).toBe(true)
    expect(AsyncResult.isWaiting(initial)).toBe(true)
  })

  test("type guards work on Initial state", () => {
    const initial = AsyncResult.initial(true)
    expect(() => AsyncResult.isWaiting(initial)).not.toThrow()
    expect(() => AsyncResult.isSuccess(initial)).not.toThrow()
    expect(() => AsyncResult.isFailure(initial)).not.toThrow()
  })

  test("type guards throw on null (demonstrates pre-seeding necessity)", () => {
    expect(() => AsyncResult.isWaiting(null as unknown as never)).toThrow()
    expect(() => AsyncResult.isSuccess(null as unknown as never)).toThrow()
    expect(() => AsyncResult.isFailure(null as unknown as never)).toThrow()
  })
})
