import * as React from 'react'
import { Typography } from '@material-ui/core'

const buttonStyles = {
  marginLeft: '24px',
  padding: '8px 16px 8px',
  cursor: 'pointer',
  color: 'rgba(255, 255, 255, 0.96)',
  backgroundColor: '#5577cc',
  display: 'inline-block',
  borderRadius: '4px',
  transition: '0.2s',
}

const hoveredStyles = {
  ...buttonStyles,
  backgroundColor: 'rgba(85, 119, 221, 0.8)',
}

export default class Button extends React.Component<
  {
    text?: string
    onClick?: () => unknown
  },
  { hovered: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hovered: false }
  }
  render() {
    const { text, onClick } = this.props
    const { hovered } = this.state
    return (
      <div
        style={hovered ? hoveredStyles : buttonStyles}
        onClick={onClick}
        onMouseEnter={() => {
          this.setState({ hovered: true })
        }}
        onMouseLeave={() => {
          this.setState({ hovered: false })
        }}
      >
        <Typography variant="button" color="inherit">
          {text}
        </Typography>
      </div>
    )
  }
}
