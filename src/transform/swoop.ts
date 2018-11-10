import { TransformationFactory } from '.'
import { mapRow, rowZip, mul } from '../batchMath'

// SNN ideal constants
const a = 0.19138
const b = 4.50135
const c = 0.25634
const ib = 1 / b
const cb = c * b

const swoop = (x: number) => {
  if (x >= 0) {
    return a * x - (c / (ib + x) - cb)
  } else {
    return a * x + (c / (ib - x) - cb)
  }
}

const swoopGradient = (x: number) => {
  const dy = 1 / (ib + Math.abs(x))
  return a + c * dy * dy
}

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
