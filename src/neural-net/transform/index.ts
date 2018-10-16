import { mapRow } from '../batchMath'

/**
 * Transforms are the bread and butter of our NNs. In fact, a net is a thin
 * facade over the pipe transform, which composes other transforms together.
 * Most of the transforms are not so fancy- the dense, bias, sigmoid, and relu
 * transforms all do exactly what you'd expect. Additionally, we have the guard
 * transform which normalizes net inputs, the split transform which allows
 * multiple transforms to be run on a single input,
 * and a few other goodies for conciseness and performance.
 */

export type UniformTransformation<Hist, Trace = number[]> = {
  type: 'uniform'
  serialize(): string
  applyLearning(replacement: number): void
  clean(): void
  passForward(
    input: number[],
    history: Hist,
  ): { output: number[]; trace: Trace }
  passBack(
    passes: { trace: Trace; error: number[] }[],
  ): { error: number[]; trace: Hist }[]
  size: number
}

export type SimplifiedTransformation = {
  type: 'simplified'
  serialize?(): string
  applyLearning?(replacement: number): void
  clean?(): void
  passForward(input: number[]): number[]
  passBack(input: number[], error: number[]): number[]
  size: number
}

// TODO make the HOTs use this type and regularize
// TODO in the regularize function.
// export type HigherOrderTransformation = {
//   type: 'higher-order'
//   transforms: UniformTransformation
//   applyLearning?(replacement: number): void
//   clean?(): void
//   passForward(input: number[]): number[]
//   passBack(input: number[], error: number[]): number[]
//   size: number
// }

export type Transformation<H, T> =
  | UniformTransformation<H, T>
  | SimplifiedTransformation

export function regularize<H, T>(
  transform: Transformation<H, T>,
): UniformTransformation<H, T> {
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
      function innerPassBack(pass: {
        trace: { input: number[]; history: H }
        error: number[]
      }) {
        return {
          error: passBack(pass.trace.input, pass.error),
          trace: pass.trace.history,
        }
      }
      return {
        type: 'uniform',
        serialize,
        applyLearning,
        clean,
        passForward: (input, trace) => ({
          trace: { input, history: trace },
          output: passForward(input),
        }),
        passBack: passes => mapRow(passes, innerPassBack),
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
// export { sigmoidTransform } from './sigmoid'
export { identityTransform } from './identity'
export { guardTransform } from './guard'
export { sharpTanhTransform } from './sharpTanh'
export { logicalTransform } from './logical'
export { temporalTransform } from './temporal'
// export { smoothTransform } from './smooth'
