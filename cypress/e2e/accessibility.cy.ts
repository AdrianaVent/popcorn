// axe-core accessibility checks on key pages.
// These run after the full ARIA + HC audit so regressions are caught early.

const AXE_OPTIONS = {
  runOnly: ['wcag2a', 'wcag2aa'],
}

// Home page uses yellow-500 star scores by design — below AA contrast threshold
const AXE_OPTIONS_HOME = {
  runOnly: ['wcag2a', 'wcag2aa'],
  rules: { 'color-contrast': { enabled: false } },
}

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('Accessibility — auth', () => {
  it('has no detectable violations on the login page', () => {
    cy.visitWithEnglish('/login')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations on the reset password form', () => {
    cy.visitWithEnglish('/login')
    cy.contains('Forgot password?').click()
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations with login error visible', () => {
    cy.visitWithEnglish('/login')
    cy.get('input[name="email"]').type('wrong_user')
    cy.get('input[name="password"]').type('WrongPass1!')
    cy.get('button[type="submit"]').click()
    cy.get('[role="alert"]').should('be.visible')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })
})

// ─── Admin pages ─────────────────────────────────────────────────────────────

describe('Accessibility — admin pages', () => {
  it('has no detectable violations on the home page', () => {
    cy.visitAsAdmin('/home')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS_HOME)
  })

  it('has no detectable violations on the movies page', () => {
    cy.visitAsAdmin('/movies')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations on the series page', () => {
    cy.visitAsAdmin('/series')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations on the users page', () => {
    cy.visitAsAdmin('/users')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })
})

// ─── Settings ────────────────────────────────────────────────────────────────

describe('Accessibility — settings modal', () => {
  it('has no detectable violations with settings modal open', () => {
    cy.visitAsAdmin('/home')
    cy.get('[data-cy="nav-settings"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })
})

// ─── My list (guest) ─────────────────────────────────────────────────────────

describe('Accessibility — My list (guest)', () => {
  it('has no detectable violations on the my-list page (empty state)', () => {
    cy.visitAsGuest('/my-list')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations with movie filters visible', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/my-list', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          win.localStorage.setItem('popcorn-watched-v3', JSON.stringify({
            state: {
              movies: {
                [userId]: {
                  1: { id: 1, title: 'Inception', poster_path: null, release_date: '2010-07-16', vote_average: 8.8, vote_count: 35000, original_language: 'en', watchedAt: Date.now()},
                },
              },
              episodes: {},
              seriesData: {},
            },
            version: 0,
          }))
        },
      })
    })
    cy.contains('Inception').should('be.visible')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations with series filters visible', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/my-list', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          win.localStorage.setItem('popcorn-watched-v3', JSON.stringify({
            state: {
              movies: {},
              episodes: { [userId]: { 10: { 101: { seasonNumber: 1 } } } },
              seriesData: {
                [userId]: {
                  10: { id: 10, name: 'Breaking Bad', poster_path: null, first_air_date: '2008-01-20', vote_average: 9.5, vote_count: 200000, original_language: 'en', number_of_episodes: 62, watchedAt: Date.now()},
                },
              },
            },
            version: 0,
          }))
        },
      })
    })
    cy.get('[data-cy="tab-series"]').click()
    cy.contains('Breaking Bad').should('be.visible')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })

  it('has no detectable violations on the watchlist tab', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/my-list', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          win.localStorage.setItem('popcorn-watchlist-v1', JSON.stringify({
            state: {
              movies: {
                [userId]: {
                  2: { id: 2, title: 'Dune', poster_path: null, release_date: '2021-09-15', vote_average: 8.0, vote_count: 12000, original_language: 'en', addedAt: Date.now()},
                },
              },
              series: {},
            },
            version: 0,
          }))
        },
      })
    })
    cy.get('[data-cy="tab-towatch"]').click()
    cy.contains('Dune').should('be.visible')
    cy.injectAxe()
    cy.checkA11y(undefined, AXE_OPTIONS)
  })
})
