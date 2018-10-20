import { TransformationFactory } from '.'

export function identityTransform<H>(): TransformationFactory<H> {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return input
    },
    passBack(input, error) {
      return error
    },
    size,
  })
}
