import NeuralNet from './NeuralNet'
import { denseTransform, guardTransform, logicalTransform } from './transform'

test('The Neural Net Runs', () => {
  // skewed xor function for testing
  let xData = [[0, 0], [0, 37], [1, 0], [1, 37]]
  let yData = [[0], [1], [1], [0]]

  let ann = new NeuralNet({
    learningRate: 0.2,
    inputSize: 2,
    transformations: [
      guardTransform(),
      denseTransform(20),
      logicalTransform(16),
      logicalTransform(12),
      denseTransform(1),
    ],
  })

  const predict = ann.createPredictor()

  for (let epoch = 0; epoch < 2100; epoch++) {
    let feedBack = []
    // let ve = 0
    for (let i in xData) {
      const { output, trace } = ann.passForward(xData[i])
      const error = [yData[i][0] - output[0]]
      feedBack.push({ trace, error })
    }
    if (false) {
      //epoch % 300 === 299) {
      console.log(
        Math.min(
          ...xData
            .map(predict)
            .map(xs => xs[0])
            .map((x, i) => Math.abs(yData[i][0] - x))
            .map(x => -Math.log10(x)),
        ).toFixed(1),
      )
    }
    ann.passBack(feedBack)
    // break
  }
})
