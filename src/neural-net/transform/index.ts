/**
 * Transforms are the bread and butter of our NNs. In fact, a NN is a thin
 * facade over the pipe transform, which composes other transforms together.
 * Most of the transforms are not so fancy- the dense, bias, sigmoid, and relu
 * transforms all do exactly what you'd expect. Additionally, we have the guard
 * transform which normalizes net inputs, the split transform which allows
 * other transforms to be run on different parts of the transform input,
 * and a few other goodies for conciseness and performance.
 */

export type UniformTransformation<Trace = number[]> = {
  type: 'uniform'
  serialize(): string
  applyLearning(replacement: number): void
  passForward(input: number[]): { output: number[]; trace: Trace }
  passBack(trace: Trace, error: number[]): number[]
  size: number
}

export type SimplifiedTransformation = {
  type: 'simplified'
  serialize?(): string
  applyLearning?(replacement: number): void
  passForward(input: number[]): number[]
  passBack(input: number[], error: number[]): number[]
  size: number
}

export type Transformation =
  | UniformTransformation<unknown>
  | SimplifiedTransformation

export function regularize(
  transform: Transformation,
): UniformTransformation<any> {
  switch (transform.type) {
    case 'uniform': {
      return transform
    }
    case 'simplified': {
      const {
        serialize = () => 'null',
        applyLearning = () => {},
        passForward,
        passBack,
        size,
      } = transform
      return {
        type: 'uniform',
        serialize,
        applyLearning,
        passForward: input => ({ trace: input, output: passForward(input) }),
        passBack,
        size,
      }
    }
    default: {
      const never: never = transform
      return transform as any
    }
  }
}

export type TransformationFactory = (
  info: { size: number; serializedContent?: string },
) => Transformation

export { denseTransform } from './dense'
export { biasTransform } from './bias'
export { leakyReluTransform } from './leakyRelu'
export { splitTransform } from './split'
export { pipeTransform } from './pipe'
export { sigmoidTransform } from './sigmoid'
export { identityTransform } from './identity'
export { guardTransform } from './guard'
export { sharpTanhTransform } from './sharpTanh'
export { logicalTransform } from './logical'
