import { TransformationFactory } from '.'
import { mapRow } from '../batchMath'

export function sigmoid(n: number) {
  return 2 / (1 + Math.exp(-n)) - 1
}

export function sigmoidPrime(n: number) {
  const sig = sigmoid(n)
  return 2 * sig * (1 - sig)
}

export function sigmoidTransform(): TransformationFactory {
  return ({ size }) => ({
    type: 'uniform',
    passForward(input: number[]) {
      const output = mapRow(input, sigmoid)
      return { trace: output, output }
    },
    passBack(output: number[], error: number[]) {
      return mapRow(error, (e, i) => e * 2 * output[i] * (1 - output[i]))
    },
    serialize() {
      return 'null'
    },
    applyLearning() {},
    size,
  })
}
