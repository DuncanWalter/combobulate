/**
 * Transforms are the bread and butter of our NNs. In fact, a net is a thin
 * facade over the pipe transform, which composes other transforms together.
 * Most of the transforms are not so fancy- the dense, bias, sigmoid, and relu
 * transforms all do exactly what you'd expect. Additionally, we have the guard
 * transform which normalizes net inputs, the split transform which allows
 * multiple transforms to be run on a single input,
 * and a few other goodies for conciseness and performance.
 */

export type NetConfiguration = {
  inputSize: number
  training: boolean
  learningRate: number
  learningDecay: number
}

export type UniformTransformation<Hist, Trace = number[]> = {
  type: 'uniform'
  serialize(): string
  applyLearning(replacement: number): void
  clean(): void
  passForward(
    input: number[],
    history: Hist,
    config: NetConfiguration,
  ): { output: number[]; trace: Trace }
  passBack(
    trace: Trace,
    error: number[],
    handOff: (trace: Hist, error: number[]) => void,
    config: NetConfiguration,
  ): void
  size: number
}

export type SimplifiedTransformation = {
  type: 'simplified'
  serialize?(): string
  applyLearning?(replacement: number): void
  clean?(): void
  passForward(input: number[], config: NetConfiguration): number[]
  passBack(input: number[], error: number[], config: NetConfiguration): number[]
  size: number
}

export type Transformation<H, T> =
  | UniformTransformation<H, T>
  | SimplifiedTransformation

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

export type TransformationFactory<H> = (
  info: { size: number; serializedContent?: string },
) => Transformation<H, unknown>

export { denseTransform } from './dense'
export { biasTransform } from './bias'
export { leakyReluTransform } from './leakyRelu'
export { splitTransform } from './split'
export { pipeTransform } from './pipe'
export { identityTransform } from './identity'
export { guardTransform } from './guard'
export { sharpTanhTransform } from './sharpTanh'
export { logicalTransform } from './logical'
export { temporalTransform } from './temporal'
