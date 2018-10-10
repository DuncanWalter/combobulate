import { TransformationFactory, regularize } from '.'
import { mapRow } from '../batchMath'
import { identityTransform } from './identity'

function weighted(
  factory:
    | TransformationFactory
    | { factory: TransformationFactory; weight: number },
): { factory: TransformationFactory; weight: number } {
  if (factory instanceof Function) {
    return {
      weight: 1,
      factory,
    }
  } else {
    return factory
  }
}

export function splitTransform(
  ...transformFactories: (
    | TransformationFactory
    | { factory: TransformationFactory; weight: number })[]
): TransformationFactory {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return ({ size, serializedContent }) => {
    const content = serializedContent ? JSON.parse(serializedContent) : []

    const totalWeight = transformFactories
      .map(weighted)
      .reduce((total, factory) => {
        return total + factory.weight
      }, 0)

    const transformSlices = transformFactories.map(weighted).scan(
      ({ next }, { factory, weight }, i) => {
        const length = (size * weight) / totalWeight
        const transform = regularize(
          factory({ size: length, serializedContent: content[i] }),
        )
        return {
          start: Math.round(next),
          length: Math.round(length),
          next: next + length,
          transform,
        }
      },
      { next: 0 },
    )

    return {
      type: 'uniform',
      passForward(batch: number[]) {
        const outputs = mapRow(transformSlices, transform => {
          const {
            start,
            length,
            transform: { passForward },
          } = transform
          const inputSlice = batch.slice(start, start + length)
          return passForward(inputSlice)
        })
        const output = Array.prototype.concat.apply(
          [],
          mapRow(outputs, acc => acc.output),
        )
        return {
          output,
          trace: outputs.reduce(
            (traces, output) => {
              traces.push(output.trace)
              return traces
            },
            [] as unknown[],
          ),
        }
      },
      passBack(traces: unknown[], error: number[]): number[] {
        const outputs = transformSlices.scan(
          ({ allocated }, { transform: { size, passBack } }, i) => {
            const output = passBack(
              traces[i],
              error.slice(allocated, allocated + size),
            )
            return {
              output,
              allocated: allocated + size,
              wazzafu: error.slice(allocated, allocated + size),
            }
          },
          { allocated: 0 },
        )
        const out = Array.prototype.concat.apply(
          [],
          mapRow(outputs, acc => acc.output, outputs),
        )
        return out
      },
      applyLearning(replacement: number): void {
        transformSlices.forEach(({ transform }) =>
          transform.applyLearning(replacement),
        )
      },
      serialize(): string {
        return JSON.stringify(
          transformSlices.forEach(({ transform }) => transform.serialize()),
        )
      },
      size: transformSlices.reduce(
        (size, { transform }) => size + transform.size,
        0,
      ),
    }
  }
}
