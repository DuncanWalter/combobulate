import { TransformationFactory } from '.'
import { mapRow } from '../batchMath'

export function sigmoidTransform<H>(): TransformationFactory<H> {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return mapRow(input, x => 1 / (1 + Math.exp(-x)))
    },
    passBack(error, input, output) {
      return mapRow(output, (x, i) => error[i] * x * (1 - x))
    },
    size,
  })
}
