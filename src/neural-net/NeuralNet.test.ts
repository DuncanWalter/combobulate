import NeuralNet from './NeuralNet'
import { denseTransform, guardTransform, logicalTransform } from './transform'

test('The xor function works', () => {
  // skewed xor function for testing
  let xData = [[0, 0], [0, 37], [1, 0], [1, 37]]
  let yData = [[0], [1], [1], [0]]

  let ann = new NeuralNet(
    {
      learningRate: 0.5,
      inputSize: 2,
    },
    guardTransform(),
    denseTransform(16),
    logicalTransform(12),
    logicalTransform(9),
    denseTransform(1),
  )

  for (let epoch = 0; epoch < 5000; epoch++) {
    let feedBack = []
    // let err = 0
    for (let i in xData) {
      const { output, trace } = ann.passForward(xData[i])
      const error = [yData[i][0] - output[0]]
      // err += Math.abs(error[0])
      feedBack.push({ trace, error })
    }
    // if (epoch % 1000 === 999) {
    //   console.log(err / 4)
    // }
    ann.passBack(feedBack)
    // break
  }
})
