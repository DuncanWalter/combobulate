import React from 'react'
import { trainAgent } from '../web-worker/service'
import Card from './Card'
import CardHeader from './CardHeader'
import CardContent from './CardContent'
import Typography from '@material-ui/core/Typography'
import Button from './Button'

export type TrainDialogProps = any

// TODO this will get moved to the results/eval dialog later
type TrainDialogState = {
  epoch: number
  doneTraining: boolean
}

export default class TrainDialog extends React.Component<
  TrainDialogProps,
  TrainDialogState
> {
  constructor(props: TrainDialogProps) {
    super(props)
    this.state = {
      epoch: 0,
      doneTraining: false,
    }
  }

  callTrainAgent = () => {
    const agentName = 'Fred'
    const agentType = 'contextless'
    const epochs = 10
    const onProgress = this.trainingCallback
    const simplified = true
    trainAgent({ agentName, agentType, epochs, onProgress, simplified }).then(
      () => {
        this.setState({ doneTraining: true })
      },
    )
  }

  trainingCallback = (snapshot: { epoch: number }) => {
    console.log(snapshot)
    this.setState(state => ({ epoch: Math.max(snapshot.epoch, state.epoch) }))
  }

  render() {
    const { epoch, doneTraining } = this.state
    const doneMessage = doneTraining ? (
      <CardContent>
        <Typography variant="body1">We have completed training!</Typography>
      </CardContent>
    ) : (
      undefined
    )
    return (
      <Card>
        <CardHeader>Train New Agent</CardHeader>
        <CardContent>
          <Typography variant="body1">Current epoch number: {epoch}</Typography>
        </CardContent>
        {doneMessage}
        <CardContent style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button text="Dismiss" />
          <Button text="Train Agent" onClick={this.callTrainAgent} />
        </CardContent>
      </Card>
    )
  }
}
