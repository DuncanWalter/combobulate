import { TransformationFactory, regularize, UniformTransformation } from '.'
import { mapRow, rowZip, add, flatMap } from '../batchMath'
import { identityTransform } from './identity'

class SumPooler<Key> {
  activeFields: Key[]
  discriminator: Map<Key, number[]>
  size: number
  constructor(size: number) {
    this.discriminator = new Map()
    this.activeFields = []
    this.size = size
  }
  addValues(key: Key, error: number[]): void {
    if (!this.discriminator.has(key)) {
      this.discriminator.set(key, new Array(this.size).fill(0))
      this.activeFields.push(key)
    }
    const sum = this.discriminator.get(key)!
    rowZip(sum, error, add, sum)
  }
  extractValues<T>(interpreter: (key: Key, values: number[]) => T): T[] {
    const output = mapRow(this.activeFields, key => {
      const output = interpreter(key, this.discriminator.get(key)!)
      this.discriminator.delete(key)
      return output
    })
    this.activeFields = []
    return output
  }
}

type SplitTrace<H> = {
  history: H
  transformations: unknown[]
}

export function splitTransform<H>(
  ...transformFactories: TransformationFactory<SplitTrace<H>>[]
): TransformationFactory<H> {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return ({
    size,
    serializedContent,
  }): UniformTransformation<H, SplitTrace<H>> => {
    const content = serializedContent ? JSON.parse(serializedContent) : []

    const transformations = transformFactories
      .map((factory, i) => factory({ size, serializedContent: content[i] }))
      .map(regularize)

    const propagationPool = new SumPooler<SplitTrace<H>>(size)
    return {
      type: 'uniform',
      passForward(input: number[], history, config) {
        const trace = {
          history,
          transformations: new Array(transformations.length),
        }
        const output = flatMap(transformations, (transformation, i) => {
          const tuple = transformation.passForward(input, trace, config)
          trace.transformations[i] = tuple.trace
          return tuple.output
        })
        return { output, trace }
      },
      passBack(trace, error, handOff, config) {
        let offset = 0
        for (let i = 0; i < transformations.length; i++) {
          transformations[i].passBack(
            trace.transformations[i],
            error.slice(offset, offset + transformations[i].size),
            (trace, error) => {
              propagationPool.addValues(trace, error)
            },
            config,
          )
          offset += transformations[i].size
        }
        propagationPool.extractValues((trace, error) => {
          handOff(trace.history, error)
        })
      },
      applyLearning(replacement: number): void {
        transformations.forEach(transform =>
          transform.applyLearning(replacement),
        )
      },
      clean() {
        transformations.forEach(transform => transform.clean())
      },
      serialize(): string {
        return JSON.stringify(
          transformations.map(transform => transform.serialize()),
        )
      },
      size: transformations.reduce(
        (size, transform) => size + transform.size,
        0,
      ),
    }
  }
}
