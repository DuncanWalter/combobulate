/**
 * Not technically sound as the children of this input are unions,
 * not recursive intersections. This would be overkill.
 */
export type Intersection<Union> = (Union extends Record<infer K, any>
  ? K
  : never) extends infer Keys
  ? [Keys] extends [string]
    ? { [K in Keys]: Union extends Record<K, infer T> ? T : never }
    : never
  : never
