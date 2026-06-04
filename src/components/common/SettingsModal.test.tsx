'use client'

import { render, screen, fireEvent } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import SettingsModal from './SettingsModal'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/ui/Modal', () =>
  function MockModal({ title, children }: { title: string; children: React.ReactNode }) {
    return <div role="dialog" aria-label={title}>{children}</div>
  }
)

jest.mock('@/components/icons', () => ({
  SunIcon: () => <svg data-testid="sun-icon" />,
  MoonIcon: () => <svg data-testid="moon-icon" />,
  ClockIcon: () => <svg data-testid="clock-icon" />,
  ContrastIcon: () => <svg data-testid="contrast-icon" />,
}))

const mockSetMode = jest.fn()
const mockSetLanguage = jest.fn()
const mockSetRegion = jest.fn()

jest.mock('@/store/themeStore', () => ({
  useThemeStore: () => ({ mode: 'light', setMode: mockSetMode }),
}))
jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'es', setLanguage: mockSetLanguage, region: 'ES', setRegion: mockSetRegion }),
}))
jest.mock('@/store/userStore', () => ({
  useUserStore: (sel: (s: { userId: string }) => unknown) => sel({ userId: 'u1' }),
}))

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

describe('SettingsModal — axe', () => {
  it('has no axe violations', async () => {
    const { container } = render(<SettingsModal onClose={jest.fn()} />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('SettingsModal — ARIA', () => {
  beforeEach(() => jest.clearAllMocks())

  it('language group has role="group" with accessible label', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    const group = screen.getByRole('group', { name: 'settings.language' })
    expect(group).toBeInTheDocument()
  })

  it('region group has role="group" with accessible label', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    expect(screen.getByRole('group', { name: 'settings.region' })).toBeInTheDocument()
  })

  it('theme group has role="group" with accessible label', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    expect(screen.getByRole('group', { name: 'settings.theme' })).toBeInTheDocument()
  })

  it('active language button has aria-pressed=true', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('active region button has aria-pressed=true', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'settings.regions.ES' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'settings.regions.US' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('active theme button has aria-pressed=true, others false', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'settings.themeLight' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'settings.themeDark' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls setLanguage when a language button is clicked', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(mockSetLanguage).toHaveBeenCalledWith('en', 'u1')
  })

  it('calls setRegion when a region button is clicked', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'settings.regions.US' }))
    expect(mockSetRegion).toHaveBeenCalledWith('US', 'u1')
  })

  it('calls setMode when a theme button is clicked', () => {
    render(<SettingsModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'settings.themeDark' }))
    expect(mockSetMode).toHaveBeenCalledWith('dark')
  })

  it('theme icons are aria-hidden', () => {
    const { container } = render(<SettingsModal onClose={jest.fn()} />)
    const iconWrappers = container.querySelectorAll('[aria-hidden="true"]')
    expect(iconWrappers.length).toBeGreaterThanOrEqual(4)
  })
})
