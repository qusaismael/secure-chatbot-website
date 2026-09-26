import { render, screen } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import Chat from './Chat'

vi.mock('../utils/mockBackend', () => ({ processMessage: vi.fn(async () => ({
  success: true, data: { response: 'Simulated answer', metadata: {} }
})) }))

test('composer has a name and messages announce updates', () => {
  render(<Chat />)
  expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument()
  expect(screen.getByRole('log', { name: 'Chat messages' })).toHaveAttribute('aria-live', 'polite')
})
