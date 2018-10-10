import * as React from 'react'

const cardContentStyles = {
  padding: '0 24px 24px',
}

export default class CardContent extends React.Component<{ style?: any }> {
  render() {
    const style = this.props.style
      ? { ...cardContentStyles, ...this.props.style }
      : cardContentStyles
    return <div style={style}>{this.props.children}</div>
  }
}
