test('some fast tooling for generating alternatives to SELU', () => {
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

  const n = memoize(function n(z: number) {
    return Math.E ** (-0.5 * z ** 2) / Math.sqrt(2 * Math.PI)
  })

  function integral(f: (x: number) => number) {
    let sum = 0
    for (let i = -5; i <= 5; i += 0.03125) {
      sum += 0.03125 * f(i)
    }
    return sum
  }

  function zoom(
    factor: number,
    activation: (x: number) => number,
  ): (x: number) => number {
    return x => factor * activation(x / factor)
  }

  const activation = (a: number, b: number) => (x: number) => {
    // sharp-tanh
    // if (x > 1) {
    //   return (x - 1) * b + a
    // } else if (x < -1) {
    //   return (x + 1) * b - a
    // } else {
    //   return x * a
    // }

    // TODO: test out silu
    if (x >= 0) {
      return a * x - (1 / (1 / b + x) - b)
    } else {
      return a * x + (1 / (1 / b - x) - b)
    }

    // if (x >= 0) {
    //   return x
    // } else {
    //   return 0
    // }
  }

  function solve(
    minA: number,
    maxA: number,
    minB: number,
    maxB: number,
    minC: number,
    maxC: number,
  ) {
    const best = { error: Infinity, a: NaN, b: NaN, c: NaN }
    for (let i = 0; i < 5000; i++) {
      const a = Math.random() * (maxA - minA) + minA
      const b = Math.random() * (maxB - minB) + minB
      const c = Math.random() * (maxC - minC) + minC
      const f = zoom(c, activation(a, b))

      let e = 0
      let i = 0
      for (let mu = -0.1; mu <= 0.1; mu += 0.02) {
        for (let sigma = 0.5; sigma <= 1.75; sigma *= 1.1) {
          i++
          let m = integral(x => f((x + mu) * sigma) * n(x))
          if (m - mu > 0 === mu > 0 && m - mu < 0 === mu < 0) {
            m = Math.abs(m) + 1
          }
          let s = 1 - integral(x => f((x + mu) * sigma) ** 2 * n(x))
          if (
            (1 - s) / sigma > 1 === sigma > 1 &&
            (1 - s) / sigma < 1 === sigma < 1
          ) {
            s = Math.abs(s) + 1
          }
          e += m * m + s * s
        }
      }

      if (e / i < best.error) {
        best.error = e / i
        best.a = a
        best.b = b
        best.c = c
      }
    }
    return best
  }

  // SILU
  //   const { a, b, c, error } = solve(0.5, 1, 3, 6, 0.35, 1)
  // SZED
  //   const { a, b, c, error } = solve(1, 2, 0.1, 0.1, 0.35, 1)
  // SWOOP (0, 2.45980, 0.57228)
  const { a, b, c, error } = solve(0, 0, 0.3, 5, 0.4, 1.4)

  console.log('best', error, a.toFixed(5), b.toFixed(5), c.toFixed(5))
})
