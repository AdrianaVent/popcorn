const AXE_OPTIONS = { runOnly: ['wcag2a', 'wcag2aa'] }

// ── Admin ────────────────────────────────────────────────────────────────────

describe('Profile modal — admin', () => {
  beforeEach(() => {
    cy.visitAsAdmin('/home')
  })

  // ── sidebar button ──────────────────────────────────────────────────────────

  it('profile button is visible in the sidebar', () => {
    cy.get('[data-cy="profile-button"]').should('be.visible')
  })

  it('profile button has an accessible aria-label', () => {
    cy.get('[data-cy="profile-button"]').should('have.attr', 'aria-label').and('not.be.empty')
  })

  // ── open / close ────────────────────────────────────────────────────────────

  it('clicking profile button opens the modal', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[role="dialog"]').should('be.visible')
  })

  it('modal can be closed via the × button', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[role="dialog"]').within(() => {
      cy.get('button[aria-label="Close"]').click()
    })
    cy.get('[role="dialog"]').should('not.exist')
  })

  // ── avatar section hidden for admin ─────────────────────────────────────────

  it('avatar edit button is not visible for admin', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[data-cy="avatar-edit-btn"]').should('not.exist')
  })

  // ── password section ─────────────────────────────────────────────────────────

  it('password section is visible with correct landmark', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('section[aria-label="Password"]').should('exist')
  })

  it('password inputs start as type=password', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').should('have.attr', 'type', 'password')
    cy.get('[id="pw-new"]').should('have.attr', 'type', 'password')
    cy.get('[id="pw-confirm"]').should('have.attr', 'type', 'password')
  })

  it('eye button toggles visibility for current password', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').should('have.attr', 'type', 'password')
    cy.get('[aria-label="Show password"]').first().click()
    cy.get('[id="pw-current"]').should('have.attr', 'type', 'text')
    cy.get('[id="pw-new"]').should('have.attr', 'type', 'password')
  })

  it('shows validation errors when submitting empty password form', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.contains('button', 'Save password').click()
    cy.contains('Enter your current password').should('be.visible')
    cy.contains('Enter a new password').should('be.visible')
  })

  it('shows WRONG_PASSWORD error inline on current password field', () => {
    cy.intercept('PATCH', '/api/profile', { statusCode: 400, body: { code: 'WRONG_PASSWORD' } }).as('wrongPw')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').type('WrongPass1!')
    cy.get('[id="pw-new"]').type('NewPass1!')
    cy.get('[id="pw-confirm"]').type('NewPass1!')
    cy.contains('button', 'Save password').click()
    cy.wait('@wrongPw')
    cy.contains('Incorrect current password').should('be.visible')
  })

  it('shows success banner on successful password change', () => {
    cy.intercept('PATCH', '/api/profile', { code: 'PASSWORD_CHANGED' }).as('changePw')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').type('OldPass1!')
    cy.get('[id="pw-new"]').type('NewPass1!')
    cy.get('[id="pw-confirm"]').type('NewPass1!')
    cy.contains('button', 'Save password').click()
    cy.wait('@changePw')
    cy.get('[role="alert"]').should('contain', 'Password updated')
  })

  it('shows error banner on failed password change (server error)', () => {
    cy.intercept('PATCH', '/api/profile', { statusCode: 500, body: { code: 'SERVER_ERROR' } }).as('pwError')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').type('OldPass1!')
    cy.get('[id="pw-new"]').type('NewPass1!')
    cy.get('[id="pw-confirm"]').type('NewPass1!')
    cy.contains('button', 'Save password').click()
    cy.wait('@pwError')
    cy.get('[role="alert"]').should('contain', 'Could not change password')
  })

  it('clears password fields after successful change', () => {
    cy.intercept('PATCH', '/api/profile', { code: 'PASSWORD_CHANGED' }).as('changePwClear')
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[id="pw-current"]').type('OldPass1!')
    cy.get('[id="pw-new"]').type('NewPass1!')
    cy.get('[id="pw-confirm"]').type('NewPass1!')
    cy.contains('button', 'Save password').click()
    cy.wait('@changePwClear')
    cy.get('[id="pw-current"]').should('have.value', '')
    cy.get('[id="pw-new"]').should('have.value', '')
    cy.get('[id="pw-confirm"]').should('have.value', '')
  })

  // ── greeting in sidebar ──────────────────────────────────────────────────────

  it('sidebar shows username greeting when expanded', () => {
    cy.get('[data-cy="profile-button"]').contains('cypress_admin').should('be.visible')
  })

  // ── accessibility ────────────────────────────────────────────────────────────

  it('has no axe violations with profile modal open (admin)', () => {
    cy.get('[data-cy="profile-button"]').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.injectAxe()
    cy.checkA11y('[role="dialog"]', AXE_OPTIONS)
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
