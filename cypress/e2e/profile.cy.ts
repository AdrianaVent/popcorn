const AXE_OPTIONS = { runOnly: ['wcag2a', 'wcag2aa'] }

// ── Admin ────────────────────────────────────────────────────────────────────

describe('Profile modal — admin', () => {
  beforeEach(() => {
    cy.visitAsAdmin('/home')
  })

  it('profile button is not visible in the sidebar for admin', () => {
    cy.get('[data-cy="profile-button"]').should('not.exist')
  })

  it('sidebar does not show a username greeting for admin', () => {
    cy.get('[data-cy="profile-button"]').should('not.exist')
    cy.contains('cypress_admin').should('not.exist')
  })
})

// ── Guest — avatar editing ───────────────────────────────────────────────────

describe('Profile modal — avatar editing (guest)', () => {
  beforeEach(() => {
    cy.visitAsGuest('/home')
  })

  it('pencil button starts with aria-pressed=false', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').should('have.attr', 'aria-pressed', 'false')
  })

  it('clicking pencil expands avatar customization options', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy="avatar-save-btn"]').should('be.visible')
  })

  it('clicking pencil again collapses customization and resets changes', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[data-cy="avatar-save-btn"]').should('exist')
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[data-cy="avatar-save-btn"]').should('not.exist')
  })

  it('color groups are labeled correctly when editing', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[role="group"][aria-label="Skin tone"]').should('exist')
    cy.get('[role="group"][aria-label="Hair color"]').should('exist')
    cy.get('[role="group"][aria-label="Hair style"]').should('exist')
    cy.get('[role="group"][aria-label="Shirt color"]').should('exist')
    cy.get('[role="group"][aria-label="Glasses"]').should('exist')
    cy.get('[role="group"][aria-label="Expression"]').should('exist')
  })

  it('saving avatar calls PATCH /api/profile and closes editing', () => {
    cy.intercept('PATCH', '/api/profile', { code: 'PROFILE_UPDATED' }).as('saveAvatar')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[data-cy="avatar-save-btn"]').click()
    cy.wait('@saveAvatar').its('request.body').should('have.property', 'avatar')
    cy.get('[data-cy="avatar-save-btn"]').should('not.exist')
  })

  it('shows error alert on failed avatar save', () => {
    cy.intercept('PATCH', '/api/profile', { statusCode: 500, body: { code: 'SERVER_ERROR' } }).as('saveAvatarFail')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[data-cy="avatar-save-btn"]').click()
    cy.wait('@saveAvatarFail')
    cy.get('[role="alert"]').should('be.visible')
    cy.get('[role="alert"]').should('not.contain', 'Avatar updated')
  })

  // ── password change ──────────────────────────────────────────────────────────

  it('shows password change fields in the profile modal', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[role="dialog"]').within(() => {
      cy.get('[id="pw-current"]').should('exist')
      cy.get('[id="pw-new"]').should('exist')
      cy.get('[id="pw-confirm"]').should('exist')
    })
  })

  it('shows WRONG_PASSWORD error inline when current password is incorrect', () => {
    cy.intercept('PATCH', '/api/profile', { statusCode: 400, body: { code: 'WRONG_PASSWORD' } }).as('wrongPw')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').type('WrongPass1!')
    cy.get('[id="pw-new"]').type('NewPass1!')
    cy.get('[id="pw-confirm"]').type('NewPass1!')
    cy.contains('button', 'Save password').click()
    cy.wait('@wrongPw')
    cy.contains('Incorrect current password').should('be.visible')
  })

  it('shows success banner and clears fields after successful password change', () => {
    cy.intercept('PATCH', '/api/profile', { statusCode: 200, body: { code: 'PASSWORD_CHANGED' } }).as('changePw')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').type('OldPass1!')
    cy.get('[id="pw-new"]').type('NewPass1!')
    cy.get('[id="pw-confirm"]').type('NewPass1!')
    cy.contains('button', 'Save password').click()
    cy.wait('@changePw')
    cy.get('[role="alert"]').should('be.visible')
    cy.get('[id="pw-current"]').should('have.value', '')
    cy.get('[id="pw-new"]').should('have.value', '')
    cy.get('[id="pw-confirm"]').should('have.value', '')
  })

  // ── accessibility ────────────────────────────────────────────────────────────

  it('has no axe violations with profile modal open (guest, collapsed)', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.injectAxe()
    cy.checkA11y('[role="dialog"]', AXE_OPTIONS)
  })

  it('has no axe violations with avatar editor expanded (guest)', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').click()
    cy.get('[data-cy="avatar-save-btn"]').should('be.visible')
    cy.injectAxe()
    cy.checkA11y('[role="dialog"]', AXE_OPTIONS)
  })
})
