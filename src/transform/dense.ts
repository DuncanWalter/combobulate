import { TransformationFactory, SimplifiedTransformation } from '.'
import {
  matrix,
  matAddMat,
  matMulCol,
  colMulRow,
  rowMulMat,
  scaleMat,
} from '../batchMath'

type DenseSeeder = (
  inputSize: number,
  outputSize: number,
) => (row: number, column: number) => number

const defaultSeeder: DenseSeeder = inputSize => (row, column) =>
  (((row + column) % 2 === 0 ? 1 : -1) / Math.sqrt(inputSize)) * Math.random()

export function denseTransform(
  outputSize: number,
  seeder: DenseSeeder = defaultSeeder,
): TransformationFactory<SimplifiedTransformation<{ learningRate: number }>> {
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
        scaleMat(config.learningRate, deltas, deltas)
        matAddMat(weights, deltas, weights)
        deltas = matrix(outputSize, inputSize, () => 0)
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
