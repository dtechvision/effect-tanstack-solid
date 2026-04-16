import type * as Schema from "effect/Schema"
import * as Atom from "effect/unstable/reactivity/Atom"

/**
 * Typed serializable interface for atoms.
 */
export interface TypedSerializable<A, I> {
  readonly [Atom.SerializableTypeId]: {
    readonly key: string
    readonly encode: (value: A) => I
    readonly decode: (value: I) => A
  }
}

/**
 * Makes an atom serializable with a schema codec.
 *
 * @param options - Serializaton options with key and schema codec.
 * @returns A function that wraps an atom with serializable capability.
 *
 * @example
 * ```ts
 * const myAtom = runtime.atom(effect).pipe(
 *   serializable({
 *     key: "my-atom",
 *     schema: Schema.toCodecJson(MySchema)
 *   })
 * )
 * ```
 */
export const serializable: {
  <R extends Atom.Atom<unknown>, S extends Schema.Codec<Atom.Type<R>, any>>(
    options: {
      readonly key: string
      readonly schema: S
    }
  ): (self: R) => R & TypedSerializable<Atom.Type<R>, Schema.Codec.Encoded<S>>
  <R extends Atom.Atom<unknown>, S extends Schema.Codec<Atom.Type<R>, any>>(
    self: R,
    options: {
      readonly key: string
      readonly schema: S
    }
  ): R & TypedSerializable<Atom.Type<R>, Schema.Codec.Encoded<S>>
} = Atom.serializable as typeof serializable

/**
 * Dehydrated atom payload for SSR hydration.
 */
export interface DehydratedAtom {
  readonly "~@effect-atom/atom/DehydratedAtom": true
  readonly key: string
  readonly value: object
  readonly dehydratedAt: number
}

/**
 * Encodes a serializable atom value into a stable hydration payload.
 *
 * @param atom - The serializable atom definition that owns the value.
 * @param value - The current atom value to encode.
 * @param dehydratedAt - The timestamp supplied by the caller at the boundary.
 * @returns A DehydratedAtom payload suitable for server-to-client hydration.
 */
export const dehydrate = <A, I>(
  atom: Atom.Atom<A> & TypedSerializable<A, I>,
  value: A,
  dehydratedAt: number
): DehydratedAtom => ({
  "~@effect-atom/atom/DehydratedAtom": true,
  key: atom[Atom.SerializableTypeId].key,
  value: atom[Atom.SerializableTypeId].encode(value) as object,
  dehydratedAt,
})
