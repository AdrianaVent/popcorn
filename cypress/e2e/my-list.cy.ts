const seedWatched = (win: Window, userId: string) => {
  win.localStorage.setItem(
    'popcorn-watched-v3',
    JSON.stringify({
      state: {
        movies: {
          [userId]: {
            1: {
              id: 1,
              title: 'Inception',
              poster_path: '/inception.jpg',
              release_date: '2010-07-16',
              collection_id: null,
              collection_name: null,
            },
          },
        },
        episodes: {
          [userId]: {
            10: { 101: { seasonNumber: 1 } },
          },
        },
        seriesData: {
          [userId]: {
            10: {
              id: 10,
              name: 'Breaking Bad',
              poster_path: '/bb.jpg',
              first_air_date: '2008-01-20',
              number_of_episodes: 62,
            },
          },
        },
      },
      version: 0,
    })
  )
}

describe('My List', () => {
  it('shows the page header and tabs', () => {
    cy.visitAsGuest('/my-list')
    cy.contains('My list').should('be.visible')
    cy.contains('button', 'Movies').should('be.visible')
    cy.contains('button', 'Series').should('be.visible')
  })

  it('shows empty state when nothing is watched', () => {
    cy.visitAsGuest('/my-list')
    cy.contains('No watched movies yet').should('be.visible')
  })

  it('shows watched movie with count badge', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/my-list', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          seedWatched(win, userId)
        },
      })
    })
    cy.contains('Inception').should('be.visible')
    cy.contains('1 movies').should('be.visible')
  })

  it('shows group by saga button when movies are present', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/my-list', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          seedWatched(win, userId)
        },
      })
    })
    cy.contains('Group by saga').should('be.visible')
  })

  it('switches to series tab and shows empty state', () => {
    cy.visitAsGuest('/my-list')
    cy.contains('button', 'Series').click()
    cy.contains('No series started yet').should('be.visible')
  })

  it('shows watched series in series tab', () => {
    cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
      const { userId, role } = resp.body
      cy.visit('/my-list', {
        onBeforeLoad: (win: Window) => {
          win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
          win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
          seedWatched(win, userId)
        },
      })
    })
    cy.contains('button', 'Series').click()
    cy.contains('Breaking Bad').should('be.visible')
  })

  it('my list nav item is not visible for admins', () => {
    cy.visitAsAdmin('/home')
    cy.get('nav').should('not.contain.text', 'My list')
  })

  it('my list nav item is visible for guests', () => {
    cy.visitAsGuest('/my-list')
    cy.get('nav').contains('My list').should('be.visible')
  })
})
