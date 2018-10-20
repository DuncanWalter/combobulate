import { mapRow, rowZip, vector } from './batchMath'
import {
  TransformationFactory,
  pipeTransform,
  regularize,
  UniformTransformation,
} from './transform'
import { PipeTrace } from './transform/pipe'

// TODO: instead of using an undefined traceHistory, use a number that is used
// TODO: to verify that all passbacks are being performed on live results

export default class NeuralNet {
  learningRate: number
  learningDecay: number
  inputSize: number
  training: true
  transform: UniformTransformation<undefined, PipeTrace<undefined>>

  constructor(
    config: {
      learningRate: number
      learningDecay?: number
      inputSize: number
      serializedContent?: string
    },
    ...transformFactories: TransformationFactory<PipeTrace<undefined>>[]
  ) {
    this.inputSize = config.inputSize
    this.learningRate = config.learningRate
    this.learningDecay = config.learningDecay || 1
    this.training = true
    this.transform = regularize(
      pipeTransform<undefined>(...transformFactories)({
        size: config.inputSize,
        serializedContent: config.serializedContent,
      }),
    )
  }

  passForward(
    input: number[],
  ): { output: number[]; trace: PipeTrace<undefined> } {
    return this.transform.passForward(input, undefined, this)
  }

  passBack(feedBack: { trace: PipeTrace<undefined>; error: number[] }[]) {
    for (let i = 0; i < feedBack.length; i++) {
      const trace = feedBack[i].trace
      const error = feedBack[i].error
      this.transform.passBack(
        trace,
        mapRow(error, e => e * this.learningRate),
        trace => {
          if (trace !== undefined) {
            throw new Error(
              'Neural Net passBack failed- the resulting trace was not the input history',
            )
          }
        },
        this,
      )
    }
    this.transform.applyLearning(1 / feedBack.length)
  }

  serialize(): string {
    return this.transform.serialize()
  }

  clean(): void {
    this.transform.clean()
  }
}
