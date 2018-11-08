import { TransformationFactory } from '.'
import { mapRow, rowZip, mul } from '../batchMath'

// SNN ideal constants
const a = 0.03567
const b = 2.7844
const c = 0.47787
const ib = 1 / b

const zoom = (s: number, f: (x: number) => number) => (x: number) =>
  s * f(x / s)

const swoop = zoom(c, x => {
  if (x >= 0) {
    return a * x - (1 / (ib + x) - b)
  } else {
    return a * x + (1 / (ib - x) - b)
  }
})

const swoopGradient = zoom(c, x => {
  const dy = 1 / (ib + Math.abs(x))
  return a + dy * dy
})

export function swoopTransform(): TransformationFactory {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return mapRow(input, swoop)
    },
    passBack(error, input) {
      const gradient = mapRow(input, swoopGradient)
      return rowZip(gradient, error, mul, gradient)
    },
    size,
  })
}
