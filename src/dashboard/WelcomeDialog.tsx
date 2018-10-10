import React from 'react'
import Card from './Card'
import CardHeader from './CardHeader'
import CardContent from './CardContent'
import Typography from '@material-ui/core/Typography'
import Button from './Button'

export type WelcomeDialogProps = {
  message: string
}

export default class WelcomeDialog extends React.Component<WelcomeDialogProps> {
  render() {
    const { message } = this.props
    return (
      <Card>
        <CardHeader>Welcome!</CardHeader>
        <CardContent>
          <Typography variant="body1">
            This is a way overblown RL project for our machine learning course.
            It does some stuff
          </Typography>
        </CardContent>
        <CardContent>
          <Typography variant="body1">{message}</Typography>
        </CardContent>
        <CardContent style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button text="Dismiss" />
        </CardContent>
      </Card>
    )
  }
}
