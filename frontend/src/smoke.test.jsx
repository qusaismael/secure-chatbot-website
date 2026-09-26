import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from './App'

test('existing app renders', () => {
  render(<App />)
  expect(screen.getByText('SecureChat')).toBeInTheDocument()
})
