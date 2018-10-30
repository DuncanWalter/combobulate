import { TransformationFactory, SimplifiedTransformation } from '.'

export function identityTransform(): TransformationFactory<
  SimplifiedTransformation<unknown>
> {
  return ({ size }) => ({
    type: 'simplified',
    passForward(input) {
      return input
    },
    passBack(error) {
      return error
    },
    size,
  })
}
