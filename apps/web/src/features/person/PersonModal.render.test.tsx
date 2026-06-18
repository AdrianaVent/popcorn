import React from 'react'
import { render, screen } from '@testing-library/react'
import PersonModal from './PersonModal'
import { usePersonDetail } from './hooks/usePersonDetail'
import { usePersonCredits } from './hooks/usePersonCredits'
import type { TMDBPerson, TMDBPersonCombinedCredit } from '@/types/tmdb'

jest.mock('./hooks/usePersonDetail')
jest.mock('./hooks/usePersonCredits')

jest.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: { userId: string }) => unknown) =>
    selector({ userId: 'u1' }),
}))

jest.mock('@/store/watchedStore', () => ({
  useWatchedStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ movies: {}, seriesData: {} }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'es' }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

jest.mock('@/utils/formatDate', () => ({
  formatShortDate: (date: string) => date,
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const map: Record<string, string> = {
        'character.self':        'Él/Ella mismo/a',
        'character.voice':       'Voz',
        'job.director':          'Director',
        'job.executiveProducer': 'Productor ejecutivo',
        'person.movies':         'Películas',
        'person.series':         'Series',
        'person.filmography':    'Filmografía',
        'person.noCredits':      'Sin créditos disponibles',
        'person.yearsOld':       'años',
        'modal.close':           'Cerrar',
        'person.department.acting': 'Actuación',
      }
      return map[key] ?? opts?.defaultValue ?? key
    },
  }),
}))

const mockUsePersonDetail = usePersonDetail as jest.MockedFunction<typeof usePersonDetail>
const mockUsePersonCredits = usePersonCredits as jest.MockedFunction<typeof usePersonCredits>

const makePerson = (overrides: Partial<TMDBPerson> = {}): TMDBPerson => ({
  id: 1,
  name: 'Tom Hanks',
  profile_path: null,
  biography: '',
  birthday: '1956-07-09',
  deathday: null,
  place_of_birth: 'Concord, California',
  also_known_as: [],
  known_for_department: 'Acting',
  ...overrides,
})

const makeCredit = (overrides: Partial<TMDBPersonCombinedCredit>): TMDBPersonCombinedCredit => ({
  id: 1,
  media_type: 'movie',
  poster_path: null,
  vote_average: 7,
  vote_count: 500,
  genre_ids: [],
  original_language: 'en',
  release_date: '2020-01-01',
  title: 'A Film',
  ...overrides,
})

function setup(person: TMDBPerson, cast: TMDBPersonCombinedCredit[] = [], crew: TMDBPersonCombinedCredit[] = []) {
  mockUsePersonDetail.mockReturnValue({ person, loading: false, error: null })
  mockUsePersonCredits.mockReturnValue({ cast, crew, loading: false })
  render(<PersonModal personId={1} onClose={jest.fn()} />)
}

describe('PersonModal — person info', () => {
  it('renders the person name', () => {
    setup(makePerson())
    expect(document.body).toHaveTextContent('Tom Hanks')
  })

  it('renders birthday', () => {
    setup(makePerson({ birthday: '1956-07-09' }))
    expect(document.body).toHaveTextContent('1956-07-09')
  })

  it('renders deathday when present', () => {
    setup(makePerson({ birthday: '1926-06-01', deathday: '1962-08-04' }))
    expect(document.body).toHaveTextContent('1962-08-04')
  })

  it('renders age suffix', () => {
    setup(makePerson())
    expect(document.body).toHaveTextContent('años')
  })

  it('renders alias when different from name', () => {
    setup(makePerson({ also_known_as: ['Thomas Jeffrey Hanks'] }))
    expect(document.body).toHaveTextContent('Thomas Jeffrey Hanks')
  })

  it('omits alias when it matches the person name', () => {
    setup(makePerson({ also_known_as: ['Tom Hanks', 'Thomas Jeffrey Hanks'] }))
    // filtered alias list shows only 'Thomas Jeffrey Hanks', not combined with 'Tom Hanks'
    expect(screen.queryByText('Tom Hanks · Thomas Jeffrey Hanks')).not.toBeInTheDocument()
    expect(document.body).toHaveTextContent('Thomas Jeffrey Hanks')
  })

  it('shows no more than 2 aliases', () => {
    setup(makePerson({ also_known_as: ['Alias One', 'Alias Two', 'Alias Three'] }))
    expect(screen.getByText('Alias One · Alias Two')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Alias Three')
  })
})

describe('PersonModal — credit role translation', () => {
  it('translates cast character "Himself" using translateCharacter', () => {
    const credit = makeCredit({ id: 10, character: 'Himself' })
    setup(makePerson(), [credit], [])
    expect(screen.getByText('Él/Ella mismo/a')).toBeInTheDocument()
  })

  it('translates crew job "Executive Producer" using translateJob', () => {
    const credit = makeCredit({ id: 20, character: undefined, job: 'Executive Producer' })
    setup(makePerson(), [], [credit])
    expect(screen.getByText('Productor ejecutivo')).toBeInTheDocument()
  })

  it('leaves unknown crew job untranslated', () => {
    const credit = makeCredit({ id: 30, character: undefined, job: 'Location Manager' })
    setup(makePerson(), [], [credit])
    expect(screen.getByText('Location Manager')).toBeInTheDocument()
  })

  it('does not apply translateJob to cast credits named "Director"', () => {
    const credit = makeCredit({ id: 40, character: 'The Director' })
    setup(makePerson(), [credit], [])
    expect(screen.getByText('The Director')).toBeInTheDocument()
  })
})
