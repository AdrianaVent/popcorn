describe('Settings', () => {
  beforeEach(() => {
    cy.visitAsAdmin('/movies')
    cy.contains('Settings').click()
    cy.get('[role="dialog"]').should('be.visible')
  })

  it('switches to dark theme', () => {
    cy.get('[role="dialog"]').contains('button', 'Dark').click()
    cy.get('[data-theme="dark"]').should('exist')
  })

  it('switches to light theme', () => {
    cy.get('[role="dialog"]').contains('button', 'Light').click()
    cy.get('[data-theme="light"]').should('exist')
  })

  it('switches language to Spanish and back', () => {
    cy.get('[role="dialog"]').contains('button', 'Español').click()
    cy.contains('Películas').should('be.visible')

    cy.contains('button', 'English').click()
    cy.contains('Movies').should('be.visible')
  })
})
