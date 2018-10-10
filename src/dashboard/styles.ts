import { createStyles } from '@material-ui/core/styles'

export type Classes = { [K in keyof typeof styles]: string }

export const styles = createStyles({
  root: {
    backgroundColor: '#dadadd',
    position: 'relative',
    display: 'flex',
    padding: '48px',
    alignItems: 'start',
    justifyContent: 'space-around',
    height: '100vh',
    boxSizing: 'border-box',
  },
  appBar: {
    backgroundColor: '#444488',
    color: '#ffffff',
    padding: 24,
  },
  split: {
    display: 'flex',
    alignItems: 'start',
    width: '70vw',
    minWidth: '900px',
  },
  padded: {
    padding: '24px',
  },
})
