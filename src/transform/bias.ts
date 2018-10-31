import { TransformationFactory, SimplifiedTransformation } from '.'
import { vector, rowZip, add, mapRow } from '../batchMath'

type BiasSeeder = (inputSize: number) => (index: number) => number

const defaultSeed: BiasSeeder = size => index =>
  ((index % 2 === 0 ? 1 : -1) / Math.sqrt(size)) * Math.random()

export function biasTransform(
  seeder: BiasSeeder = defaultSeed,
): TransformationFactory<
  SimplifiedTransformation<{ learningRate: number; inertia?: number }>
> {
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
        const { learningRate, inertia = 0 } = config
        const dialation = 1 / (1 - inertia)
        const update = mapRow(deltas, x => (learningRate * x) / dialation)
        rowZip(weights, update, add, weights)
        mapRow(deltas, x => (x * (dialation - 1)) / dialation, deltas)
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
