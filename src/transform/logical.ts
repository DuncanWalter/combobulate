import { TransformationFactory } from '.'
import { pipeTransform } from './pipe'
import { splitTransform } from './split'
import { leakyReluTransform } from './leakyRelu'
import { biasTransform } from './bias'
import { denseTransform } from './dense'
import { sharpTanhTransform } from './sharpTanh'
import { selfNormalizingZedTransform } from './selfNormalizingZed'
import { dropoutTransform } from './dropout'

export function logicalTransform<H>(
  outputSize: number,
): TransformationFactory<H> {
  return splitTransform(
    pipeTransform(
      denseTransform(Math.ceil(outputSize * 0.8)),
      biasTransform(),
      leakyReluTransform(),
    ),
    pipeTransform(
      denseTransform(Math.floor(outputSize * 0.2)),
      biasTransform(),
      selfNormalizingZedTransform(),
    ),
  )
}
