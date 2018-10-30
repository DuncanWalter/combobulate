import { mapRow } from './batchMath'
import {
  TransformationFactory,
  pipeTransform,
  UniformTransformation,
  Transformation,
} from './transform'
import { PipeTrace } from './transform/pipe'
import { regularize, Config } from './transform/regularize'

export default class NeuralNet<
  TFs extends TransformationFactory<Transformation<any, any, any>>[],
  C extends Config<TFs[number]>
> {
  inputSize: number
  outputSize: number
  training: true
  transform: UniformTransformation<number, PipeTrace<number>, C>

  transformations: TFs
  state: number

  constructor(config: {
    inputSize: number
    serializedContent?: string
    transformations: TFs
  }) {
    this.transformations = config.transformations
    this.inputSize = config.inputSize
    this.training = true
    this.transform = regularize<number, C>(
      pipeTransform<number, TFs>(...config.transformations)({
        size: config.inputSize,
        serializedContent: config.serializedContent,
      }),
    )
    this.outputSize = this.transform.size
    this.state = 0
  }

  passForward(
    input: number[],
    config: C,
  ): { output: number[]; trace: PipeTrace<number> } {
    return this.transform.passForward(input, this.state, config)
  }

  passBack(batch: { trace: PipeTrace<number>; error: number[] }[], config: C) {
    for (let i = 0; i < batch.length; i++) {
      const trace = batch[i].trace
      const error = batch[i].error
      if (trace.history !== this.state) {
        throw new Error('Net has been mutated since trace was issued.')
      }
      this.transform.passBack(
        trace,
        mapRow(error, e => e / batch.length),
        () => {},
        config,
      )
    }
    this.transform.applyLearning(config)
  }

  serialize(): string {
    return this.transform.serialize()
  }

  clean(): void {
    this.transform.clean()
  }

  // createPredictor(): (input: number[]) => number[] {
  //   const transform = this.transform
  //   const config = { training: false, learningRate: 0, inertia: 0 }
  //   return function predict(input: number[]): number[] {
  //     return transform.passForward(input, -1, config).output
  //   }
  // }

  // createModel(config: {
  //   learningRate: number | ((epoch: number) => number)
  //   batchSize: number | ((epoch: number) => number)
  //   truth: {
  //     type: 'absolute',
  //     pairs: {input: number[], output: number[]},

  //   }

  //   loss: { derivative(x: number): number }
  // }): { train(epochs?: number): void } {

  // }

  clone() {
    return new NeuralNet({
      transformations: this.transformations,
      serializedContent: this.serialize(),
      inputSize: this.inputSize,
    })
  }
}
