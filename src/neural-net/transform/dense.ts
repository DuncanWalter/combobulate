import { TransformationFactory } from '.'
import {
  matrix,
  matAddMat,
  matMulCol,
  colMulRow,
  rowMulMat,
  scaleMat,
} from '../batchMath'

export function denseTransform(
  outputSize: number,
  seed: (i: number, j: number, n: number) => number = (i, j, n) =>
    (((i + j) % 2 === 0 ? 1 : -1) / Math.sqrt(n)) * Math.random(),
): TransformationFactory {
  return ({ size: inputSize, serializedContent }) => {
    const weights = serializedContent
      ? JSON.parse(serializedContent)
      : matrix(outputSize, inputSize, (i, j) => seed(i, j, inputSize))
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
      applyLearning(replacement: number) {
        scaleMat(replacement, deltas, deltas)
        matAddMat(weights, deltas, weights)
        deltas = matrix(outputSize, inputSize, () => 0)
      },
      serialize() {
        return JSON.stringify(weights)
      },
      size: outputSize,
    }
  }
}
