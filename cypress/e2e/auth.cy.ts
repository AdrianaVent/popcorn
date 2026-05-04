describe('Auth', () => {
  it('redirects unauthenticated users from protected routes to /login', () => {
    cy.visit('/movies')
    cy.url().should('include', '/login')
  })

  it('shows an error on invalid credentials', () => {
    cy.visitWithEnglish('/login')
    cy.get('#email').type('wronguser')
    cy.get('#password').type('WrongPass1!')
    cy.get('button[type="submit"]').click()
    cy.get('[data-cy="login-error"]').should('be.visible')
  })

  it('logs in with valid credentials and lands on /movies', () => {
    cy.visitWithEnglish('/login')
    cy.get('#email').type('cypress_admin')
    cy.get('#password').type('CypressAdmin1!')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/movies')
  })

  it('logs out and redirects to /login', () => {
    cy.visitAsAdmin('/movies')
    cy.contains('Log out').click()
    cy.url().should('include', '/login')
  })

  // ─── Access control ───────────────────────────────────────────

  it('redirects guest users from /users to /movies', () => {
    cy.login('cypress_guest', 'CypressGuest1!')
    cy.visit('/users')
    cy.url().should('include', '/movies')
  })
})
