describe('Series', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb')
    cy.visitAsAdmin('/series')
  })

  it('displays the series list', () => {
    cy.wait('@tmdb')
    cy.contains('Breaking Bad').should('be.visible')
    cy.contains('Game of Thrones').should('be.visible')
  })

  it('shows a series detail modal on row click', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/tv/1396*', {
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      vote_average: 9.5,
      vote_count: 12000,
      overview: 'A chemistry teacher turns to manufacturing meth.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      number_of_seasons: 5,
      number_of_episodes: 62,
      episode_run_time: [47],
      status: 'Ended',
      seasons: [],
    }).as('detail')

    cy.wait('@tmdb')
    cy.contains('tr', 'Breaking Bad').click()
    cy.wait('@detail')
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="dialog"]').contains('Breaking Bad')
  })

  // ─── Watch providers ──────────────────────────────────────────

  describe('Watch providers in detail modal', () => {
    const mockDetail = {
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      vote_average: 9.5,
      vote_count: 12000,
      overview: 'A chemistry teacher turns to manufacturing meth.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      number_of_seasons: 5,
      number_of_episodes: 62,
      episode_run_time: [47],
      status: 'Ended',
      tagline: '',
      seasons: [],
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
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, mockProviders).as('providers')
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetail).as('detail')

      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
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
  })

  // ─── Watched — admin ──────────────────────────────────────────

  describe('Watched controls (admin)', () => {
    const mockDetailWithSeason = {
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      vote_average: 9.5,
      vote_count: 12000,
      overview: 'A chemistry teacher turns to manufacturing meth.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/poster.jpg',
      number_of_seasons: 1,
      number_of_episodes: 2,
      episode_run_time: [47],
      status: 'Ended',
      tagline: '',
      seasons: [
        { id: 3739, name: 'Season 1', season_number: 1, episode_count: 2, poster_path: null, air_date: '2008-01-20' },
      ],
    }

    const mockSeason = {
      episodes: [
        { id: 62085, name: 'Pilot', episode_number: 1, runtime: 58 },
        { id: 62086, name: 'Cat\'s in the Bag', episode_number: 2, runtime: 48 },
      ],
    }

    it('does not show the Watched filter', () => {
      cy.wait('@tmdb')
      cy.get('[data-cy="filter-watched"]').should('not.exist')
    })

    it('does not show episode watched buttons or season mark button', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeason).as('season')

      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.get('[role="dialog"]').should('contain', 'Breaking Bad')

      // AccordionList is closed by default — open it to render the season items
      cy.get('[role="dialog"]').contains('button', 'Seasons').click()
      cy.get('[role="dialog"]').find('[data-cy="season-watched-btn"]').should('not.exist')

      cy.get('[role="dialog"]').contains('Season 1').click()
      cy.wait('@season')

      cy.get('[role="dialog"]').contains('Pilot').should('be.visible')
      cy.get('[role="dialog"]').find('[data-cy="episode-watched-btn"]').should('not.exist')
    })
  })

  // ─── Watched — guest ──────────────────────────────────────────

  describe('Watched controls (guest)', () => {
    const mockDetailWithSeason = {
      id: 1396,
      name: 'Breaking Bad',
      first_air_date: '2008-01-20',
      vote_average: 9.5,
      vote_count: 12000,
      overview: 'A chemistry teacher turns to manufacturing meth.',
      genres: [{ id: 18, name: 'Drama' }],
      original_language: 'en',
      poster_path: '/poster.jpg',
      number_of_seasons: 1,
      number_of_episodes: 2,
      episode_run_time: [47],
      status: 'Ended',
      tagline: '',
      seasons: [
        { id: 3739, name: 'Season 1', season_number: 1, episode_count: 2, poster_path: null, air_date: '2008-01-20' },
      ],
    }

    const mockSeason = {
      episodes: [
        { id: 62085, name: 'Pilot', episode_number: 1, runtime: 58 },
        { id: 62086, name: 'Cat\'s in the Bag', episode_number: 2, runtime: 48 },
      ],
    }

    beforeEach(() => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb-guest')
      cy.visitAsGuest('/series')
    })

    it('shows the Watched filter', () => {
      cy.wait('@tmdb-guest')
      cy.get('[data-cy="filter-watched"]').should('exist')
    })

    it('shows episode watched buttons and season mark button', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeason).as('season')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Breaking Bad').click()
      cy.get('[role="dialog"]').should('contain', 'Breaking Bad')

      // AccordionList is closed by default — open it to render the season items
      cy.get('[role="dialog"]').contains('button', 'Seasons').click()
      cy.get('[role="dialog"]').find('[data-cy="season-watched-btn"]').should('exist')

      cy.get('[role="dialog"]').contains('Season 1').click()
      cy.wait('@season')

      cy.get('[role="dialog"]').contains('Pilot').should('be.visible')
      cy.get('[role="dialog"]').find('[data-cy="episode-watched-btn"]').should('have.length', 2)
    })
  })

  // ─── Rating filter ───────────────────────────────────────────

  it('filters series by minimum rating', () => {
    cy.intercept('GET', /\/discover\/tv.*vote_average\.gte=8/, { fixture: 'series.json' }).as('filtered')

    cy.wait('@tmdb')
    cy.get('[data-cy="filter-vote_average_gte"]').find('svg').eq(3).click('right')
    cy.wait('@filtered')
    cy.contains('Breaking Bad').should('be.visible')
  })

  // ─── Platform filter ──────────────────────────────────────────

  it('filters series by platform', () => {
    cy.intercept('GET', /\/watch\/providers\/tv/, {
      results: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/logo.png', display_priority: 1 },
      ],
    }).as('providerOptions')

    cy.intercept('GET', /\/discover\/tv.*with_watch_providers=8/, { fixture: 'series.json' }).as('filtered')

    cy.wait('@tmdb')
    cy.wait('@providerOptions')
    cy.get('[data-cy="filter-provider_id"]').select('8')
    cy.wait('@filtered')
    cy.contains('Breaking Bad').should('be.visible')
  })
})
