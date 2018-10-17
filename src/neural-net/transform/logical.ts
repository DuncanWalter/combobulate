import { TransformationFactory } from '.'
import { pipeTransform } from './pipe'
import { splitTransform } from './split'
import { leakyReluTransform } from './leakyRelu'
import { biasTransform } from './bias'
import { denseTransform } from './dense'
import { sharpTanhTransform } from './sharpTanh'

// Meant to provide a basic building block for
// stable, expressive nets. Maybe stinks. Who knows.
export function logicalTransform<H>(
  outputSize: number,
): TransformationFactory<H> {
  return splitTransform(
    pipeTransform(
      denseTransform(Math.floor(outputSize * 0.85)),
      biasTransform(),
      leakyReluTransform(),
    ),
    pipeTransform(
      denseTransform(Math.ceil(outputSize * 0.15)),
      biasTransform(),
      sharpTanhTransform(),
    ),
  )
  // return pipeTransform(
  //   biasTransform(),
  //   leakyReluTransform(),
  //   denseTransform(outputSize),
  // )
}
