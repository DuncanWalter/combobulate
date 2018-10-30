/**
 * Transforms are the bread and butter of our NNs. In fact, a net is a thin
 * facade over the pipe transform, which composes other transforms together.
 * Most of the transforms are not so fancy- the dense, bias, sigmoid, and relu
 * transforms all do exactly what you'd expect. Additionally, we have the guard
 * transform which normalizes net inputs, the split transform which allows
 * multiple transforms to be run on a single input,
 * and a few other goodies for conciseness and performance.
 */

export type UniformTransformation<
  Hist,
  Trace = number[],
  Configuration = {}
> = {
  type: 'uniform'
  serialize(): string
  applyLearning(config: Configuration): void
  clean(): void
  passForward(
    input: number[],
    history: Hist,
    config: Configuration,
  ): { output: number[]; trace: Trace }
  passBack(
    trace: Trace,
    error: number[],
    handOff: (trace: Hist, error: number[]) => void,
    config: Configuration,
  ): void
  size: number
}

export type SimplifiedTransformation<Configuration = {}> = {
  type: 'simplified'
  serialize?(): string
  applyLearning?(config: Configuration): void
  clean?(): void
  passForward(input: number[], config: Configuration): number[]
  passBack(
    error: number[],
    input: number[],
    output: number[],
    config: Configuration,
  ): number[]
  size: number
}

export type Transformation<H, T, C> =
  | UniformTransformation<H, T, C>
  | SimplifiedTransformation<C>

export type TransformationFactory<
  T extends Transformation<any, any, any> = SimplifiedTransformation
> = (context: { size: number; serializedContent?: string }) => T

export { biasTransform } from './bias'
export { denseTransform } from './dense'
export { dropoutTransform } from './dropout'
// export { gaussianTransform } from './gaussian'
export { guardTransform } from './guard'
export { identityTransform } from './identity'
export { leakyReluTransform } from './leakyRelu'
export { logicalTransform } from './logical'
export { pipeTransform } from './pipe'
// export { selfNormalizingZedTransform } from './selfNormalizingZed'
export { sharpTanhTransform } from './sharpTanh'
// export { sigmoidTransform } from './sigmoid'
export { splitTransform } from './split'
export { temporalTransform } from './temporal'
