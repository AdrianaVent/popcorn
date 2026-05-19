describe('Movies', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb')
    cy.visitAsAdmin('/movies')
  })

  it('displays the movies list', () => {
    cy.wait('@tmdb')
    cy.contains('Fight Club').should('be.visible')
    cy.contains('The Shawshank Redemption').should('be.visible')
  })

  it('shows a movie detail modal on row click', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/movie/550*', {
      id: 550,
      title: 'Fight Club',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 26000,
      runtime: 139,
      overview: 'A depressed man forms an underground fight club.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      belongs_to_collection: null,
    }).as('detail')

    cy.wait('@tmdb')
    cy.contains('tr', 'Fight Club').click()
    cy.wait('@detail')
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"]').contains('Fight Club')
  })

  // ─── Platform filter ──────────────────────────────────────────

  it('filters movies by platform', () => {
    cy.intercept('GET', /\/watch\/providers\/movie/, {
      results: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/logo.png', display_priority: 1 },
      ],
    }).as('providerOptions')

    cy.intercept('GET', /\/discover\/movie.*with_watch_providers=8/, { fixture: 'movies.json' }).as('filtered')

    cy.wait('@tmdb')
    cy.wait('@providerOptions')
    cy.get('[data-cy="filter-provider_id"]').select('8')
    cy.wait('@filtered')
    cy.contains('Fight Club').should('be.visible')
  })

  // ─── Rating filter ───────────────────────────────────────────

  it('filters movies by minimum rating', () => {
    cy.intercept('GET', /\/discover\/movie.*vote_average\.gte=8/, { fixture: 'movies.json' }).as('filtered')

    cy.wait('@tmdb')
    cy.get('[data-cy="filter-vote_average_gte"]').find('svg').eq(3).click('right')
    cy.wait('@filtered')
    cy.contains('Fight Club').should('be.visible')
  })

  // ─── Clear filters ────────────────────────────────────────────

  it('clear filters button resets active filters', () => {
    cy.wait('@tmdb')
    cy.get('[data-cy="filter-title"]').type('inception')
    cy.contains('button', 'Clear filters').should('be.visible').click()
    cy.get('[data-cy="filter-title"]').should('have.value', '')
    cy.contains('button', 'Clear filters').should('not.exist')
  })

  // ─── Access control ───────────────────────────────────────────

  it('does not show the Export button for guest users', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
    cy.visitAsGuest('/movies')
    cy.wait('@tmdb-guest')
    cy.contains('Export').should('not.exist')
  })

  // ─── Eye icon column ─────────────────────────────────────────

  describe('Eye icon watched column', () => {
    it('is not visible for admin users', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').find('[data-cy="movie-watched-btn"]').should('not.exist')
    })

    it('is visible for guest users', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Fight Club').find('[data-cy="movie-watched-btn"]').should('exist')
    })

    it('marks a movie as watched on click and updates button style', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')

      cy.contains('tr', 'Fight Club').find('[data-cy="movie-watched-btn"]').as('btn')
      cy.get('@btn').should('not.have.class', 'text-primary')
      cy.get('@btn').click()
      cy.get('@btn').should('have.class', 'text-primary')
    })

    it('unmarks a movie on second click', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')

      cy.contains('tr', 'Fight Club').find('[data-cy="movie-watched-btn"]').as('btn')
      cy.get('@btn').click()
      cy.get('@btn').should('have.class', 'text-primary')
      cy.get('@btn').click()
      cy.get('@btn').should('not.have.class', 'text-primary')
    })
  })

  // ─── Watched — admin ──────────────────────────────────────────

  describe('Watched controls (admin)', () => {
    const mockDetail = {
      id: 550,
      title: 'Fight Club',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 26000,
      runtime: 139,
      overview: 'A depressed man forms an underground fight club.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/poster.jpg',
      belongs_to_collection: null,
      status: 'Released',
      tagline: '',
    }

    it('does not show the Watched filter', () => {
      cy.wait('@tmdb')
      cy.get('[data-cy="filter-watched"]').should('not.exist')
    })

    it('does not show the Mark as watched button in the detail modal', () => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')

      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').should('not.exist')
    })
  })

  // ─── Watched — guest ──────────────────────────────────────────

  describe('Watched controls (guest)', () => {
    const mockDetail = {
      id: 550,
      title: 'Fight Club',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 26000,
      runtime: 139,
      overview: 'A depressed man forms an underground fight club.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/poster.jpg',
      belongs_to_collection: null,
      status: 'Released',
      tagline: '',
    }

    beforeEach(() => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
    })

    it('shows the Watched filter', () => {
      cy.wait('@tmdb-guest')
      cy.get('[data-cy="filter-watched"]').should('exist')
    })

    it('shows the Mark as watched button in the detail modal', () => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').should('be.visible')
    })

    it('clicking Mark as watched toggles the button to Watched', () => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.get('[role="dialog"]').contains('Watched').should('be.visible')
      cy.get('[role="dialog"]').contains('Mark as watched').should('not.exist')
    })

    it('clicking Watched a second time unmarks the movie', () => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.get('[role="dialog"]').contains('Watched').click()
      cy.get('[role="dialog"]').contains('Mark as watched').should('be.visible')
    })
  })

  // ─── Watch providers ──────────────────────────────────────────

  describe('Watch providers in detail modal', () => {
    const recentDate = new Date(Date.now() - 20 * 86_400_000).toISOString()

    const mockDetail = {
      id: 550,
      title: 'Fight Club',
      release_date: '1999-10-15',
      vote_average: 8.4,
      vote_count: 26000,
      runtime: 139,
      overview: 'A depressed man forms an underground fight club.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/poster.jpg',
      belongs_to_collection: null,
      status: 'Released',
      tagline: '',
    }

    const mockProviders = {
      results: {
        ES: {
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/logo.png', display_priority: 1 },
          ],
          rent: [
            { provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.png', display_priority: 2 },
          ],
        },
      },
    }

    const openModal = () => {
      // Regex intercepts override the catch-all for these specific endpoints
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, mockProviders).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, {
        results: [{ iso_3166_1: 'ES', release_dates: [{ release_date: recentDate, type: 3 }] }],
      }).as('releaseDates')
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')

      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
    }

    it('shows the watch providers section', () => {
      openModal()
      cy.wait('@providers')
      cy.get('[role="dialog"]').contains('Available on').should('be.visible')
    })

    it('renders provider logos with tooltip text', () => {
      openModal()
      cy.wait('@providers')
      cy.get('[role="dialog"]').find('img[alt="Netflix"]').should('exist')
      cy.get('[role="dialog"]').contains('Netflix').should('exist')
    })

    it('shows the In theaters chip for a recent theatrical release', () => {
      openModal()
      cy.wait('@releaseDates')
      cy.get('[role="dialog"]').contains('In theaters').should('be.visible')
    })

    it('does not show In theaters when there is no type 3 release', () => {
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, mockProviders).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, {
        results: [{ iso_3166_1: 'ES', release_dates: [{ release_date: recentDate, type: 4 }] }],
      }).as('releaseDatesDigital')
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')

      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@releaseDatesDigital')
      cy.get('[role="dialog"]').contains('In theaters').should('not.exist')
    })
  })
})
