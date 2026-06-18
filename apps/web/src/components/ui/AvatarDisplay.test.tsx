import { render, screen, fireEvent } from '@testing-library/react'
import AvatarDisplay from './AvatarDisplay'
import { DEFAULT_AVATAR, buildAvatarUrl } from '@/config/avatars'

describe('AvatarDisplay', () => {
  it('renders an img with the correct src', () => {
    const { container } = render(<AvatarDisplay opts={DEFAULT_AVATAR} seed="testuser" />)
    const img = container.querySelector('img') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', buildAvatarUrl(DEFAULT_AVATAR, 'testuser'))
  })

  it('uses DEFAULT_AVATAR when opts is null', () => {
    const { container } = render(<AvatarDisplay opts={null} seed="u" />)
    const img = container.querySelector('img') as HTMLImageElement
    expect(img).toHaveAttribute('src', buildAvatarUrl(DEFAULT_AVATAR, 'u'))
  })

  it('applies size to the wrapper', () => {
    const { container } = render(<AvatarDisplay opts={DEFAULT_AVATAR} seed="u" size={48} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveStyle('width: 48px')
    expect(wrapper).toHaveStyle('height: 48px')
  })

  it('shows initial letter fallback on image error', () => {
    const { container } = render(<AvatarDisplay opts={DEFAULT_AVATAR} seed="adriana" size={32} />)
    const img = container.querySelector('img') as HTMLImageElement
    fireEvent.error(img)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('wrapper is aria-hidden', () => {
    const { container } = render(<AvatarDisplay opts={DEFAULT_AVATAR} seed="u" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
