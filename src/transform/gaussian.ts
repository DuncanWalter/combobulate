import { TransformationFactory, SimplifiedTransformation } from '.'
import { mapRow } from '../batchMath'

export function gaussianTransform(
  mean: number,
  variance: number,
): TransformationFactory {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return mapRow(input, x => Math.exp((mean - x) / 2 / variance))
    },
    passBack(error, input, output) {
      return mapRow(output, (x, i) => (-error[i] * x) / 2 / variance)
    },
    size,
  })
}
