import NeuralNet from './NeuralNet'
import { rowZip } from './batchMath'

type Config<N> = N extends NeuralNet<any, infer C> ? C : never

export type ModelConfiguration<Net> = {
  config(epoch: number): Config<Net>
  batch(epoch: number): { input: number[]; output: number[] }[]
  error: {
    value(target: number, prediction: number): number
    derivative(target: number, prediction: number): number
  }
}

// TODO: batch needs to be a train param
// TODO: train should configure the throttle
export function createModel<Net extends NeuralNet<any, any>>(
  net: Net,
  { config, batch, error }: ModelConfiguration<Net>,
) {
  let epoch = 0
  let cancel = true

  return {
    cancelTraining() {
      cancel = true
    },
    train(epochs: number, log: (epoch: number) => void) {
      if (!cancel) {
        console.error('model.train() called on model which is already training')
      } else {
        cancel = false
      }
      const finalEpoch = epoch + epochs
      let lastLoggedEpoch = -Infinity
      let lastLogTime = 0

      return new Promise(resolve => {
        function scheduleTraining() {
          if (!cancel && epoch < finalEpoch) {
            setTimeout(trainEpoch, 0)
          } else {
            log(epoch)
            cancel = true
            resolve()
            return
          }
          if (epoch - lastLoggedEpoch < 10) {
            return
          }
          if (Date.now() - lastLogTime < 1000) {
            return
          }
          lastLoggedEpoch = epoch
          lastLogTime = Date.now()
          log(epoch)
        }

        function trainEpoch() {
          epoch += 1
          const currentConfig = config(epoch)
          net.passBack(
            batch(epoch).map(({ input, output: target }) => {
              const { trace, output: prediction } = net.passForward(
                input,
                currentConfig,
              )
              return {
                trace,
                error: rowZip(target, prediction, error.derivative),
              }
            }),
            currentConfig,
          )
          scheduleTraining()
        }
        scheduleTraining()
      })
    },
  }
}
