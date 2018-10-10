import { TransformationFactory } from '.'
import { vector, mapRow } from '../batchMath'

export function guardTransform(
  floor: number = 0,
  ceil: number = 1,
): TransformationFactory {
  return ({ size, serializedContent }) => {
    let min = vector(size, () => Infinity)
    let max = vector(size, () => -Infinity)
    if (serializedContent) {
      ;({ min, max } = JSON.parse(serializedContent))
    }
    return {
      type: 'simplified',
      passForward(input: number[]): number[] {
        return mapRow(input, (input, i) => {
          max[i] = Math.max(input, max[i])
          min[i] = Math.min(input, min[i])
          if (min[i] === max[i]) return 0
          return ((ceil - floor) * (input - min[i])) / (max[i] - min[i]) + floor
        })
      },
      passBack(input: number[], error: number[]): number[] {
        return mapRow(error, (e, i) => {
          if (input[i] === min[i] && e < 0) return 0
          if (input[i] === max[i] && e > 0) return 0
          return (e * (max[i] - min[i])) / (ceil - floor)
        })
      },
      serialize(): string {
        return JSON.stringify({ min, max })
      },
      size,
    }
  }
}
