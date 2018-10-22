import { TransformationFactory } from '.'
import { vector, rowZip, add } from '../batchMath'

const defaultSeed = (size: number) => (index: number) =>
  ((index % 2 === 0 ? 1 : -1) / Math.sqrt(size)) * Math.random()

export function biasTransform<H>(
  seed: (inputSize: number) => (index: number) => number = defaultSeed,
): TransformationFactory<H> {
  return ({ size, serializedContent }) => {
    const initializer = seed(size)
    const weights = serializedContent
      ? JSON.parse(serializedContent)
      : vector(size, initializer)
    let deltas = vector(size, () => 0)
    return {
      type: 'simplified',
      passForward(batch) {
        return rowZip(batch, weights, add)
      },
      passBack(error: number[]) {
        rowZip(deltas, error, add, deltas)
        return error
      },
      applyLearning() {
        rowZip(weights, deltas, add, weights)
        deltas = vector(size, () => 0)
      },
      clean() {
        deltas = vector(size, () => 0)
      },
      serialize() {
        return JSON.stringify(weights)
      },
      size,
    }
  }
}
