import React from 'react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Card from './Card'
import CardContent from './CardContent'
import { Divider } from '@material-ui/core'

type NavBarEntry = {
  description: string
  key: string
  onClick: () => void
}

export type NavBarProps = {
  entries: NavBarEntry[]
}

export default class NavBar extends React.Component<NavBarProps> {
  render() {
    const { entries } = this.props
    const elements = entries.map(({ description, onClick, key }) => {
      return (
        <ListItem button onClick={onClick} key={key}>
          <ListItemText>{description}</ListItemText>
        </ListItem>
      )
    })
    return (
      <Card style={{ minWidth: '280px' }}>
        <CardContent style={{ padding: '24px 0 24px' }}>
          <List>{elements}</List>
        </CardContent>
      </Card>
    )
  }
}
