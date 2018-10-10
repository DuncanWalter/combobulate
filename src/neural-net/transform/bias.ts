import { TransformationFactory } from '.'
import { vector, rowZip, add, mul, mapRow } from '../batchMath'

export function biasTransform(
  seed: (i: number, n: number) => number = (i, n) =>
    ((i % 2 === 0 ? 1 : -1) / Math.sqrt(n)) * Math.random(),
): TransformationFactory {
  return ({ size, serializedContent }) => {
    const weights = serializedContent
      ? JSON.parse(serializedContent)
      : vector(size, i => seed(i, size))
    let deltas = vector(size, () => 0)
    return {
      type: 'simplified',
      passForward(batch) {
        return rowZip(batch, weights, add)
      },
      passBack(batch: number[], error) {
        rowZip(deltas, error, add, deltas)
        return error
      },
      applyLearning(replacement: number) {
        rowZip(weights, deltas, (a, b) => a + replacement * b, weights)
        deltas = vector(size, () => 0)
      },
      serialize() {
        return JSON.stringify(weights)
      },
      size,
    }
  }
}
