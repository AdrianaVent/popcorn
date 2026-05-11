import { createJSONStorage } from 'zustand/middleware'

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

// In Node.js 25, typeof localStorage === 'object' (it's a built-in Web API global),
// so the standard `typeof localStorage === 'undefined'` guard fails.
// Using typeof window instead: Node.js never defines window, so this reliably
// detects server context and avoids triggering the --localstorage-file warning.
export const ssrStorage = createJSONStorage(
  () => (typeof window === 'undefined' ? noopStorage : localStorage) as Storage
)
