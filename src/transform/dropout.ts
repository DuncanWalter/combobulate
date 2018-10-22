import { TransformationFactory } from '.'
import { mapRow, rowZip } from '../batchMath'

// TODO: add bias for snn style dropouts
export function dropoutTransformation<H>(
  frequency: number,
  totality: number = 1,
): TransformationFactory<H> {
  const drop = (x: number) => (1 - totality) * x
  const c = 1 / (1 - frequency * totality)
  const scale = (x: number) => c * x
  const dropout = (x: number) =>
    Math.random() > frequency ? scale(x) : drop(x)
  return function dropoutFactory({ size }) {
    return {
      type: 'simplified',
      passForward(input, config) {
        if (config.training) {
          return mapRow(input, dropout)
        } else {
          return input
        }
      },
      passBack(error, input, output, config) {
        if (config.training) {
          return rowZip(input, output, (x, y, i) => {
            if (x !== y) {
              return error[i] * (1 - totality)
            } else {
              return error[i]
            }
          })
        } else {
          return error
        }
      },
      size,
    }
  }
}