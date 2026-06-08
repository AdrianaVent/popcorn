// The empty export makes this an ES module, required for declaration merging
export {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Cypress.Chainable<Cypress.Response<{ userId: string; role: string }>>
      visitWithEnglish(path: string): void
      visitAsAdmin(path: string): void
      visitAsGuest(path: string): void
    }
  }
}

const forceEnglish = (win: Window, userId?: string) => {
  const userLanguages = userId ? { [userId]: 'en' } : {}
  win.localStorage.setItem(
    'popcorn-language',
    JSON.stringify({ state: { language: 'en', userLanguages }, version: 0 })
  )
}

const setUserStore = (win: Window, userId: string, role: string) => {
  win.localStorage.setItem(
    'popcorn-user',
    JSON.stringify({ state: { userId, role }, version: 0 })
  )
}

// Programmatic login via API — faster than UI login for non-auth tests
Cypress.Commands.add('login', (username: string, password: string) => {
  return cy.request({ method: 'POST', url: '/api/auth/login', body: { username, password } })
})

// Visit unauthenticated with English forced via localStorage
Cypress.Commands.add('visitWithEnglish', (path: string) => {
  cy.visit(path, {
    onBeforeLoad: (win: Window) => {
      forceEnglish(win)
    },
  })
})

// Login + force English for that user + seed userStore + visit
Cypress.Commands.add('visitAsAdmin', (path: string) => {
  cy.login('cypress_admin', 'CypressAdmin1!').then((resp) => {
    const { userId, role } = resp.body
    cy.visit(path, {
      onBeforeLoad: (win: Window) => {
        forceEnglish(win, userId)
        setUserStore(win, userId, role)
      },
    })
  })
})

// Login as guest + force English for that user + seed userStore + visit
Cypress.Commands.add('visitAsGuest', (path: string) => {
  cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
    const { userId, role } = resp.body
    cy.visit(path, {
      onBeforeLoad: (win: Window) => {
        forceEnglish(win, userId)
        setUserStore(win, userId, role)
      },
    })
  })
})
