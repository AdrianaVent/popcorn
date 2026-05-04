import { useToastStore } from './toastStore'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('addToast', () => {
  it('adds a toast with the given type and message', () => {
    useToastStore.getState().addToast('success', 'User created')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('User created')
  })

  it('assigns a unique id to each toast', () => {
    useToastStore.getState().addToast('success', 'First')
    useToastStore.getState().addToast('error', 'Second')
    const { toasts } = useToastStore.getState()
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('stacks multiple toasts', () => {
    useToastStore.getState().addToast('success', 'First')
    useToastStore.getState().addToast('error', 'Second')
    useToastStore.getState().addToast('warning', 'Third')
    useToastStore.getState().addToast('info', 'Fourth')
    expect(useToastStore.getState().toasts).toHaveLength(4)
  })

  it('auto-removes after 4 seconds', () => {
    useToastStore.getState().addToast('success', 'Hello')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    jest.advanceTimersByTime(4000)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('does not auto-remove before 4 seconds', () => {
    useToastStore.getState().addToast('success', 'Hello')
    jest.advanceTimersByTime(3999)
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('each toast has its own independent timer', () => {
    useToastStore.getState().addToast('success', 'First')
    jest.advanceTimersByTime(2000)
    useToastStore.getState().addToast('error', 'Second')
    jest.advanceTimersByTime(2000)
    // First toast (4s total) should be gone, second (2s total) should remain
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].message).toBe('Second')
  })
})

describe('removeToast', () => {
  it('removes the toast with the given id', () => {
    useToastStore.getState().addToast('success', 'Hello')
    const { toasts } = useToastStore.getState()
    useToastStore.getState().removeToast(toasts[0].id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('only removes the targeted toast, leaving others intact', () => {
    useToastStore.getState().addToast('success', 'Keep me')
    useToastStore.getState().addToast('error', 'Remove me')
    const { toasts } = useToastStore.getState()
    useToastStore.getState().removeToast(toasts[1].id)
    const remaining = useToastStore.getState().toasts
    expect(remaining).toHaveLength(1)
    expect(remaining[0].message).toBe('Keep me')
  })

  it('does nothing when id does not exist', () => {
    useToastStore.getState().addToast('success', 'Hello')
    useToastStore.getState().removeToast('non-existent-id')
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })
})
