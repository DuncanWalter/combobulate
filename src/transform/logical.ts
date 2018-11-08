import { pipeTransform } from './pipe'
import { splitTransform } from './split'
import { leakyReluTransform } from './leakyRelu'
import { biasTransform } from './bias'
import { denseTransform } from './dense'
import { selfNormalizingZedTransform } from './selfNormalizingZed'
import { swoopTransform } from './swoop'

export function logicalTransform(outputSize: number) {
  // return splitTransform(
  //   pipeTransform(
  //     denseTransform(Math.ceil(outputSize * 0.2)),
  //     biasTransform(),
  //     leakyReluTransform(),
  //   ),
  //   pipeTransform(
  //     denseTransform(Math.floor(outputSize * 0.8)),
  //     biasTransform(),
  //     swoopTransform(),
  //   ),
  // )
  return pipeTransform(
    denseTransform(outputSize),
    biasTransform(),
    swoopTransform(),
  )
}
