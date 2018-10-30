import { Transformation, UniformTransformation, TransformationFactory } from '.'
import { Intersection } from '../utils/types'

type Configs<TFs> = TFs extends TransformationFactory<
  Transformation<any, any, infer C>
>
  ? C
  : never

export type Config<TFs> = Intersection<Configs<TFs>>

export function regularize<H, C>(
  transform: Transformation<H, any, C>,
): UniformTransformation<H, any, C> {
  switch (transform.type) {
    case 'uniform': {
      return transform
    }
    case 'simplified': {
      const {
        serialize = () => 'null',
        applyLearning = () => {},
        clean = () => {},
        passForward,
        passBack,
        size,
      } = transform
      return {
        type: 'uniform',
        passForward(input, trace, config) {
          const output = passForward(input, config)
          return {
            trace: { input, output, history: trace },
            output,
          }
        },
        passBack(trace, error, handOff, config) {
          return handOff(
            trace.history,
            passBack(error, trace.input, trace.output, config),
          )
        },
        serialize,
        applyLearning,
        clean,
        size,
      }
    }
    default: {
      const never: never = transform
      return transform as any
    }
  }
}
