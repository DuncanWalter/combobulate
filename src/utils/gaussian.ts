const { log, sqrt, cos, PI, random } = Math

export function normal(mu: number = 0, sigma: number = 1): number {
  // approximation
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += random()
  }
  return sum - 6

  // technically unsafe (random can generate 0 and cause an explosion)
  // return mu + sigma * sqrt(-2 * log(random())) * cos(2 * PI * random())
}
