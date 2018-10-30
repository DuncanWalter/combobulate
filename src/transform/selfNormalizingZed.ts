import { TransformationFactory } from '.'
import { mapRow } from '../batchMath'

type Activation = (x: number) => number

const zoom = (c: number, fun: Activation) => (x: number) => c * fun(x / c)

const zed = (a: number, b: number) => (x: number) => {
  if (x > 1) {
    return (x - 1) * b + a
  } else if (x < -1) {
    return (x + 1) * b - a
  } else {
    return x * a
  }
}
const zedPrime = (a: number, b: number) => (x: number) => {
  return Math.abs(x) < 1 ? a : b
}

const fp = zoom(0.55, zed(1.95, 0.05))
const bp = zoom(0.55, zedPrime(1.95, 0.05))

export function selfNormalizingZedTransform(): TransformationFactory {
  return function dropoutFactory({ size }) {
    return {
      type: 'simplified',
      passForward(input) {
        return mapRow(input, fp)
      },
      passBack(error, input) {
        return mapRow(input, (x, i) => bp(x) * error[i])
      },
      size,
    }
  }
}
