import { TransformationFactory, regularize } from '.'
import { mapRow, rowZip, add } from '../batchMath'
import { identityTransform } from './identity'

// const empty: any[] = []
const buffer: any[] = []
function flatMap<T, U>(arr: T[], mapping: (t: T) => U[]): U[] {
  const arrs = mapRow(arr, t => mapping(t), buffer)
  let offset = 0
  let size = 0
  for (let i = 0; i < arrs.length; i++) {
    size += arrs[i].length
  }
  const out = new Array(size)
  for (let i = 0; i < arrs.length; i++) {
    const arr = arrs[i]
    for (let j = 0; j < arr.length; j++) {
      out[offset + j] = arr[j]
    }
    offset += arr.length
  }
  return out
}

export function splitTransform(
  ...transformFactories: TransformationFactory[]
): TransformationFactory {
  if (transformFactories.length === 0) {
    return identityTransform()
  }
  return ({ size, serializedContent }) => {
    const content = serializedContent ? JSON.parse(serializedContent) : []

    const transforms = transformFactories
      .map((factory, i) => factory({ size, serializedContent: content[i] }))
      .map(regularize)

    return {
      type: 'uniform',
      passForward(batch: number[]) {
        const outputs = mapRow(transforms, t => t.passForward(batch))
        return {
          output: flatMap(outputs, r => r.output),
          trace: mapRow(outputs, r => r.trace),
        }
      },
      passBack(traces: unknown[], error: number[]): number[] {
        return mapRow(traces, (t, i) =>
          transforms[i].passBack(t, error),
        ).reduce((a, b) => rowZip(a, b, add, a))
      },
      applyLearning(replacement: number): void {
        transforms.forEach(transform => transform.applyLearning(replacement))
      },
      clean() {
        transforms.forEach(transform => transform.clean())
      },
      serialize(): string {
        return JSON.stringify(
          transforms.forEach(transform => transform.serialize()),
        )
      },
      size: transforms.reduce((size, transform) => size + transform.size, 0),
    }
  }
}
