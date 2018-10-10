interface Array<T> {
  generate<U>(gen: (item: T) => Iterable<U>): U[]
}

Object.defineProperty(Array.prototype, 'generate', {
  value: function generate<T, U>(
    this: T[],
    gen: (item: T) => Iterable<U>,
  ): U[] {
    function* g(iter: Iterable<T>): IterableIterator<U> {
      for (let item of iter) {
        yield* gen(item)
      }
    }
    return [...g(this)]
  },
  enumerable: false,
})
