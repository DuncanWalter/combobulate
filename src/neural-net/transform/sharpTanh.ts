import { TransformationFactory } from '.'
import { mapRow } from '../batchMath'

export function sharpTanhTransform(
  slope: number = 0.05,
): TransformationFactory {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return mapRow(input, x => {
        switch (true) {
          case x < 1: {
            return slope * (x + 1) - 1.15
          }
          case x > 1: {
            return slope * (x - 1) + 1.15
          }
          default: {
            return x * 1.15
          }
        }
      })
    },
    passBack(input, error) {
      return mapRow(input, (x, i) => {
        if (Math.abs(x) > 1) {
          return error[i] * slope
        } else {
          return error[i]
        }
      })
    },
    size,
  })
}
