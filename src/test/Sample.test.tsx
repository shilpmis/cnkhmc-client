import React from 'react'
import { render, screen } from '@testing-library/react'

function SimpleComponent() {
  return <div>Hello, Vitest!</div>
}

describe('SimpleComponent', () => {
  it('renders the hello message', () => {
    render(<SimpleComponent />)
    expect(screen.getByText('Hello, Vitest!')).toBeInTheDocument()
  })
})
