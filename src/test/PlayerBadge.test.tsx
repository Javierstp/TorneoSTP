import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerBadge } from '../components/PlayerBadge'
import type { Player } from '../types'

const mockPlayer: Player = {
  id: '1',
  tournament_id: 't1',
  group_id: null,
  name: 'Juan Pérez',
  country_code: 'AR',
  country_name: 'Argentina',
}

describe('PlayerBadge', () => {
  it('renders player country code and name', () => {
    render(<PlayerBadge player={mockPlayer} />)

    expect(screen.getByText('AR')).toBeInTheDocument()
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('renders placeholder when player is null', () => {
    render(<PlayerBadge player={null} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders only country code in compact mode', () => {
    render(<PlayerBadge player={mockPlayer} compact />)

    expect(screen.getByText('AR')).toBeInTheDocument()
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
  })
})
