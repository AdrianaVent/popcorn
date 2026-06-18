describe('Settings', () => {
  beforeEach(() => {
    cy.visitAsAdmin('/movies')
    cy.get('[data-cy="nav-settings"]').click()
    cy.get('[role="dialog"]').should('be.visible')
  })

  it('switches to dark theme', () => {
    cy.get('[data-cy="theme-dark"]').click()
    cy.get('[data-theme="dark"]').should('exist')
  })

  it('switches to light theme', () => {
    cy.get('[data-cy="theme-light"]').click()
    cy.get('[data-theme="light"]').should('exist')
  })

  it('switches to auto theme', () => {
    cy.get('[data-cy="theme-auto"]').click()
    cy.get('[data-cy="theme-auto"]').should('have.attr', 'aria-pressed', 'true')
  })

  it('switches to high contrast theme', () => {
    cy.get('[data-cy="theme-high-contrast"]').click()
    cy.get('[data-theme="high-contrast"]').should('exist')
  })

  it('switches language to Spanish and back', () => {
    cy.get('[data-cy="lang-es"]').click()
    cy.contains('Películas').should('be.visible')

    cy.get('[data-cy="lang-en"]').click()
    cy.contains('Movies').should('be.visible')
  })

  it('switches region to US and back', () => {
    cy.get('[data-cy="region-US"]').click()
    cy.get('[data-cy="region-US"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy="region-ES"]').should('have.attr', 'aria-pressed', 'false')

    cy.get('[data-cy="region-ES"]').click()
    cy.get('[data-cy="region-ES"]').should('have.attr', 'aria-pressed', 'true')
  })
})
