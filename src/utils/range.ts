export function* range(n: number, m?: number): IterableIterator<number> {
  for (let i = m ? n : 0; i < (m || n); i++) {
    yield i
  }
}
