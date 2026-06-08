const NOW = Date.now()

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
              vote_average: 8.8,
              vote_count: 35000,
              original_language: 'en',
              watchedAt: NOW,
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
              vote_average: 9.5,
              vote_count: 200000,
              original_language: 'en',
              number_of_episodes: 62,
              watchedAt: NOW,
            },
          },
        },
      },
      version: 0,
    })
  )
}

type MovieEntry = { id: number; title: string; watchedAt: number; collection?: { id: number; name: string }; release_date?: string }

const makeMovieEntry = ({ id, title, watchedAt, collection, release_date = '2010-01-01' }: MovieEntry) => ({
  id, title, poster_path: null, release_date,
  vote_average: 7.5, vote_count: 10000, original_language: 'en',
  ...(collection ? { collection_id: collection.id, collection_name: collection.name } : {}),
  watchedAt,
})

const seedMovies = (win: Window, userId: string, entries: MovieEntry[]) => {
  win.localStorage.setItem(
    'popcorn-watched-v3',
    JSON.stringify({
      state: {
        movies: { [userId]: Object.fromEntries(entries.map((e) => [e.id, makeMovieEntry(e)])) },
        episodes: {},
        seriesData: {},
      },
      version: 0,
    })
  )
}

// Handles login + visit + common localStorage boilerplate.
// The seed callback receives the window and resolved userId.
const loginAndVisitMyList = (seed: (win: Window, userId: string) => void) => {
  cy.login('cypress_guest', 'CypressGuest1!').then((resp) => {
    const { userId, role } = resp.body
    cy.visit('/my-list', {
      onBeforeLoad: (win: Window) => {
        win.localStorage.setItem('popcorn-language', JSON.stringify({ state: { language: 'en', userLanguages: { [userId]: 'en' } }, version: 0 }))
        win.localStorage.setItem('popcorn-user', JSON.stringify({ state: { userId, role }, version: 0 }))
        seed(win, userId)
      },
    })
  })
}

describe('My List', () => {
  // ─── Layout ──────────────────────────────────────────────────────────────

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

  it('shows empty state for series when none are watched', () => {
    cy.visitAsGuest('/my-list')
    cy.contains('button', 'Series').click()
    cy.contains('No series started yet').should('be.visible')
  })

  // ─── Nav visibility ───────────────────────────────────────────────────────

  it('my list nav item is not visible for admins', () => {
    cy.visitAsAdmin('/home')
    cy.get('nav').should('not.contain.text', 'My list')
  })

  it('my list nav item is visible for guests', () => {
    cy.visitAsGuest('/my-list')
    cy.get('[data-cy="nav-my-list"]').should('be.visible')
  })

  // ─── Movies tab ───────────────────────────────────────────────────────────

  it('shows a standalone watched movie', () => {
    loginAndVisitMyList(seedWatched)
    cy.contains('Inception').should('be.visible')
  })

  it('shows Recommendations button disabled when movie has no rating', () => {
    loginAndVisitMyList(seedWatched)
    cy.contains('button', 'Recommendations').should('be.visible').and('be.disabled')
  })

  it('shows Recommendations button enabled after rating ≥ 3.5', () => {
    loginAndVisitMyList(seedWatched)
    // The FiltersPanel star rating is the first [role="slider"]; the movie card's is the second
    cy.get('[role="slider"]').eq(1).find('svg').eq(3).click()
    cy.contains('Recommendations').should('not.be.disabled')
  })

  it('shows saga card with formatted name (no "Collection")', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',                   poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 76600, title: 'Avatar: The Way of Water', poster_path: null, release_date: '2022-12-16', vote_average: 7.6, vote_count: 15000 },
        ],
      },
    }).as('collectionAvatar')
    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                19995: {
                  id: 19995,
                  title: 'Avatar',
                  poster_path: null,
                  release_date: '2009-12-17',
                  vote_average: 7.5,
                  vote_count: 30000,
                  original_language: 'en',
                  collection_id: 131296,
                  collection_name: 'Avatar Collection',
                  watchedAt: NOW,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })
    cy.contains('Avatar - Saga').should('be.visible')
    cy.contains('Avatar Collection').should('not.exist')
  })

  it('shows a collection with only one released part as a standalone card, not a saga group', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar', poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
        ],
      },
    }).as('collection')

    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                19995: {
                  id: 19995, title: 'Avatar', poster_path: null,
                  release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000,
                  original_language: 'en', collection_id: 131296, collection_name: 'Avatar Collection',
                  watchedAt: NOW,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })

    cy.wait('@collection')
    cy.contains('Avatar - Saga').should('not.exist')
    cy.contains('Avatar').should('be.visible')
  })

  // ─── Section ordering ─────────────────────────────────────────────────────

  it('shows standalone movies before sagas when a standalone was added more recently', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',                   poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 76600, title: 'Avatar: The Way of Water', poster_path: null, release_date: '2022-12-16', vote_average: 7.6, vote_count: 15000 },
        ],
      },
    }).as('collectionAvatar')
    const AVATAR = { id: 19995, title: 'Avatar', watchedAt: NOW - 10000, release_date: '2009-12-17', collection: { id: 131296, name: 'Avatar Collection' } }
    const INCEPTION = { id: 1, title: 'Inception', watchedAt: NOW, release_date: '2010-07-16' }
    loginAndVisitMyList((win, userId) => seedMovies(win, userId, [AVATAR, INCEPTION]))
    cy.contains('Inception').should('be.visible')
    cy.contains('Standalone films').then(($standalone) => {
      cy.contains('Avatar - Saga').then(($saga) => {
        expect($standalone[0].getBoundingClientRect().top)
          .to.be.lessThan($saga[0].getBoundingClientRect().top)
      })
    })
  })

  it('shows sagas before standalone movies when a saga was added more recently', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',                   poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 76600, title: 'Avatar: The Way of Water', poster_path: null, release_date: '2022-12-16', vote_average: 7.6, vote_count: 15000 },
        ],
      },
    }).as('collectionAvatar')
    const INCEPTION = { id: 1, title: 'Inception', watchedAt: NOW - 10000, release_date: '2010-07-16' }
    const AVATAR = { id: 19995, title: 'Avatar', watchedAt: NOW, release_date: '2009-12-17', collection: { id: 131296, name: 'Avatar Collection' } }
    loginAndVisitMyList((win, userId) => seedMovies(win, userId, [INCEPTION, AVATAR]))
    cy.contains('Avatar - Saga').then(($saga) => {
      cy.contains('Standalone films').then(($standalone) => {
        expect($saga[0].getBoundingClientRect().top)
          .to.be.lessThan($standalone[0].getBoundingClientRect().top)
      })
    })
  })

  // ─── Series tab ───────────────────────────────────────────────────────────

  it('shows watched series in series tab', () => {
    loginAndVisitMyList(seedWatched)
    cy.contains('button', 'Series').click()
    cy.contains('Breaking Bad').should('be.visible')
  })

  it('shows episode progress badge for series', () => {
    loginAndVisitMyList(seedWatched)
    cy.contains('button', 'Series').click()
    cy.contains('1/62 ep.').should('be.visible')
  })

  it('shows Recommendations button disabled for an incomplete series', () => {
    loginAndVisitMyList(seedWatched)
    cy.contains('button', 'Series').click()
    cy.contains('button', 'Recommendations').should('be.disabled')
  })

  it('enables Recommendations button for a fully watched series rated ≥ 3.5', () => {
    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem('popcorn-ratings-v1', JSON.stringify({
        state: { ratings: { [userId]: { movies: {}, series: { 10: 4 } } } }, version: 0,
      }))
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {},
            episodes: { [userId]: { 10: { 101: { seasonNumber: 1 } } } },
            seriesData: {
              [userId]: {
                10: {
                  id: 10, name: 'Breaking Bad', poster_path: '/bb.jpg',
                  first_air_date: '2008-01-20', number_of_episodes: 1,
                  vote_average: 9.5, vote_count: 100000,
                  original_language: 'en', watchedAt: NOW,
                },
              },
            },
          },
          version: 0,
        })
      )
    })
    cy.contains('button', 'Series').click()
    cy.contains('button', 'Recommendations').should('not.be.disabled')
  })

  // ─── Saga Recommendations button ──────────────────────────────────────────

  it('shows one Recommendations button per saga, not one per movie within it', () => {
    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                1: {
                  id: 1, title: 'Movie One', poster_path: null,
                  release_date: '2009-01-01', vote_average: 7, vote_count: 1000,
                  original_language: 'en', collection_id: 10, collection_name: 'Test Collection',
                  watchedAt: NOW,
                },
                2: {
                  id: 2, title: 'Movie Two', poster_path: null,
                  release_date: '2012-01-01', vote_average: 7, vote_count: 1000,
                  original_language: 'en', collection_id: 10, collection_name: 'Test Collection',
                  watchedAt: NOW - 1000,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })
    cy.get('button').filter(':contains("Recommendations")').should('have.length', 1)
  })

  // ─── Recommendations drawer ───────────────────────────────────────────────

  describe('recommendations drawer — standalone movie with rating', () => {
    beforeEach(() => {
      loginAndVisitMyList((win, userId) => {
        win.localStorage.setItem('popcorn-ratings-v1', JSON.stringify({
          state: { ratings: { [userId]: { movies: { 1: 4 }, series: {} } } }, version: 0,
        }))
        seedWatched(win, userId)
      })
    })

    it('opens when clicking an enabled Recommendations button', () => {
      cy.contains('button', 'Recommendations').should('not.be.disabled').click()
      cy.get('[data-cy="recommendations-drawer"]').should('be.visible')
    })

    it('shows the movie title in the header for a standalone movie', () => {
      cy.contains('button', 'Recommendations').should('not.be.disabled').click()
      cy.get('[data-cy="recommendations-drawer"]').contains('Inception').should('be.visible')
    })

    it('closes when clicking the X button', () => {
      cy.contains('button', 'Recommendations').should('not.be.disabled').click()
      cy.get('[data-cy="recommendations-drawer"]').should('be.visible')
      cy.get('[data-cy="drawer-close"]').click()
      cy.get('[data-cy="recommendations-drawer"]').should('not.exist')
    })
  })

  // ─── Unwatched movie placeholders ────────────────────────────────────────────

  it('shows placeholder slots for unwatched movies in a saga', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',                    poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 76600, title: 'Avatar: The Way of Water',  poster_path: null, release_date: '2022-12-16', vote_average: 7.6, vote_count: 15000 },
          { id: 83533, title: 'Avatar: Fire and Ash',      poster_path: null, release_date: '2025-12-19', vote_average: 0,   vote_count: 0     },
        ],
      },
    }).as('collection')

    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                19995: {
                  id: 19995, title: 'Avatar', poster_path: null,
                  release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000,
                  original_language: 'en', collection_id: 131296, collection_name: 'Avatar Collection',
                  watchedAt: NOW,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })

    cy.wait('@collection')
    cy.contains('Avatar: The Way of Water').should('be.visible')
    cy.contains('Avatar: Fire and Ash').should('be.visible')
  })

  it('shows placeholder for a collection part with a future release date', () => {
    const FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',        poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 99999, title: 'Avatar Future', poster_path: null, release_date: FUTURE,        vote_average: 0,   vote_count: 0     },
        ],
      },
    }).as('collection')

    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                19995: {
                  id: 19995, title: 'Avatar', poster_path: null,
                  release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000,
                  original_language: 'en', collection_id: 131296, collection_name: 'Avatar Collection',
                  watchedAt: NOW,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })

    cy.wait('@collection')
    cy.contains('Avatar Future').should('exist')
  })

  it('opens movie detail modal when clicking an unwatched movie placeholder', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',                   poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 76600, title: 'Avatar: The Way of Water', poster_path: null, release_date: '2022-12-16', vote_average: 7.6, vote_count: 15000 },
        ],
      },
    }).as('collection')

    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                19995: {
                  id: 19995, title: 'Avatar', poster_path: null,
                  release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000,
                  original_language: 'en', collection_id: 131296, collection_name: 'Avatar Collection',
                  watchedAt: NOW,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })

    cy.wait('@collection')
    cy.contains('Avatar: The Way of Water').click()
    cy.get('[role="dialog"]').should('be.visible')
  })

  it('shows the saga name in the drawer header when triggered from a saga', () => {
    cy.intercept('GET', '**/collection/131296**', {
      body: {
        id: 131296,
        name: 'Avatar Collection',
        parts: [
          { id: 19995, title: 'Avatar',                   poster_path: null, release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000 },
          { id: 76600, title: 'Avatar: The Way of Water', poster_path: null, release_date: '2022-12-16', vote_average: 7.6, vote_count: 15000 },
        ],
      },
    }).as('collectionAvatar')
    loginAndVisitMyList((win, userId) => {
      win.localStorage.setItem('popcorn-ratings-v1', JSON.stringify({
        state: { ratings: { [userId]: { movies: { 19995: 4 }, series: {} } } }, version: 0,
      }))
      win.localStorage.setItem(
        'popcorn-watched-v3',
        JSON.stringify({
          state: {
            movies: {
              [userId]: {
                19995: {
                  id: 19995, title: 'Avatar', poster_path: null,
                  release_date: '2009-12-17', vote_average: 7.5, vote_count: 30000,
                  original_language: 'en', collection_id: 131296, collection_name: 'Avatar Collection',
                  watchedAt: NOW,
                },
              },
            },
            episodes: {},
            seriesData: {},
          },
          version: 0,
        })
      )
    })
    cy.wait('@collectionAvatar')
    // Wait for the saga card to finish rendering with collection data (placeholder visible = saga mode active)
    cy.contains('Avatar: The Way of Water').should('exist')
    cy.contains('button', 'Recommendations').should('not.be.disabled').click({ force: true })
    cy.get('[data-cy="recommendations-drawer"]').contains('Avatar - Saga').should('be.visible')
  })

  // ─── Por ver (watchlist) tab ──────────────────────────────────────────────

  const seedWatchlist = (win: Window, userId: string) => {
    win.localStorage.setItem(
      'popcorn-watchlist-v1',
      JSON.stringify({
        state: {
          movies: {
            [userId]: {
              550: {
                id: 550,
                title: 'Fight Club',
                release_date: '1999-10-15',
                poster_path: null,
                vote_average: 8.4,
                vote_count: 26000,
                original_language: 'en',
                addedAt: Date.now(),
              },
            },
          },
          series: {
            [userId]: {
              1396: {
                id: 1396,
                name: 'Breaking Bad',
                first_air_date: '2008-01-20',
                poster_path: null,
                vote_average: 9.5,
                vote_count: 200000,
                original_language: 'en',
                addedAt: Date.now(),
              },
            },
          },
        },
        version: 0,
      })
    )
  }

  it('shows the Por ver tab', () => {
    cy.visitAsGuest('/my-list')
    cy.contains('button', 'To watch').should('be.visible')
  })

  it('shows empty state when watchlist is empty', () => {
    cy.visitAsGuest('/my-list')
    cy.contains('button', 'To watch').click()
    cy.contains('No movies in your watchlist yet').should('be.visible')
    cy.contains('No series in your watchlist yet').should('be.visible')
  })

  it('shows watchlisted movie in Por ver tab', () => {
    loginAndVisitMyList((win, userId) => seedWatchlist(win, userId))
    cy.contains('button', 'To watch').click()
    cy.contains('Fight Club').should('be.visible')
  })

  it('shows watchlisted series in Por ver tab', () => {
    loginAndVisitMyList((win, userId) => seedWatchlist(win, userId))
    cy.contains('button', 'To watch').click()
    cy.contains('Breaking Bad').should('be.visible')
  })

  it('shows count badge on Por ver tab', () => {
    loginAndVisitMyList((win, userId) => seedWatchlist(win, userId))
    cy.contains('button', 'To watch').within(() => {
      cy.contains('2').should('be.visible')
    })
  })

  it('removes movie from Por ver when the heart button is clicked', () => {
    loginAndVisitMyList((win, userId) => seedWatchlist(win, userId))
    cy.contains('button', 'To watch').click()
    cy.contains('Fight Club').should('be.visible')
    cy.get('[data-cy="watchlist-remove"]').first().click()
    cy.contains('Fight Club').should('not.exist')
  })

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('Accessibility', () => {
    it('has no axe violations on the empty state', () => {
      cy.visitAsGuest('/my-list')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations on the movies tab with content and filters', () => {
      loginAndVisitMyList(seedWatched)
      cy.contains('Inception').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations on the series tab with content and filters', () => {
      loginAndVisitMyList(seedWatched)
      cy.contains('button', 'Series').click()
      cy.contains('Breaking Bad').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations on the watchlist tab with content', () => {
      loginAndVisitMyList((win, userId) => seedWatchlist(win, userId))
      cy.contains('button', 'To watch').click()
      cy.contains('Fight Club').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations with the recommendations drawer open', () => {
      loginAndVisitMyList((win, userId) => {
        win.localStorage.setItem('popcorn-ratings-v1', JSON.stringify({
          state: { ratings: { [userId]: { movies: { 1: 4 }, series: {} } } }, version: 0,
        }))
        seedWatched(win, userId)
      })
      cy.contains('button', 'Recommendations').should('not.be.disabled').click()
      cy.get('[data-cy="recommendations-drawer"]').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })
  })
})
