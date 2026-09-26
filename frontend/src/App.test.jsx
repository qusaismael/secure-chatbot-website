import { render, screen } from '@testing-library/react'
import { test, expect } from 'vitest'
import App from './App'

test('simulation is unmistakable and source is linked', () => {
  render(<App />)
  expect(screen.getByText(/simulated security flow/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /mock response source/i }))
    .toHaveAttribute('href', 'https://github.com/qusaismael/secure-chatbot-website/blob/main/frontend/src/utils/mockBackend.js')
})
