export const spacing = {
  "2xs": "2xs",
  xs: "xs",
  s: "s",
  m: "m",
  l: "l",
  xl: "xl"
} as const

export type Space = keyof typeof spacing
