import { Transformation, UniformTransformation } from '.'

export function regularize<H>(
  transform: Transformation<H, any>,
): UniformTransformation<H, any> {
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
