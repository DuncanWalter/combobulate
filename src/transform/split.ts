import { TransformationFactory, UniformTransformation } from '.'
import { rowZip, add, flatMap } from '../batchMath'
import { identityTransform } from './identity'
import { regularize } from './regularize'

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
      // TODO: write up more cleanly
      passBack(trace, error, handOff, config) {
        let offset = 0
        const truth = trace
        const output = new Array(size).fill(0)
        for (let i = 0; i < transformations.length; i++) {
          transformations[i].passBack(
            trace.transformations[i],
            error.slice(offset, offset + transformations[i].size),
            (trace, error) => {
              if (trace !== truth) {
                throw new Error(
                  'Children of splitTransformation cannot invoke cached backwards passes for performance reasons',
                )
              }
              rowZip(output, error, add, output)
            },
            config,
          )
          offset += transformations[i].size
        }
        handOff(trace.history, output)
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
