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

  it('logs in with valid credentials and lands on /home', () => {
    cy.visitWithEnglish('/login')
    cy.get('#email').type('cypress_admin')
    cy.get('#password').type('CypressAdmin1!')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/home')
  })

  it('logs out and redirects to /login', () => {
    cy.visitAsAdmin('/movies')
    cy.get('[data-cy="logout-button"]').click()
    cy.url().should('include', '/login')
  })

  // ─── Access control ───────────────────────────────────────────

  it('redirects guest users from /users to /movies', () => {
    cy.login('cypress_guest', 'CypressGuest1!')
    cy.visit('/users')
    cy.url().should('include', '/movies')
  })

  // ─── Session expiry ───────────────────────────────────────────

  it('redirects to /login when both the token and refresh token have expired', () => {
    // Log in to get valid cookies, then clear them to simulate full session expiry
    cy.visitAsAdmin('/users')
    cy.clearAllCookies()
    // Next navigation — middleware sees no token and redirects to /login
    cy.visit('/users')
    cy.url().should('include', '/login')
  })

  // ─── Accessibility ────────────────────────────────────────────

  it('has no axe violations on the login page', () => {
    cy.visitWithEnglish('/login')
    cy.injectAxe()
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
  })

  it('has no axe violations on the reset password form', () => {
    cy.visitWithEnglish('/login')
    cy.contains('Forgot password?').click()
    cy.injectAxe()
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
  })

  it('has no axe violations with login error visible', () => {
    cy.visitWithEnglish('/login')
    cy.get('#email').type('wronguser')
    cy.get('#password').type('WrongPass1!')
    cy.get('button[type="submit"]').click()
    cy.get('[data-cy="login-error"]').should('be.visible')
    cy.injectAxe()
    cy.checkA11y(undefined, { runOnly: ['wcag2a', 'wcag2aa'] })
  })
})
