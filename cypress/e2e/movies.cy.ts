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

  // ─── Access control ───────────────────────────────────────────

  it('does not show the Export button for guest users', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
    cy.visitAsGuest('/movies')
    cy.wait('@tmdb-guest')
    cy.contains('Export').should('not.exist')
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
