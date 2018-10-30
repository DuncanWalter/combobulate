import NeuralNet from './NeuralNet'

export function createPredictor<N extends NeuralNet<any, any>>(
  net: N,
  config: N extends NeuralNet<any, infer C> ? C : never,
) {
  return function predict(input: number[]) {
    return net.passForward(input, config).output
  }
}
