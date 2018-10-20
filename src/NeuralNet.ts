import { mapRow } from './batchMath'
import {
  TransformationFactory,
  pipeTransform,
  UniformTransformation,
} from './transform'
import { PipeTrace } from './transform/pipe'
import { regularize } from './transform/regularize'

export default class NeuralNet {
  learningRate: number
  learningDecay: number
  inputSize: number
  training: true
  transform: UniformTransformation<number, PipeTrace<number>>
  state: number

  constructor(config: {
    learningRate: number
    learningDecay?: number
    inputSize: number
    serializedContent?: string
    transformations: TransformationFactory<PipeTrace<number>>[]
  }) {
    this.inputSize = config.inputSize
    this.learningRate = config.learningRate
    this.learningDecay = config.learningDecay || 1
    this.training = true
    this.transform = regularize(
      pipeTransform<number>(...config.transformations)({
        size: config.inputSize,
        serializedContent: config.serializedContent,
      }),
    )
    this.state = 0
  }

  passForward(input: number[]): { output: number[]; trace: PipeTrace<number> } {
    return this.transform.passForward(input, this.state, this)
  }

  passBack(feedBack: { trace: PipeTrace<number>; error: number[] }[]) {
    for (let i = 0; i < feedBack.length; i++) {
      const trace = feedBack[i].trace
      const error = feedBack[i].error
      if (trace.history !== this.state) {
        throw new Error('The net has been mutated since this trace was issued.')
      }
      this.transform.passBack(
        trace,
        mapRow(error, e => e * this.learningRate),
        () => {},
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
