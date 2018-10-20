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
          return {
            trace: { input, history: trace },
            output: passForward(input, config),
          }
        },
        passBack(trace, error, handOff, config) {
          return handOff(trace.history, passBack(trace.input, error, config))
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
