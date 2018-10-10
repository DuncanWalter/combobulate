import React from 'react'
import { render } from 'react-dom'

import Dashboard from './dashboard/Dashboard'

// Atomic react root
;(function bootstrap(anchorElement: HTMLElement | null): void {
  if (anchorElement) {
    render(<Dashboard />, anchorElement)
  } else {
    console.error('No anchor element provided')
  }
})(document.getElementById('anchor'))
