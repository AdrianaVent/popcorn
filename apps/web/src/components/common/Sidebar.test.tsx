import { render, screen, fireEvent } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import Sidebar from './Sidebar'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: (sel: (s: { role: null }) => unknown) => sel({ role: null }),
}))

jest.mock('@/components/common/SettingsModal', () =>
  function MockSettingsModal({ onClose }: { onClose: () => void }) {
    return <div role="dialog" aria-label="Settings"><button onClick={onClose}>Close</button></div>
  }
)

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('next/image', () =>
  function MockImage({ alt }: { alt: string }) {
    return <img alt={alt} />
  }
)

jest.mock('next/link', () =>
  function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>
  }
)

jest.mock('@/components/icons', () => ({
  FilmIcon: () => <svg />,
  TvIcon: () => <svg />,
  GearIcon: () => <svg />,
  UsersIcon: () => <svg />,
  HomeIcon: () => <svg />,
  LogOutIcon: () => <svg />,
  ChevronLeftIcon: () => <svg />,
  ChevronRightIcon: () => <svg />,
  BookmarkIcon: () => <svg />,
}))

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

const baseProps = {
  activeKey: 'movies',
  serverRole: 'guest' as const,
  onLogout: jest.fn(),
}

describe('Sidebar — axe', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
    })
  })

  it('has no axe violations (expanded, guest)', async () => {
    const { container } = render(<Sidebar {...baseProps} />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('has no axe violations (expanded, admin)', async () => {
    const { container } = render(<Sidebar {...baseProps} serverRole="admin" activeKey="users" />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('Sidebar — ARIA', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() }),
    })
  })

  it('active nav link has aria-current="page"', () => {
    render(<Sidebar {...baseProps} activeKey="movies" />)
    expect(screen.getByRole('link', { name: 'nav.movies' })).toHaveAttribute('aria-current', 'page')
  })

  it('inactive nav links do not have aria-current', () => {
    render(<Sidebar {...baseProps} activeKey="movies" />)
    expect(screen.getByRole('link', { name: 'nav.home' })).not.toHaveAttribute('aria-current')
  })

  it('nav links have accessible names via aria-label', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByRole('link', { name: 'nav.home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'nav.movies' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'nav.series' })).toBeInTheDocument()
  })

  it('settings button has accessible name', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByRole('button', { name: 'nav.settings' })).toBeInTheDocument()
  })

  it('logout button has accessible name', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByRole('button', { name: 'topbar.logout' })).toBeInTheDocument()
  })

  it('toggle button has accessible label when expanded', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByRole('button', { name: 'nav.collapseSidebar' })).toBeInTheDocument()
  })

  it('toggle button label changes to expand after collapsing', () => {
    render(<Sidebar {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'nav.collapseSidebar' }))
    expect(screen.getByRole('button', { name: 'nav.expandSidebar' })).toBeInTheDocument()
  })

  it('toggle button has aria-expanded=true when expanded', () => {
    render(<Sidebar {...baseProps} />)
    expect(screen.getByRole('button', { name: 'nav.collapseSidebar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggle button has aria-expanded=false after collapsing', () => {
    render(<Sidebar {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'nav.collapseSidebar' }))
    expect(screen.getByRole('button', { name: 'nav.expandSidebar' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggle button has aria-controls pointing to the nav', () => {
    render(<Sidebar {...baseProps} />)
    const toggle = screen.getByRole('button', { name: 'nav.collapseSidebar' })
    expect(toggle).toHaveAttribute('aria-controls', 'sidebar-nav')
    expect(document.getElementById('sidebar-nav')).toBeInTheDocument()
  })

  it('my-list link visible for guest, hidden for admin', () => {
    const { rerender } = render(<Sidebar {...baseProps} serverRole="guest" />)
    expect(screen.getByRole('link', { name: 'nav.myList' })).toBeInTheDocument()
    rerender(<Sidebar {...baseProps} serverRole="admin" />)
    expect(screen.queryByRole('link', { name: 'nav.myList' })).not.toBeInTheDocument()
  })

  it('users link visible for admin, hidden for guest', () => {
    const { rerender } = render(<Sidebar {...baseProps} serverRole="admin" />)
    expect(screen.getByRole('link', { name: 'nav.users' })).toBeInTheDocument()
    rerender(<Sidebar {...baseProps} serverRole="guest" />)
    expect(screen.queryByRole('link', { name: 'nav.users' })).not.toBeInTheDocument()
  })

  it('settings button opens SettingsModal', () => {
    render(<Sidebar {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'nav.settings' }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
  })

  it('logout button calls onLogout', () => {
    render(<Sidebar {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'topbar.logout' }))
    expect(baseProps.onLogout).toHaveBeenCalledTimes(1)
  })
})
