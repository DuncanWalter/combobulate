import * as React from 'react'

const cardStyle = {
  borderRadius: '4px',
  margin: '12px',
  backgroundColor: '#ffffff',
  transition: '0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
}

export default class Card extends React.Component<{ style?: any }> {
  render() {
    const { style = {}, children } = this.props
    return <div style={{ ...style, ...cardStyle }}>{children}</div>
  }
}
