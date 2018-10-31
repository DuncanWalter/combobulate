import NeuralNet from './NeuralNet'
import { denseTransform, guardTransform, logicalTransform } from './transform'
import { createPredictor } from './createPredictor'
import { rowZip } from './batchMath'
import { createModel } from './createModel'
const { random, floor } = Math

// Allow tests to run longer than
// the default 5000ms without calling
// the done function when async
jest.setTimeout(1000000)

// Numeric versions of all arity-2
// boolean functions for generating
// NN evaluation functions.
const not = a => 1 - a
const and = (a, b) => Math.sqrt(a * b)
const or = (a, b) => (a + b) / (1 + a * b)
const nand = (a, b) => not(and(a, b))
const nor = (a, b) => not(or(a, b))
const imp = (a, b) => or(not(a), b)
const nimp = (a, b) => not(imp(b, a))
const xor = (a, b) => or(a, b) - and(a, b)
const eq = (a, b) => not(xor(a, b))
const ops = [and, or, nor, nand, imp, nimp, xor, eq]

// Preserve a reasonable distribution
// of outputs in high-arity operations
// to enable more expressive evaluations
function sharpen(x: number) {
  const scale = Math.abs(2 * x - 1) ** 0.5
  return x > 0.5 ? scale : 1 - scale
}

// Generate a higher arity numeric
// operator to test the expressiveness
// and stability of neural nets
function createOperation(arity: number) {
  if (arity === 1) {
    return (input: number[]) => input[0]
  }

  const op = ops[floor(random() * ops.length)]

  if (arity === 2) {
    return (input: number[]) => sharpen(op(input[0], input[1]))
  }

  const split = 1 + floor(random() * (arity - 1))
  const left = createOperation(split)
  const right = createOperation(arity - split)

  return (input: number[]) => {
    return sharpen(
      op(left(input.slice(0, split)), right(input.slice(split, arity))),
    )
  }
}

function mean(xs: number[]) {
  let sum = 0
  for (let x of xs) {
    sum += x
  }
  return sum / xs.length
}

test('Creating, training, and validating a model runs without crashing', done => {
  const arity = 4
  const samples = 32
  const operation = createOperation(arity)

  function sampleOperation() {
    return new Array(samples)
      .fill(null)
      .map(_ => new Array(arity).fill(null).map(_ => random()))
      .map(input => ({
        input,
        output: [operation(input)],
      }))
  }

  const validationData = sampleOperation()

  // A baseline random model for
  // evaluating model success.
  console.log(
    'Random:',
    `10e${Math.log10(
      mean(
        validationData
          .map(datum => datum.output[0])
          .map(x => Math.abs(random() - x)),
      ),
    ).toPrecision(3)}`,
  )

  let net = new NeuralNet({
    inputSize: arity,
    transformations: [
      guardTransform(),
      denseTransform(24),
      logicalTransform(16),
      logicalTransform(8),
      denseTransform(1),
    ],
  })

  const config = { learningRate: 0.005, inertia: 0.7 }
  const predict = createPredictor(net, config)
  const model = createModel(net, {
    config: () => config,
    batch: sampleOperation,
    error: {
      value: (target, prediction) => 0.5 * (target - prediction) ** 2,
      derivative: (target, prediction) => target - prediction,
    },
  })

  function validate(epoch: number) {
    console.log(
      `Epoch ${epoch}: 10e${Math.log10(
        mean(
          rowZip(
            validationData.map(pair => pair.output),
            validationData.map(pair => pair.input).map(predict),
            (t, p) => rowZip(t, p, (t, p) => 0.5 * (t - p) ** 2),
          ).map(mean),
        ),
      ).toPrecision(3)}`,
    )
  }

  model.train(5000, validate).then(done)
})
