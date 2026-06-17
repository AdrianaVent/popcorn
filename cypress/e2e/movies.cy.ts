const FIGHT_CLUB_DETAIL = {
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

  // ─── Genre multi-select filter ───────────────────────────────

  it('opens the genre dropdown and shows genre chips', () => {
    cy.wait('@tmdb')
    cy.get('[data-cy="filter-genre_ids"]').click()
    cy.contains('Drama').should('be.visible')
    cy.contains('Action & Adventure').should('be.visible')
  })

  it('selecting a genre sends with_genres to TMDB', () => {
    cy.intercept('GET', /\/discover\/movie.*with_genres=18/, { fixture: 'movies.json' }).as('genreFiltered')

    cy.wait('@tmdb')
    cy.get('[data-cy="filter-genre_ids"]').click()
    cy.contains('Drama').click()
    cy.wait('@genreFiltered')
  })

  it('selecting multiple genres sends combined with_genres', () => {
    cy.intercept('GET', /\/discover\/movie.*with_genres=/, { fixture: 'movies.json' }).as('genreFiltered')

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
    cy.get('[data-cy="clear-filters"]').should('be.visible').click()
    cy.get('[data-cy="filter-title"]').should('have.value', '')
    cy.get('[data-cy="clear-filters"]').should('not.be.visible')
  })

  // ─── Access control ───────────────────────────────────────────

  it('does not show the Export button for guest users', () => {
    cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
    cy.visitAsGuest('/movies')
    cy.wait('@tmdb-guest')
    cy.contains('Export').should('not.exist')
  })

  // ─── Watched ribbon on poster ─────────────────────────────────

  describe('Watched ribbon on poster', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

    it('is never shown for admin users', () => {
      cy.wait('@tmdb')
      cy.get('[data-cy="watched-ribbon"]').should('not.exist')
    })

    it('is not shown for guest users on unwatched movies', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')
      cy.contains('tr', 'Fight Club').find('[data-cy="watched-ribbon"]').should('not.exist')
    })

    it('appears on the poster after marking a movie as watched from the modal', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.get('body').type('{esc}')
      cy.contains('tr', 'Fight Club').find('[data-cy="watched-ribbon"]').should('exist')
    })

    it('ribbon disappears after unmarking from the modal', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').contains('Mark as watched').click()
      cy.get('[role="dialog"]').contains('Watched').click()
      cy.get('body').type('{esc}')
      cy.contains('tr', 'Fight Club').find('[data-cy="watched-ribbon"]').should('not.exist')
    })
  })

  // ─── Watched — admin ──────────────────────────────────────────

  describe('Watched controls (admin)', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

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
    const mockDetail = FIGHT_CLUB_DETAIL

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

  // ─── Watchlist heart button ───────────────────────────────────

  describe('Watchlist heart button in detail modal', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

    const openFightClubModal = () => {
      // Specific intercepts must be registered after the general one to take precedence
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] })
      cy.wait('@tmdb-watchlist')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
    }

    describe('as guest', () => {
      beforeEach(() => {
        cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-watchlist')
        cy.visitAsGuest('/movies')
      })

      it('shows the heart button', () => {
        openFightClubModal()
        cy.get('[data-cy="watchlist-toggle"]').should('be.visible')
      })

      it('gains active style after clicking', () => {
        openFightClubModal()
        cy.get('[data-cy="watchlist-toggle"]').click()
        cy.get('[data-cy="watchlist-toggle"]').should('have.class', 'border-primary')
      })
    })

    describe('as admin', () => {
      beforeEach(() => {
        cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
        cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} })
        cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] })
      })

      it('does not show the heart button', () => {
        cy.wait('@tmdb')
        cy.contains('tr', 'Fight Club').click()
        cy.wait('@detail')
        cy.get('[data-cy="watchlist-toggle"]').should('not.exist')
      })
    })
  })

  // ─── Watch providers ──────────────────────────────────────────

  describe('Watch providers in detail modal', () => {
    const recentDate = new Date(Date.now() - 20 * 86_400_000).toISOString()

    const mockDetail = FIGHT_CLUB_DETAIL

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

  // ─── Genre deduplication ──────────────────────────────────────

  describe('Genre deduplication in detail modal', () => {
    it('shows merged genres only once when multiple IDs resolve to the same name', () => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, {
        id: 550,
        title: 'Fight Club',
        release_date: '1999-10-15',
        vote_average: 8.4,
        vote_count: 26000,
        runtime: 139,
        overview: 'A depressed man forms an underground fight club.',
        // Action (28) + Adventure (12) both resolve to 'Action & Adventure'
        genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }],
        original_language: 'en',
        poster_path: null,
        belongs_to_collection: null,
      }).as('detail')

      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').within(() => {
        cy.contains('Action & Adventure').should('have.length', 1)
        cy.contains('Drama').should('be.visible')
      })
    })
  })

  // ─── Trailer ──────────────────────────────────────────────────

  // ─── Column sort ─────────────────────────────────────────────

  describe('Column sort', () => {
    it('sends sort_by=vote_average.asc when the rating header is clicked', () => {
      cy.intercept('GET', /\/discover\/movie.*sort_by=vote_average\.asc/, { fixture: 'movies.json' }).as('sorted-asc')
      cy.wait('@tmdb')
      cy.contains('th', 'Rating').click()
      cy.wait('@sorted-asc')
    })

    it('sends sort_by=vote_average.desc on second click', () => {
      cy.intercept('GET', /\/discover\/movie.*sort_by=vote_average\.asc/, { fixture: 'movies.json' }).as('sorted-asc')
      cy.intercept('GET', /\/discover\/movie.*sort_by=vote_average\.desc/, { fixture: 'movies.json' }).as('sorted-desc')
      cy.wait('@tmdb')
      cy.contains('th', 'Rating').click()
      cy.wait('@sorted-asc')
      cy.contains('th', 'Rating').click()
      cy.wait('@sorted-desc')
    })
  })

  // ─── Runtime filter ───────────────────────────────────────────

  describe('Runtime filter', () => {
    it('sends with_runtime.gte=120 when 2h is entered', () => {
      cy.intercept('GET', /\/discover\/movie.*with_runtime\.gte=120/, { fixture: 'movies.json' }).as('runtime-filtered')
      cy.wait('@tmdb')
      cy.get('[data-cy="filter-runtime_gte"] input[type="number"]').type('2')
      cy.wait('@runtime-filtered')
    })

    it('sends with_runtime.gte=90 when 90min is entered', () => {
      cy.intercept('GET', /\/discover\/movie.*with_runtime\.gte=90/, { fixture: 'movies.json' }).as('runtime-filtered')
      cy.wait('@tmdb')
      cy.get('[data-cy="filter-runtime_gte"] select').select('min')
      cy.get('[data-cy="filter-runtime_gte"] input[type="number"]').type('90')
      cy.wait('@runtime-filtered')
    })
  })

  // ─── Accessibility ────────────────────────────────────────────

  describe('Accessibility', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

    it('has no axe violations on the movies list (admin)', () => {
      cy.wait('@tmdb')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations on the movies list (guest)', () => {
      cy.intercept('GET', 'https://api.themoviedb.org/3/**', { fixture: 'movies.json' }).as('tmdb-guest')
      cy.visitAsGuest('/movies')
      cy.wait('@tmdb-guest')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations with the detail modal open', () => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] })
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.get('[role="dialog"]').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })

    it('has no axe violations with filters panel open', () => {
      cy.wait('@tmdb')
      cy.get('[data-cy="filter-genre_ids"]').click()
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })
  })

  describe('Trailer', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

    const mockVideos = {
      results: [{ id: 'v1', key: 'testTrailerKey', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true, iso_639_1: 'en' }],
    }

    beforeEach(() => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} }).as('providers')
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] }).as('releaseDates')
      cy.intercept('GET', /\/movie\/550\/videos/, mockVideos).as('videos')
    })

    it('shows the trailer button when a YouTube trailer is available', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').should('be.visible')
    })

    it('shows the trailer iframe when the trailer button is clicked', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('have.attr', 'src').and('include', 'testTrailerKey')
    })

    it('hides the trailer iframe when the trailer button is clicked again', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('exist')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('not.exist')
    })

    it('hides the trailer iframe when the X button inside the player is clicked', () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@videos')
      cy.get('[data-cy="trailer-button"]').click()
      cy.get('[role="dialog"] iframe').should('exist')
      cy.get('[role="dialog"] iframe').siblings('button').click()
      cy.get('[role="dialog"] iframe').should('not.exist')
    })

    it('does not show the trailer button when no trailer is available', () => {
      cy.intercept('GET', /\/movie\/550\/videos/, { results: [] }).as('noVideos')
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@noVideos')
      cy.get('[data-cy="trailer-button"]').should('not.exist')
    })
  })

  // ─── Cast section ─────────────────────────────────────────────

  describe('Cast section in detail modal', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

    const mockCredits = {
      cast: [
        { id: 1, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: null, order: 0 },
        { id: 2, name: 'Edward Norton', character: 'The Narrator', profile_path: null, order: 1 },
      ],
      crew: [
        { id: 10, name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: null },
      ],
    }

    const mockCreditsLarge = {
      cast: Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        name: `Actor ${i + 1}`,
        character: `Character ${i + 1}`,
        profile_path: null,
        order: i,
      })),
      crew: [
        { id: 10, name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: null },
      ],
    }

    beforeEach(() => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] })
    })

    it('shows the cast section title', () => {
      cy.intercept('GET', /\/movie\/550\/credits/, mockCredits).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').contains('Cast').should('be.visible')
    })

    it('shows director name', () => {
      cy.intercept('GET', /\/movie\/550\/credits/, mockCredits).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').contains('David Fincher').should('be.visible')
    })

    it('shows actor name and character', () => {
      cy.intercept('GET', /\/movie\/550\/credits/, mockCredits).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').contains('Brad Pitt').should('be.visible')
      cy.get('[role="dialog"]').contains('Tyler Durden').should('be.visible')
    })

    it('shows expand button when cast exceeds 8 and expands on click', () => {
      cy.intercept('GET', /\/movie\/550\/credits/, mockCreditsLarge).as('credits')
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@credits')
      cy.get('[role="dialog"]').within(() => {
        cy.get('[role="list"] [role="listitem"]').should('have.length', 8)
        cy.get('[aria-label*="more"]').click()
        cy.get('[role="list"] [role="listitem"]').should('have.length', 12)
      })
    })
  })

  // ─── Person modal ─────────────────────────────────────────────

  describe('Person modal', () => {
    const mockDetail = FIGHT_CLUB_DETAIL

    const mockCredits = {
      cast: [
        { id: 1, name: 'Brad Pitt', character: 'Tyler Durden', profile_path: null, order: 0 },
      ],
      crew: [
        { id: 10, name: 'David Fincher', job: 'Director', department: 'Directing', profile_path: null },
      ],
    }

    const mockPerson = {
      id: 1,
      name: 'Brad Pitt',
      profile_path: null,
      biography: '',
      birthday: '1963-12-18',
      place_of_birth: 'Shawnee, Oklahoma',
      known_for_department: 'Acting',
    }

    const mockPersonCredits = {
      cast: [
        { id: 550, media_type: 'movie', title: 'Fight Club', vote_count: 26000, vote_average: 8.4, poster_path: null, release_date: '1999-10-15', character: 'Tyler Durden', genre_ids: [], original_language: 'en' },
        { id: 100, media_type: 'tv', name: 'Some Series', vote_count: 500, vote_average: 7.5, poster_path: null, first_air_date: '2022-01-01', character: 'Himself', genre_ids: [], original_language: 'en' },
      ],
      crew: [],
    }

    const mockPersonCreditsWithInvalid = {
      cast: [
        { id: 550, media_type: 'movie', title: 'Fight Club', vote_count: 26000, vote_average: 8.4, poster_path: null, release_date: '1999-10-15', character: 'Tyler Durden', genre_ids: [], original_language: 'en' },
        { id: 999, media_type: 'tv', name: 'The Tonight Show', vote_count: 0, vote_average: 0, poster_path: null, first_air_date: '2014-01-01', character: 'Self', genre_ids: [], original_language: 'en' },
      ],
      crew: [],
    }

    beforeEach(() => {
      cy.intercept('GET', /\/movie\/550(\?|$)/, mockDetail).as('detail')
      cy.intercept('GET', /\/movie\/550\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/movie\/550\/release_dates/, { results: [] })
      cy.intercept('GET', /\/movie\/550\/credits/, mockCredits).as('credits')
    })

    const openMovieModal = () => {
      cy.wait('@tmdb')
      cy.contains('tr', 'Fight Club').click()
      cy.wait('@detail')
      cy.wait('@credits')
    }

    it('clicking an actor card opens the person modal', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCredits).as('personCredits')
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@person')
      cy.get('[role="dialog"]').last().contains('Brad Pitt').should('be.visible')
    })

    it('person modal shows known_for_department', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCredits).as('personCredits')
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@person')
      cy.get('[role="dialog"]').last().contains('Acting').should('be.visible')
    })

    it('person modal shows Movies and Series tabs', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCredits).as('personCredits')
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@personCredits')
      cy.get('[role="dialog"]').last().within(() => {
        cy.get('[role="tab"]').contains('Movies').should('be.visible')
        cy.get('[role="tab"]').contains('Series').should('be.visible')
      })
    })

    it('credits with vote_count=0 are not shown', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCreditsWithInvalid).as('personCredits')
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@personCredits')
      cy.get('[role="dialog"]').last().within(() => {
        cy.get('[role="tab"]').contains('Series').click()
        cy.contains('The Tonight Show').should('not.exist')
      })
    })

    it('clicking a movie credit in person modal navigates to that movie', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCredits).as('personCredits')
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@personCredits')
      cy.get('[role="dialog"]').last().contains('Fight Club').click()
      cy.get('[role="dialog"]').should('have.length', 1)
      cy.get('[role="dialog"]').contains('Fight Club').should('be.visible')
    })

    it('clicking a TV credit in person modal opens a series detail modal', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCredits).as('personCredits')
      cy.intercept('GET', /\/tv\/100(\?|$)/, {
        id: 100, name: 'Some Series', first_air_date: '2022-01-01', vote_average: 7.5, vote_count: 500,
        poster_path: null, original_language: 'en', overview: '', tagline: '', status: 'Ended',
        number_of_seasons: 1, number_of_episodes: 10, episode_run_time: [45],
        seasons: [], genres: [], created_by: [],
      }).as('seriesDetail')
      cy.intercept('GET', /\/tv\/100\/credits/, { cast: [], crew: [] })
      cy.intercept('GET', /\/tv\/100\/watch\/providers/, { results: {} })
      cy.intercept('GET', /\/tv\/100\/videos/, { results: [] })
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@personCredits')
      cy.get('[role="dialog"]').last().within(() => {
        cy.get('[role="tab"]').contains('Series').click()
        cy.contains('Some Series').click()
      })
      cy.wait('@seriesDetail')
      cy.get('[role="dialog"]').last().contains('Some Series').should('be.visible')
    })

    it('clicking the director name opens the person modal', () => {
      const mockDirectorPerson = { ...mockPerson, id: 10, name: 'David Fincher', known_for_department: 'Directing' }
      cy.intercept('GET', /\/person\/10(\?|$)/, mockDirectorPerson).as('directorPerson')
      cy.intercept('GET', /\/person\/10\/combined_credits/, { cast: [], crew: [] }).as('directorCredits')
      openMovieModal()
      cy.get('[role="dialog"]').contains('David Fincher').click()
      cy.wait('@directorPerson')
      cy.get('[role="dialog"]').last().contains('David Fincher').should('be.visible')
    })

    it('has no axe violations with person modal open', () => {
      cy.intercept('GET', /\/person\/1(\?|$)/, mockPerson).as('person')
      cy.intercept('GET', /\/person\/1\/combined_credits/, mockPersonCredits).as('personCredits')
      openMovieModal()
      cy.get('[role="dialog"] button[aria-label="Brad Pitt"]').click()
      cy.wait('@person')
      cy.wait('@personCredits')
      cy.get('[role="dialog"]').last().contains('Brad Pitt').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
    })
  })
})
