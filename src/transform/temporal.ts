import { TransformationFactory, UniformTransformation } from '.'
import { mapRow } from '../batchMath'

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
// TODO: make this not keep traces if not training
export function temporalTransform<H>(
  samples: number,
  span: number,
): TransformationFactory<UniformTransformation<H, unknown>> {
  return ({ size }) => {
    const errorScale = 1 / Math.sqrt(samples)
    const downScale = (x: number) => x * errorScale
    let cache = new RingHistory(
      (samples - 1) * span + 1,
      new Array(size).fill(0),
    )
    return {
      type: 'uniform',
      passForward(input: number[], history: H) {
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
        return {
          trace: history,
          output,
        }
      },
      passBack(history: H, error, handOff) {
        for (let s = 0; s < samples; s++) {
          const offset = s * size
          const errorSample = error.slice(offset, offset + size)
          handOff(history, mapRow(errorSample, downScale, errorSample))
        }
      },
      applyLearning() {},
      clean() {
        cache = new RingHistory(
          (samples - 1) * span + 1,
          new Array(size).fill(0),
        )
      },
      serialize() {
        return 'null'
      },
      size: size * samples,
    }
  }
}
