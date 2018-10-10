import { TransformationFactory, regularize } from '.'
import { identityTransform } from './identity'
import '../../utils/arrayScan'

export function pipeTransform(
  ...transformFactories: TransformationFactory[]
): TransformationFactory {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return ({ size, serializedContent }) => {
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
      passForward(x: number[]) {
        const trace = transforms.scan(
          ({ output: x }, { passForward }) => {
            return passForward(x)
          },
          { output: x },
        )
        return {
          trace,
          output: trace[trace.length - 1].output,
        }
      },
      passBack(trace: any, error: number[]) {
        return transforms.reduceRight((error, { passBack }, i) => {
          return passBack(trace[i].trace, error)
        }, error)
      },
      applyLearning(replacement: number) {
        transforms.forEach(({ applyLearning }) => applyLearning(replacement))
      },
      serialize() {
        return JSON.stringify(transforms.map(({ serialize }) => serialize()))
      },
      size: transforms[transforms.length - 1].size,
    }
  }
}
