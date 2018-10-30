import NeuralNet from './NeuralNet'
import { denseTransform, guardTransform, logicalTransform } from './transform'
import { createPredictor } from './createPredictor'
import { rowZip } from './batchMath'
const { random, floor } = Math

function mean(xs: number[]) {
  let sum = 0
  for (let x of xs) {
    sum += x
  }
  return sum / xs.length
}

function sharpen(x: number) {
  const scale = Math.abs(2 * x - 1) ** 0.5
  return x > 0.5 ? scale : 1 - scale
}

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

test('The Neural Net Runs', () => {
  const arity = 5
  const samples = 2 ** arity
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

  let ann = new NeuralNet({
    inputSize: arity,
    transformations: [
      guardTransform(),
      denseTransform(48),
      logicalTransform(36),
      logicalTransform(8),
      denseTransform(1),
    ],
  })

  let config = { learningRate: 0.008 }

  const predict = createPredictor(ann, config)

  let epoch = 0
  function evaluate() {
    console.log(
      `Epoch ${epoch}: 10e${Math.log10(
        mean(
          rowZip(
            validationData.map(pair => pair.output),
            validationData.map(pair => pair.input).map(predict),
            (t, p) => rowZip(t, p, (t, p) => Math.abs(t - p)),
          ).map(mean),
        ),
      ).toPrecision(3)}`,
    )
  }

  evaluate()
  for (epoch = 1; epoch <= 10000; epoch++) {
    ann.passBack(
      sampleOperation().map(({ input, output: target }) => {
        const { trace, output: prediction } = ann.passForward(input, config)
        return { trace, error: rowZip(target, prediction, (t, p) => t - p) }
      }),
      config,
    )
    if (epoch % 1000 === 0) {
      evaluate()
    }
  }
})
