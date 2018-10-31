export type Intersection<Union> = (Union extends infer U
  ? (u: U) => any
  : never) extends (i: infer I) => any
  ? I
  : never
