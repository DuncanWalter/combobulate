import { TransformationFactory, Transformation } from '.'
import { rowZip, add, flatMap } from '../batchMath'
import { identityTransform } from './identity'
import { regularize, Config } from './regularize'

type SplitTrace<H> = {
  history: H
  transformations: unknown[]
}

export function splitTransform<
  H,
  TFs extends TransformationFactory<Transformation<any, any, any>>[]
>(
  ...transformFactories: TFs
): TransformationFactory<
  Transformation<H, SplitTrace<H>, Config<TFs[number]>>
> {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return ({ size, serializedContent }) => {
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
      passBack(trace, error, handOff, config) {
        let offset = 0
        const focus = trace
        const output = new Array(size).fill(0)
        const handle = (trace: SplitTrace<H>, error: number[]) => {
          if (trace !== focus) {
            throw new Error(
              'Children of splitTransformation cannot invoke multiple or cached backwards passes for performance reasons',
            )
          }
          rowZip(output, error, add, output)
        }
        for (let i = 0; i < transformations.length; i++) {
          transformations[i].passBack(
            trace.transformations[i],
            error.slice(offset, offset + transformations[i].size),
            handle,
            config,
          )
          offset += transformations[i].size
        }
        handOff(trace.history, output)
      },
      applyLearning(config) {
        for (let transformation of transformations) {
          transformation.applyLearning(config)
        }
      },
      clean() {
        for (let transformation of transformations) {
          transformation.clean()
        }
      },
      serialize() {
        return JSON.stringify(
          transformations.map(transformation => {
            return transformation.serialize()
          }),
        )
      },
      size: transformations.map(t => t.size).reduce(add),
    }
  }
}
