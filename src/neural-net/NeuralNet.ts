import { mapRow, rowZip, vector } from './batchMath'
import {
  TransformationFactory,
  pipeTransform,
  regularize,
  UniformTransformation,
} from './transform'
import { PipeTrace } from './transform/pipe'

export default class NeuralNet {
  learningRate: number
  inputSize: number
  transform: UniformTransformation<undefined, unknown>

  constructor(
    config: {
      learningRate: number
      inputSize: number
      serializedContent?: string
    },
    ...transformFactories: TransformationFactory<PipeTrace>[]
  ) {
    this.inputSize = config.inputSize
    this.learningRate = config.learningRate
    this.transform = regularize<undefined>(
      pipeTransform<undefined>(...transformFactories)({
        size: config.inputSize,
        serializedContent: config.serializedContent,
      }),
    )
  }

  passForward(input: number[]): { output: number[]; trace: unknown } {
    return this.transform.passForward(input, undefined)
  }

  passBack(feedBack: { trace: PipeTrace; error: number[] }[]) {
    // TODO not utilized currently, and may not ever be so I'm
    // TODO leaving error heat-maps commented out
    // const heat = vector(this.inputSize, () => 0)
    // const mean = vector(this.inputSize, () => 0)
    // const scaledError = mapRow(error, n => n * this.learningRate)
    // const inputError =
    this.transform.passBack(feedBack)
    // rowZip(heat, inputError, (a, b) => a + Math.abs(b), heat)
    // rowZip(mean, inputError, (a, b) => a + b, mean)
    //}
    this.transform.applyLearning(1 / feedBack.length)
    // return { heat, mean }
  }

  serialize(): string {
    return this.transform.serialize()
  }

  clean(): void {
    this.transform.clean()
  }
}
