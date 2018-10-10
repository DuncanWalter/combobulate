import NeuralNet from './NeuralNet'
import * as Transform from './transform'

/**
 * Our Neural Nets (NNs) are designed to be used as function approximators in
 * unstructured problems. They leave the implementations of loss, momentum,
 * and technically regularization up to the user. A NN is effectively
 * a series of transforms which can be run forwards and then backwards in
 * the gradient decent style. The NN runs forward on single input instances
 * allowing for efficient use in RL, streaming, or real-time applications.
 * However, the backwards pass runs on batches of errors associated with traces
 * of the forward pass. This allows for arbitrary batching. The forward pass
 * trace is typically used to save calculations performed in the forward pass
 * so they don't need to be redone in the backwards pass.
 */

export default NeuralNet
export { Transform }
