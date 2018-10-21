import { TransformationFactory } from '.'
import {
  matrix,
  matAddMat,
  matMulCol,
  colMulRow,
  rowMulMat,
} from '../batchMath'

const defaultSeed = (inputSize: number) => (row: number, column: number) =>
  (((row + column) % 2 === 0 ? 1 : -1) / Math.sqrt(inputSize)) * Math.random()

export function denseTransform<H>(
  outputSize: number,
  seed: (
    inputSize: number,
    outputSize: number,
  ) => (row: number, column: number) => number = defaultSeed,
): TransformationFactory<H> {
  return ({ size: inputSize, serializedContent }) => {
    const initializer = seed(inputSize, outputSize)
    const weights = serializedContent
      ? JSON.parse(serializedContent)
      : matrix(outputSize, inputSize, initializer)
    let deltas = matrix(outputSize, inputSize, () => 0)
    return {
      type: 'simplified',
      passForward(batch) {
        return rowMulMat(batch, weights)
      },
      passBack(batch: number[], error) {
        matAddMat(deltas, colMulRow(batch, error), deltas)
        return matMulCol(weights, error)
      },
      applyLearning() {
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
