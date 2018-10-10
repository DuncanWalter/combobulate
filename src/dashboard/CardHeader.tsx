import * as React from 'react'
import Typography from '@material-ui/core/Typography'

const cardHeader = {
  padding: '24px',
  color: '#5577cc',
}

export default class CardHeader extends React.Component {
  render() {
    return (
      <div style={cardHeader}>
        <Typography variant="display1" color="inherit" noWrap>
          {this.props.children}
        </Typography>
      </div>
    )
  }
}
