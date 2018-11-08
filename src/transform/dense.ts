import { TransformationFactory, SimplifiedTransformation } from '.'
import {
  matrix,
  matAddMat,
  matMulCol,
  colMulRow,
  rowMulMat,
  scaleMat,
} from '../batchMath'
import { normal } from '../utils/gaussian'

type DenseSeeder = (
  inputSize: number,
  outputSize: number,
) => (row: number, column: number) => number

const defaultSeeder: DenseSeeder = inputSize => () =>
  normal() / Math.sqrt(inputSize)

export function denseTransform(
  outputSize: number,
  seeder: DenseSeeder = defaultSeeder,
): TransformationFactory<
  SimplifiedTransformation<{
    learningRate: number
    inertia?: number
  }>
> {
  return function denseFactory({ size: inputSize, serializedContent }) {
    const initializer = seeder(inputSize, outputSize)
    const weights = serializedContent
      ? JSON.parse(serializedContent)
      : matrix(outputSize, inputSize, initializer)
    let deltas = matrix(outputSize, inputSize, () => 0)
    return {
      type: 'simplified',
      passForward(batch) {
        return rowMulMat(batch, weights)
      },
      passBack(error, input) {
        matAddMat(deltas, colMulRow(input, error), deltas)
        return matMulCol(weights, error)
      },
      applyLearning(config) {
        const { learningRate, inertia = 0 } = config
        const dialation = 1 / (1 - inertia)
        const update = scaleMat(learningRate / dialation, deltas)
        matAddMat(weights, update, weights)
        scaleMat((dialation - 1) / dialation, deltas, deltas)
      },
      clean() {
        deltas = matrix(outputSize, inputSize, () => 0)
      },
      serialize() {
        return JSON.stringify(weights)
      },
      size: outputSize,
    }
  }
}
