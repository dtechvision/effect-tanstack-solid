export const cx = (...parts: ReadonlyArray<string | false | null | undefined>): string =>
  parts.filter((part): part is string => Boolean(part)).join(" ")
