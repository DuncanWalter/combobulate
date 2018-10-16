import { TransformationFactory, regularize, UniformTransformation } from '.'
import { identityTransform } from './identity'
import '../../utils/arrayScan'
import { mapRow } from '../batchMath'

export type PipeTrace<H> = {
  history: H
  transformations: unknown[]
}

export function pipeTransform<H>(
  ...transformFactories: TransformationFactory<PipeTrace<H>>[]
): TransformationFactory<H> {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return ({
    size,
    serializedContent,
  }): UniformTransformation<H, PipeTrace<H>> => {
    const content = serializedContent ? JSON.parse(serializedContent) : []
    const transforms = transformFactories.scan(
      ({ size }, transformFactory, i) => {
        return regularize(
          transformFactory({ size, serializedContent: content[i] }),
        )
      },
      { size },
    )
    return {
      type: 'uniform',
      passForward(input: number[], history) {
        const trace = {
          history,
          transformations: new Array(transforms.length),
        }
        let output = input
        for (let i = 0; i < transforms.length; i++) {
          const tuple = transforms[i].passForward(output, trace)
          trace.transformations[i] = tuple.trace
          output = tuple.output
        }
        return {
          trace,
          output,
        }
      },
      passBack(passes) {
        let propagation = passes
        for (let i = transforms.length; --i > 0; ) {
          propagation = transforms[i].passBack(propagation)
        }
        return mapRow(propagation, tuple => {
          return { trace: tuple.trace.history, error: tuple.error }
        })
      },
      applyLearning(replacement: number) {
        transforms.forEach(({ applyLearning }) => applyLearning(replacement))
      },
      clean() {
        transforms.forEach(({ clean }) => clean())
      },
      serialize() {
        return JSON.stringify(transforms.map(({ serialize }) => serialize()))
      },
      size: transforms[transforms.length - 1].size,
    }
  }
}
