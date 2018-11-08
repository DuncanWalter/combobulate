import { flatMap } from './batchMath'

type Range = [number, number]

const { abs, min, max, sqrt } = Math

function memoize(f: (x: number) => number): (x: number) => number {
  const answers = new Map()
  return x => {
    const a = answers.get(x)
    if (a !== undefined) {
      return a
    } else {
      const a = f(x)
      answers.set(x, a)
      return a
    }
  }
}

function magnitude(a, b) {
  return sqrt(a * a + b * b)
}

test('some fast tooling for generating alternatives to SELU', () => {
  const n = memoize(function n(z: number) {
    return Math.E ** (-0.5 * z ** 2) / sqrt(2 * Math.PI)
  })

  const step = 1 / 128
  const radius = 4
  function integral(f: (x: number) => number) {
    let sum = 0
    for (let i = -radius; i <= radius; i += step) {
      sum += step * f(i)
    }
    return sum
  }

  function cross(...sets) {
    return sets.reduceRight(
      (product, set) => {
        return flatMap(set, x => product.map(xs => [x, ...xs]))
      },
      [[]],
    )
  }

  function zoom(
    factor: number,
    activation: (x: number) => number,
  ): (x: number) => number {
    return x => factor * activation(x / factor)
  }

  const activation = (a: number, b: number, c: number) => (x: number) => {
    // sharp-tanh
    // if (x > 1) {
    //   return (x - 1) * b + a
    // } else if (x < -1) {
    //   return (x + 1) * b - a
    // } else {
    //   return x * a
    // }

    if (x >= 0) {
      return a * x - c * (1 / (1 / b + x) - b)
    } else {
      return a * x + c * (1 / (1 / b - x) - b)
    }

    // if (x >= 0) {
    //   return x
    // } else {
    //   return 0
    // }
  }

  function square(x) {
    return x * x
  }

  function solve(a: Range, b: Range, c: Range) {
    const samples = 6
    const walk = 1.2
    const best = { error: Infinity, a: NaN, b: NaN, c: NaN }
    const [aRad, bRad, cRad] = [a, b, c].map(
      ([min, max]) => (walk * (max - min)) / (samples - 1),
    )
    const combinations = cross(
      ...[a, b, c].map(([min, max]) => {
        if (max - min < 0.0001) {
          return [(max + min) / 2]
        }
        const step = (max - min) / (samples - 1)
        return new Array(samples).fill(null).map((_, i) => {
          return min + i * step
        })
      }),
    )

    for (let [a, b, c] of combinations) {
      const f = activation(a, b, c)

      let e = 0
      let i = 0
      for (let mu = -1 / 8; mu <= 1 / 8; mu += 1 / 32) {
        for (let sigma = 0.5; sigma <= 1.5; sigma += 1 / 8) {
          i++
          const m1 = mu
          const s1 = 1 - sigma
          const m2 = integral(x => f((x + mu) * sigma) * n(x))
          const s2 = 1 - integral(x => square(m2 - f((x + mu) * sigma)) * n(x))
          const offset = magnitude(s1, m1)
          const adjustment = magnitude(s2 - s1, m2 - m1)
          const cos =
            ((s2 - s1) * s1 + (m2 - m1) * m1) / (offset * adjustment || 1)
          e += cos < Math.cos(0.875 * Math.PI) ? 0 : 1
        }
      }

      if (e / i < best.error) {
        best.error = e / i
        best.a = a
        best.b = b
        best.c = c
      }
    }
    if (combinations.length === 1) {
      return best
    } else {
      return solve(
        [max(a[0], best.a - aRad), min(a[1], best.a + aRad)],
        [max(b[0], best.b - bRad), min(b[1], best.b + bRad)],
        [max(c[0], best.c - cRad), min(c[1], best.c + cRad)],
      )
    }
  }

  // SILU
  //   const { a, b, c, error } = solve(0.5, 1, 3, 6, 0.35, 1)
  // SZED
  //   const { a, b, c, error } = solve([1, 2], [0.01, 0.65], [0.35, 1.2])
  // SWOOP (0.03567, 2.72844, 0.47787)
  const { a, b, c, error } = solve([0, 0.5], [1, 7], [0.1, 1])

  console.log('best', error, a.toFixed(5), b.toFixed(5), c.toFixed(5))
})
