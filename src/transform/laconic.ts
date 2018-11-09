import { TransformationFactory, SimplifiedTransformation } from '.'
import { normal } from '../utils/gaussian'
import { matrix, scaleMat, matAddMat } from '../batchMath'

const { sqrt, PI, E, ceil, random } = Math

// function sum<T>(xs: T[], f: (t: T) => number): number {
//   let sum = 0
//   for (let x of xs) {
//     sum += f(x)
//   }
//   return sum
// }

// function mean(xs: number[]) {
//   return sum(xs, x => x) / xs.length
// }

// function standardDeviation(xs: number[]) {
//   const m = mean(xs)
//   return sum(xs, x => (x - m) ** 2) ** 0.5 / xs.length
// }

// function skewness(xs: number[]) {
//   const m = mean(xs)
//   const raw = sum(xs, x => (x - m) ** 3)
//   if (raw >= 0) {
//     return raw ** (1 / 3) / xs.length
//   } else {
//     return raw ** (1 / 3) / xs.length
//   }
// }

/**
 * N choose K calculated using Sterlings approximation
 * and information quantity representations.
 * Safe for n and k up to roughly 10 ^ 15.
 */
function combinations(n: number, k: number) {
  if (n === k || k === 0) {
    return 1
  }

  const nLen = Math.log2(n / E) * n
  const dLen = Math.log2((n - k) / E) * (n - k) + Math.log2(k / E) * k

  return sqrt(n / ((n - k) * k * 2 * PI)) * 2 ** (nLen - dLen)
}

/**
 * binary search solver for
 * monotonically increasing functions
 */
function solve(target: number, expression: (x: number) => number) {
  let x = 0
  let d = 1
  while (d > 0.1) {
    if (expression(x) > target) {
      d /= 2
      x -= d
    } else {
      d *= 2
      x += d
    }
    if (!d || d !== d || x !== x) {
      throw new Error('Bandwidth solver failed in laconic layer')
    }
  }
  return x
}

/**
 * @param inputSize
 * @param outputSize
 * @param redundancy
 * @param density
 */
function bandwidth(n: number, m: number, r: number, d: number) {
  return ceil(
    solve(
      r * combinations(n - 1, d - 1),
      x => x * combinations((n / m) * x - 1, d - 1),
    ),
  )
}

function* range(n: number) {
  for (let i = 0; i < n; i++) {
    yield i
  }
}

function shuffle(arr: number[]) {
  for (let i in arr) {
    const t = arr[i]
    const j = (random() * arr.length) | 0
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

/**
 * @param outputSize
 * @param bandwidth
 */
function mask(m: number, b: number) {
  return shuffle([...range(m)]).slice(0, b)
}

// TODO: math for ideal starting weights
type LaconicSeeder = (
  inputSize: number,
  outputSize: number,
  bandwidth: number,
) => (row: number, column: number) => number

const defaultSeeder: LaconicSeeder = (inputSize, outputSize, bandwidth) => () =>
  normal() / sqrt((inputSize * bandwidth) / outputSize)

/**
 * Dense transforms do many redundant calculations
 * in terms of information cross-pollination. Laconic transforms
 * seek to reduce computation time by the root of the width of the
 * net while preserving net potency.
 */
export function laconicTransform(
  outputSize: number,
  redundancy: number = 2,
  density: number = 2,
  seeder: LaconicSeeder = defaultSeeder,
): TransformationFactory<
  SimplifiedTransformation<{
    learningRate: number
    inertia?: number
  }>
> {
  return function laconic({ size: inputSize, serializedContent }) {
    const b = bandwidth(inputSize, outputSize, redundancy, density)
    const m = mask(outputSize, b)
    const weights = matrix(b, inputSize, seeder(inputSize, outputSize, b))
    let deltas = matrix(b, inputSize, () => 0)
    const connections = [...range(inputSize)].map(i =>
      m.map(j => (i + j) % outputSize),
    )
    const backConnections = [...range(outputSize)].map(i =>
      [...range(inputSize)]
        .filter(j => m.includes((i + j) % outputSize))
        .map(j => ({
          source: j,
          index: m.indexOf((i + j) % outputSize),
        })),
    )

    return {
      type: 'simplified',
      passForward(input) {
        const output = new Array(outputSize).fill(0)
        for (let i = 0; i < inputSize; i++) {
          for (let j = 0; j < b; j++) {
            output[connections[i][j]] += input[i] * weights[j][i]
          }
        }
        return output
      },
      passBack(error, input) {
        const backProp = new Array(inputSize).fill(0)
        for (let i = 0; i < outputSize; i++) {
          const sources = backConnections[i]
          for (let j = 0; j < sources.length; j++) {
            const source = sources[j].source
            const address = sources[j].index
            backProp[source] += error[i] * weights[address][source]
            deltas[address][source] += error[i] * input[source]
          }
        }
        return backProp
      },
      applyLearning(config) {
        const { learningRate, inertia = 0 } = config
        const dialation = 1 / (1 - inertia)
        const update = scaleMat(learningRate / dialation, deltas)
        matAddMat(weights, update, weights)
        scaleMat((dialation - 1) / dialation, deltas, deltas)
      },
      clean() {
        deltas = matrix(b, inputSize, () => 0)
      },
      serialize() {
        return JSON.stringify('TODO:')
      },
      size: outputSize,
    }
  }
}

// test('How high do combinations work?', () => {
//   let i = 100
//   let f = 101
//   while (f > i && f === f && f < Infinity) {
//     f = combinations(i, 2)
//     i *= 2
//   }
//   console.log(i)
// })

// test('Can calculate appropriate bandwidths', () => {
//   for (let i of [1, 2, 3, 5, 10, 20, 50, 100]) {
//     console.log(`case ${i}: ${bandwidth(n, m, i, 3)}`)
//   }
//   for (let i of [2, 3, 5, 10, 20, 50, 100]) {
//     console.log(`case ${i}: ${bandwidth(n, m, 2, i)}`)
//   }
// })

// test('Check mask biases', () => {
//   const frequencies = new Array(999).fill(0)
//   const m = mask(1000, 35)
//   const instances = new Array(1000).fill(0)
//   for (let i of m) {
//     instances[i] = 1
//   }
//   for (let i of range(1000)) {
//     for (let j of range(999)) {
//       if (instances[i] && instances[(i + j + 1) % 1000]) {
//         frequencies[j]++
//       }
//     }
//   }
//   for (let i of range(10)) {
//     const bla = frequencies.slice(i * 100, 100 + i * 100)
//     console.log(mean(bla), standardDeviation(bla), skewness(bla))
//   }
// })
