import { TransformationFactory } from '.'

class RingHistory<T> {
  buffer: Array<T>
  offset: number
  size: number
  constructor(size: number, empty: T) {
    this.buffer = new Array(size).fill(empty)
    this.offset = 0
    this.size = size
  }
  write(item: T): void {
    this.buffer[++this.offset % this.size] = item
  }
  recall(stepsBack: number): T {
    return this.buffer[(this.offset + this.size - stepsBack) % this.size]
  }
}

/**
 * temporalTransform creates a transform factory for a neural net layer which
 * caches past inputs and samples from them. This allows for fast real time
 * stream processing via one dimensional convolutions.
 */
export function temporalTransform<H>(
  samples: number,
  span: number,
): TransformationFactory<H> {
  return ({ size }) => {
    const cache = new RingHistory(
      (samples - 1) * span + 1,
      new Array(size).fill(0),
    )
    return {
      type: 'simplified',
      passForward(input: number[]) {
        const output = new Array(size * samples)
        let i = 0
        for (; i < size; i++) {
          output[i] = input[i]
        }
        for (let s = 1; s < samples; s++) {
          const offset = size * s
          const sample = cache.recall(s * span)
          for (; i < size; i++) {
            output[offset + i] = sample[i]
          }
        }
        cache.write(input)
        return output
      },
      passBack(input, error) {
        return error.slice(0, size)
      },
      size: size * samples,
    }
  }
}
