import { TransformationFactory, SimplifiedTransformation } from '.'
import { vector, rowZip, add, mapRow } from '../batchMath'

type BiasSeeder = (inputSize: number) => (index: number) => number

const defaultSeed: BiasSeeder = size => index =>
  ((index % 2 === 0 ? 1 : -1) / Math.sqrt(size)) * Math.random()

export function biasTransform(
  seeder: BiasSeeder = defaultSeed,
): TransformationFactory<SimplifiedTransformation<{ learningRate: number }>> {
  return function biasFactory({ size, serializedContent }) {
    const initializer = seeder(size)
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
      applyLearning(config) {
        mapRow(deltas, x => config.learningRate * x, deltas)
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
