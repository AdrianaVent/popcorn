const BREAKING_BAD_DETAIL = {
  id: 1396,
  name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  vote_average: 9.5,
  vote_count: 12000,
  overview: 'A chemistry teacher turns to manufacturing meth.',
  genres: [{ id: 18, name: 'Drama' }],
  original_language: 'en',
  poster_path: null,
  number_of_seasons: 5,
  number_of_episodes: 62,
  episode_run_time: [47],
  status: 'Ended',
  seasons: [],
}

const BREAKING_BAD_WITH_SEASON = {
  ...BREAKING_BAD_DETAIL,
  poster_path: '/poster.jpg',
  number_of_seasons: 1,
  number_of_episodes: 2,
  tagline: '',
  seasons: [
    { id: 3739, name: 'Season 1', season_number: 1, episode_count: 2, poster_path: null, air_date: '2008-01-20' },
  ],
}

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
    const mockDetail = BREAKING_BAD_DETAIL

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

  // ─── Watched ribbon on poster ─────────────────────────────────

  describe('Watched ribbon on poster', () => {
    const mockDetail = BREAKING_BAD_WITH_SEASON

    const mockSeason = {
      episodes: [
        { id: 62085, name: 'Pilot', episode_number: 1, runtime: 58, air_date: '2008-01-20' },
        { id: 62086, name: 'Cat\'s in the Bag', episode_number: 2, runtime: 48, air_date: '2008-01-27' },
      ],
    }

    it('is never shown for admin users', () => {
      cy.wait('@tmdb')
      cy.get('[data-cy="watched-ribbon"]').should('not.exist')
    })

    it('is not shown for guest users on unwatched series', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb-guest')
      cy.visitAsGuest('/series')
      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Breaking Bad').find('[data-cy="watched-ribbon"]').should('not.exist')
    })

    it('appears on the poster after marking all episodes as watched', () => {
      // Register specific intercepts BEFORE visiting so enrichment uses mockDetail
      // (totals.get(1396) = 2 required for the ribbon condition: total > 0 && watched >= total)
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb-guest')
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeason).as('season')
      cy.visitAsGuest('/series')
      cy.wait('@tmdb-guest')
      cy.wait('@detail') // enrichment call — populates totals with number_of_episodes: 2
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail') // modal open call
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.get('body').type('{esc}')
      cy.contains('tr', 'Breaking Bad').find('[data-cy="watched-ribbon"]').should('exist')
    })
  })

  // ─── Watched — admin ──────────────────────────────────────────

  describe('Watched controls (admin)', () => {
    const mockDetailWithSeason = BREAKING_BAD_WITH_SEASON

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

    it('does not show the Mark as watched button in the detail modal', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')

      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').should('not.exist')
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
    const mockDetailWithSeason = BREAKING_BAD_WITH_SEASON

    const mockSeason = {
      episodes: [
        { id: 62085, name: 'Pilot', episode_number: 1, runtime: 58, air_date: '2008-01-20' },
        { id: 62086, name: 'Cat\'s in the Bag', episode_number: 2, runtime: 48, air_date: '2008-01-27' },
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

    it('clicking Mark as watched marks all aired episodes and toggles button to Watched', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeason).as('season')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.wait('@season')
      cy.get('[role="dialog"]').contains('Watched').should('be.visible')
      cy.get('[role="dialog"]').contains('Mark as watched').should('not.exist')
    })

    it('clicking Watched a second time unmarks all episodes', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeason).as('season')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.wait('@season')
      cy.get('[role="dialog"]').contains('Watched').click()
      cy.wait('@season')
      cy.get('[role="dialog"]').contains('Mark as watched').should('be.visible')
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

    it('does not show the watched button for an episode with no runtime', () => {
      const mockSeasonMissingRuntime = {
        episodes: [
          { id: 62085, name: 'Pilot', episode_number: 1, runtime: 58, air_date: '2008-01-20' },
          { id: 62086, name: 'Cat\'s in the Bag', episode_number: 2, runtime: null, air_date: '2008-01-27' },
        ],
      }

      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeasonMissingRuntime).as('season')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Breaking Bad').click()
      cy.get('[role="dialog"]').contains('button', 'Seasons').click()
      cy.get('[role="dialog"]').contains('Season 1').click()
      cy.wait('@season')

      cy.get('[role="dialog"]').contains('Pilot').should('be.visible')
      cy.get('[role="dialog"]').contains('Cat\'s in the Bag').should('be.visible')
      // Only the episode with a runtime gets a watched button
      cy.get('[role="dialog"]').find('[data-cy="episode-watched-btn"]').should('have.length', 1)
    })

    it('episode watched button toggles watched state on click', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetailWithSeason).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/season\/1/, mockSeason).as('season')

      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Breaking Bad').click()
      cy.get('[role="dialog"]').contains('button', 'Seasons').click()
      cy.get('[role="dialog"]').contains('Season 1').click()
      cy.wait('@season')

      cy.get('[role="dialog"]').find('[data-cy="episode-watched-btn"]').first().as('epBtn')
      cy.get('@epBtn').should('not.have.class', 'text-primary')
      cy.get('@epBtn').click()
      cy.get('@epBtn').should('have.class', 'text-primary')
      // Second click unmarks
      cy.get('@epBtn').click()
      cy.get('@epBtn').should('not.have.class', 'text-primary')
    })
  })

  // ─── Genre multi-select filter ───────────────────────────────

  it('opens the genre dropdown and shows genre chips', () => {
    cy.wait('@tmdb')
    cy.get('[data-cy="filter-genre_ids"]').click()
    cy.contains('Drama').should('be.visible')
    cy.contains('Action & Adventure').should('be.visible')
  })

  it('selecting a genre sends with_genres to TMDB', () => {
    cy.intercept('GET', /\/discover\/tv.*with_genres=18/, { fixture: 'series.json' }).as('genreFiltered')

    cy.wait('@tmdb')
    cy.get('[data-cy="filter-genre_ids"]').click()
    cy.contains('Drama').click()
    cy.wait('@genreFiltered')
  })

  it('selecting multiple genres sends combined with_genres', () => {
    cy.intercept('GET', /\/discover\/tv.*with_genres=/, { fixture: 'series.json' }).as('genreFiltered')

    cy.wait('@tmdb')
    cy.get('[data-cy="filter-genre_ids"]').click()
    cy.contains('Drama').click()
    cy.contains('Comedy').click()
    cy.wait('@genreFiltered')
    cy.get('@genreFiltered.all').then((calls) => {
      const last = calls[calls.length - 1] as { request: { url: string } }
      expect(last.request.url).to.match(/with_genres=/)
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

  // ─── Column sort ─────────────────────────────────────────────

  describe('Column sort', () => {
    it('sends sort_by=vote_average.asc when the rating header is clicked', () => {
      cy.intercept('GET', /\/discover\/tv.*sort_by=vote_average\.asc/, { fixture: 'series.json' }).as('sorted-asc')
      cy.wait('@tmdb')
      cy.contains('th', 'Rating').click()
      cy.wait('@sorted-asc')
    })

    it('sends sort_by=vote_average.desc on second click', () => {
      cy.intercept('GET', /\/discover\/tv.*sort_by=vote_average\.asc/, { fixture: 'series.json' }).as('sorted-asc')
      cy.intercept('GET', /\/discover\/tv.*sort_by=vote_average\.desc/, { fixture: 'series.json' }).as('sorted-desc')
      cy.wait('@tmdb')
      cy.contains('th', 'Rating').click()
      cy.wait('@sorted-asc')
      cy.contains('th', 'Rating').click()
      cy.wait('@sorted-desc')
    })
  })

  // ─── Runtime filter (client-side) ────────────────────────────

  describe('Runtime filter', () => {
    // BB: 47min × 62ep = 2914min. GoT: 57min × 73ep = 4161min.
    // Filter at 60h (3600min) → BB filtered out, GoT remains.
    const detailBB = {
      id: 1396, name: 'Breaking Bad', original_name: 'Breaking Bad',
      first_air_date: '2008-01-20', vote_average: 9.5, vote_count: 12000,
      poster_path: null, original_language: 'en', overview: '',
      episode_run_time: [47], number_of_episodes: 62, number_of_seasons: 5,
      seasons: [{ id: 1, name: 'Season 1', season_number: 1, episode_count: 62, poster_path: null, air_date: '2008-01-20', overview: '' }],
      status: 'Ended', genres: [], tagline: '',
    }
    const detailGoT = {
      id: 1399, name: 'Game of Thrones', original_name: 'Game of Thrones',
      first_air_date: '2011-04-17', vote_average: 8.4, vote_count: 22000,
      poster_path: null, original_language: 'en', overview: '',
      episode_run_time: [57], number_of_episodes: 73, number_of_seasons: 8,
      seasons: [{ id: 2, name: 'Season 1', season_number: 1, episode_count: 73, poster_path: null, air_date: '2011-04-17', overview: '' }],
      status: 'Ended', genres: [], tagline: '',
    }

    beforeEach(() => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb-rt')
      cy.intercept('GET', /\/tv\/1396(\?|$)/, detailBB).as('detail-bb')
      cy.intercept('GET', /\/tv\/1399(\?|$)/, detailGoT).as('detail-got')
      cy.visitAsAdmin('/series')
    })

    it('filters out series below the total runtime threshold', () => {
      cy.wait('@tmdb-rt')
      cy.wait('@detail-bb')
      cy.wait('@detail-got')
      cy.contains('tr', 'Breaking Bad').should('be.visible')
      cy.contains('tr', 'Game of Thrones').should('be.visible')
      cy.get('[data-cy="filter-runtime_gte"] input[type="number"]').type('60')
      cy.contains('tr', 'Breaking Bad').should('not.exist')
      cy.contains('tr', 'Game of Thrones').should('be.visible')
    })

    it('does not send with_runtime.gte to TMDB', () => {
      const spy = cy.spy().as('runtimeReq')
      cy.intercept('GET', /with_runtime\.gte/, spy)
      cy.wait('@tmdb-rt')
      cy.wait('@detail-bb')
      cy.wait('@detail-got')
      cy.get('[data-cy="filter-runtime_gte"] input[type="number"]').type('60')
      cy.get('@runtimeReq').should('not.have.been.called')
    })
  })

  // ─── Genre deduplication ──────────────────────────────────────

  describe('Genre deduplication in detail modal', () => {
    it('shows merged genres only once when multiple IDs resolve to the same name', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, {
        id: 1396,
        name: 'Breaking Bad',
        first_air_date: '2008-01-20',
        vote_average: 9.5,
        vote_count: 12000,
        overview: 'A chemistry teacher turns to manufacturing meth.',
        // Action & Adventure (10759) + its movie equivalent (28) both resolve to the same name
        genres: [{ id: 10759, name: 'Action & Adventure' }, { id: 28, name: 'Action' }, { id: 18, name: 'Drama' }],
        original_language: 'en',
        poster_path: null,
        number_of_seasons: 5,
        number_of_episodes: 62,
        episode_run_time: [47],
        status: 'Ended',
        seasons: [],
      }).as('detail')

      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Action & Adventure').should('have.length', 1)
        cy.contains('Drama').should('be.visible')
      })
    })
  })

  // ─── Trailer ──────────────────────────────────────────────────

  describe('Trailer', () => {
    const mockDetail = BREAKING_BAD_DETAIL

    const mockVideos = {
      results: [
        { id: 'v1', key: 'testSeriesKey', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en' },
        { id: 'v2', key: 'testS1Key', name: 'Season 1 Official Trailer', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en' },
      ],
    }

    beforeEach(() => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/tv\/1396\/videos/, mockVideos).as('videos')
    })

    it('shows the trailer button when a YouTube trailer is available', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').should('be.visible')
    })

    it('shows the trailer iframe when the trailer button is clicked', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('have.attr', 'src').and('include', 'testSeriesKey')
    })

    it('hides the trailer iframe when the trailer button is clicked again', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('exist')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('not.exist')
    })

    it('hides the trailer iframe when the X button inside the player is clicked', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('exist')
      cy.get('[role="dialog"] iframe').siblings('button').click()
      cy.get('[role="dialog"] iframe').should('not.exist')
    })

    it('does not show the trailer button when no trailer is available', () => {
      cy.intercept('GET', /\/tv\/1396\/videos/, { results: [] }).as('noVideos')
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@noVideos')
      cy.get('[data-cy="trailer-button"]').should('not.exist')
    })
  })

  // ─── Watchlist heart button ────────────────────────────────────

  describe('Watchlist heart button in detail modal', () => {
    const mockDetail = BREAKING_BAD_DETAIL

    const openBreakingBadModal = () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/tv\/1396\/videos/, { results: [] })
      cy.wait('@tmdb-watchlist')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
    }

    describe('as guest', () => {
      beforeEach(() => {
        cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb-watchlist')
        cy.visitAsGuest('/series')
      })

      it('shows the heart button for a guest user', () => {
        openBreakingBadModal()
        cy.get('[data-cy="watchlist-toggle"]').should('be.visible')
      })

      it('gains active style after clicking the heart button', () => {
        openBreakingBadModal()
        cy.get('[data-cy="watchlist-toggle"]').click()
        cy.get('[data-cy="watchlist-toggle"]').should('have.class', 'border-primary')
      })
    })

    describe('as admin', () => {
      beforeEach(() => {
        cy.intercept('GET', /\/tv\/1396(\?|$)/, mockDetail).as('detail')
        cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} })
        cy.intercept('GET', /\/tv\/1396\/videos/, { results: [] })
      })

      it('does not show the heart button for an admin user', () => {
        cy.wait('@tmdb')
        cy.contains('tr', 'Breaking Bad').click()
        cy.wait('@detail')
        cy.get('[data-cy="watchlist-toggle"]').should('not.exist')
      })
    })
  })

  // ─── Accessibility ────────────────────────────────────────────

  describe('Accessibility', () => {
    it('has no axe violations on the series list (admin)', () => {
      cy.wait('@tmdb')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations on the series list (guest)', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'series.json' }).as('tmdb-a11y')
      cy.visitAsGuest('/series')
      cy.wait('@tmdb-a11y')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations with detail modal open', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, BREAKING_BAD_DETAIL).as('detail-a11y')
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/tv\/1396\/videos/, { results: [] })
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail-a11y')
      cy.get('[role="dialog"]').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations with genre filter dropdown open', () => {
      cy.wait('@tmdb')
      cy.get('[data-cy="filter-genre_ids"]').click()
      cy.contains('Drama').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })
  })

  // ─── Cast section ─────────────────────────────────────────────

  describe('Cast section in detail modal', () => {
    const mockCredits = {
      cast: [
        { id: 1, name: 'Bryan Cranston', character: 'Walter White', profile_path: null, order: 0 },
        { id: 2, name: 'Aaron Paul', character: 'Jesse Pinkman', profile_path: null, order: 1 },
      ],
      crew: [],
    }

    const mockCreditsLarge = {
      cast: Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `Actor ${i + 1}`,
        character: `Character ${i + 1}`,
        profile_path: null,
        order: i,
      })),
      crew: [],
    }

    const detailWithCreator = {
      ...BREAKING_BAD_DETAIL,
      created_by: [{ id: 99, name: 'Vince Gilligan', profile_path: null }],
      tagline: '',
    }

    beforeEach(() => {
      cy.intercept('GET', /\/tv\/1396\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/tv\/1396\/videos/, { results: [] })
    })

    it('shows the cast section title', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, BREAKING_BAD_DETAIL).as('detail')
      cy.intercept('GET', /\/tv\/1396\/credits/, mockCredits).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').contains('Cast').should('be.visible')
    })

    it('shows creator name', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, detailWithCreator).as('detail')
      cy.intercept('GET', /\/tv\/1396\/credits/, mockCredits).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').contains('Vince Gilligan').should('be.visible')
    })

    it('shows actor name and character', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, BREAKING_BAD_DETAIL).as('detail')
      cy.intercept('GET', /\/tv\/1396\/credits/, mockCredits).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').contains('Bryan Cranston').should('be.visible')
      cy.get('[role="dialog"]').contains('Walter White').should('be.visible')
    })

    it('shows expand button when cast exceeds 8 and expands on click', () => {
      cy.intercept('GET', /\/tv\/1396(\?|$)/, BREAKING_BAD_DETAIL).as('detail')
      cy.intercept('GET', /\/tv\/1396\/credits/, mockCreditsLarge).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Breaking Bad').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').within(() => {
        cy.get('[role="list"] [role="listitem"]').should('have.length', 8)
        cy.get('[aria-label*="more"]').click()
        cy.get('[role="list"] [role="listitem"]').should('have.length', 12)
      })
    })
  })
})
