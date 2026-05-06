const TEMP_USER = { username: 'cy_tempuser', password: 'TempUser1!', role: 'guest' as const }

describe('Users', () => {
  beforeEach(() => {
    // Delete any test users that may have survived a previous failed run
    cy.task('deleteUser', 'cy_tempuser')
    cy.task('deleteUser', 'cy_renamed')
    cy.task('deleteUser', 'cy_bulk_a')
    cy.task('deleteUser', 'cy_bulk_b')
    cy.task('deleteUser', 'cy_other')
    cy.task('deleteUser', 'cy_filter_user')
    cy.task('deleteUser', 'cy_role_test')
    cy.task('deleteUser', 'cy_import_1')
    cy.task('deleteUser', 'cy_import_2')
    cy.visitAsAdmin('/users')
  })

  // ─── Happy path ──────────────────────────────────────────────

  it('shows the current admin in the list', () => {
    cy.contains('cypress_admin').should('be.visible')
  })

  it('creates a user and shows a success toast', () => {
    cy.contains('Add user').click()
    cy.get('#username').type(TEMP_USER.username)
    cy.get('#password').type(TEMP_USER.password)
    cy.get('#role').select('guest')
    cy.contains('button', 'Accept').click()
    cy.get('[role="alert"]').should('contain', 'User created')
    cy.contains(TEMP_USER.username).should('be.visible')
    cy.task('deleteUser', TEMP_USER.username)
  })

  it('edits a user and shows a success toast', () => {
    cy.task('seedUser', TEMP_USER)
    cy.reload()
    cy.contains('tr', TEMP_USER.username).within(() => {
      cy.get('[data-cy="edit-user-btn"]').click()
    })
    cy.get('#username').clear().type('cy_renamed')
    cy.contains('button', 'Accept').click()
    cy.get('[role="alert"]').should('contain', 'User updated')
    cy.task('deleteUser', 'cy_renamed')
  })

  it('deletes a user with confirmation and shows a success toast', () => {
    cy.task('seedUser', TEMP_USER)
    cy.reload()
    cy.contains('tr', TEMP_USER.username).within(() => {
      cy.get('[data-cy="delete-user-btn"]').click()
    })
    cy.get('[role="dialog"]').contains('button', 'Delete').click()
    cy.get('[role="alert"]').should('contain', 'User deleted')
    cy.contains(TEMP_USER.username).should('not.exist')
  })

  it('bulk-deletes users and shows a count in the toast', () => {
    const userA = { username: 'cy_bulk_a', password: 'BulkA123!', role: 'guest' as const }
    const userB = { username: 'cy_bulk_b', password: 'BulkB123!', role: 'guest' as const }
    cy.task('seedUser', userA)
    cy.task('seedUser', userB)
    cy.reload()

    cy.contains('tr', userA.username).within(() => cy.get('input[type="checkbox"]').check())
    cy.contains('tr', userB.username).within(() => cy.get('input[type="checkbox"]').check())
    cy.contains('Delete selected').click()
    cy.get('[role="dialog"]').contains('button', 'Delete').click()
    cy.get('[role="alert"]').should('contain', '2 users deleted')
  })

  // ─── Self-protection ─────────────────────────────────────────

  it('does not show a delete button on the admin\'s own row', () => {
    cy.contains('tr', 'cypress_admin').within(() => {
      cy.get('[data-cy="delete-user-btn"]').should('not.exist')
    })
  })

  // ─── Filters ─────────────────────────────────────────────────

  it('filters users by username', () => {
    cy.task('seedUser', { username: 'cy_filter_user', password: 'FilterUser1!', role: 'guest' as const })
    cy.reload()
    cy.get('[data-cy="filter-username"]').type('cy_filter')
    cy.contains('tr', 'cy_filter_user').should('be.visible')
    cy.contains('tr', 'cypress_admin').should('not.exist')
    cy.task('deleteUser', 'cy_filter_user')
  })

  it('filters users by role', () => {
    cy.task('seedUser', { username: 'cy_role_test', password: 'RoleTest1!', role: 'guest' as const })
    cy.reload()
    cy.get('[data-cy="filter-role"]').select('admin')
    cy.contains('tr', 'cypress_admin').should('be.visible')
    cy.contains('tr', 'cy_role_test').should('not.exist')
    cy.get('[data-cy="filter-role"]').select('guest')
    cy.contains('tr', 'cy_role_test').should('be.visible')
    cy.contains('tr', 'cypress_admin').should('not.exist')
    cy.task('deleteUser', 'cy_role_test')
  })

  // ─── Error cases ─────────────────────────────────────────────

  it('shows an inline error in the form when creating a user with a taken username', () => {
    cy.task('seedUser', TEMP_USER)
    cy.reload()
    cy.contains('Add user').click()
    cy.get('#username').type(TEMP_USER.username)
    cy.get('#password').type('AnotherPass1!')
    cy.get('#role').select('guest')
    cy.contains('button', 'Accept').click()
    cy.get('[role="dialog"]').should('contain', 'Username already taken')
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="alert"]').should('not.exist')
    cy.task('deleteUser', TEMP_USER.username)
  })

  it('keeps the form open with the username value after a failed create', () => {
    cy.task('seedUser', TEMP_USER)
    cy.reload()
    cy.contains('Add user').click()
    cy.get('#username').type(TEMP_USER.username)
    cy.get('#password').type('AnotherPass1!')
    cy.contains('button', 'Accept').click()
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('#username').should('have.value', TEMP_USER.username)
    cy.task('deleteUser', TEMP_USER.username)
  })

  it('shows an inline error in the form when editing a user to a taken username', () => {
    const otherUser = { username: 'cy_other', password: 'OtherUser1!', role: 'guest' as const }
    cy.task('seedUser', TEMP_USER)
    cy.task('seedUser', otherUser)
    cy.reload()
    cy.contains('tr', otherUser.username).within(() => {
      cy.get('[data-cy="edit-user-btn"]').click()
    })
    cy.get('#username').clear().type(TEMP_USER.username)
    cy.contains('button', 'Accept').click()
    cy.get('[role="dialog"]').should('contain', 'Username already taken')
    cy.get('[role="dialog"]').should('be.visible')
    cy.get('[role="alert"]').should('not.exist')
    cy.task('deleteUser', TEMP_USER.username)
    cy.task('deleteUser', otherUser.username)
  })

  // ─── Import ───────────────────────────────────────────────────

  it('shows error when Import is clicked without selecting a file', () => {
    cy.contains('Import').click()
    cy.get('[role="dialog"]').contains('button', 'Import').click()
    cy.get('[role="dialog"]').should('contain', 'Please select a file before importing')
  })

  it('imports users from a JSON file and shows the created count', () => {
    const json = JSON.stringify([
      { username: 'cy_import_1', password: 'Import1User!', role: 'guest' },
      { username: 'cy_import_2', password: 'Import2User!', role: 'guest' },
    ])
    cy.contains('Import').click()
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from(json), fileName: 'users.json', mimeType: 'application/json' },
      { force: true }
    )
    cy.get('[role="dialog"]').contains('button', 'Import').click()
    cy.get('[role="dialog"]').should('contain', '2 users created successfully')
    cy.contains('button', 'Accept').click()
    cy.contains('cy_import_1').should('be.visible')
    cy.contains('cy_import_2').should('be.visible')
  })

  it('imports users from a CSV file and shows the created count', () => {
    const csv = 'username,password,role\ncy_import_1,Import1User!,guest\ncy_import_2,Import2User!,guest'
    cy.contains('Import').click()
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from(csv), fileName: 'users.csv', mimeType: 'text/csv' },
      { force: true }
    )
    cy.get('[role="dialog"]').contains('button', 'Import').click()
    cy.get('[role="dialog"]').should('contain', '2 users created successfully')
    cy.contains('button', 'Accept').click()
    cy.contains('cy_import_1').should('be.visible')
  })

  it('shows failed rows when a username is already taken', () => {
    cy.task('seedUser', { username: 'cy_import_1', password: 'Import1User!', role: 'guest' as const })
    cy.reload()
    const json = JSON.stringify([
      { username: 'cy_import_1', password: 'Import1User!', role: 'guest' },
      { username: 'cy_import_2', password: 'Import2User!', role: 'guest' },
    ])
    cy.contains('Import').click()
    cy.get('input[type="file"]').selectFile(
      { contents: Cypress.Buffer.from(json), fileName: 'users.json', mimeType: 'application/json' },
      { force: true }
    )
    cy.get('[role="dialog"]').contains('button', 'Import').click()
    cy.get('[role="dialog"]').should('contain', '1 users created successfully')
    cy.get('[role="dialog"]').should('contain', '1 rows failed')
    cy.get('[role="dialog"]').should('contain', 'cy_import_1')
    cy.get('[role="dialog"]').contains('button', 'Download failed rows').should('be.visible')
  })
})
