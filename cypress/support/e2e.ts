import './commands'

const TEST_ADMIN = { username: 'cypress_admin', password: 'CypressAdmin1!', role: 'admin' as const }
const TEST_GUEST = { username: 'cypress_guest', password: 'CypressGuest1!', role: 'guest' as const }

before(() => {
  cy.task('seedUser', TEST_ADMIN)
  cy.task('seedUser', TEST_GUEST)
})

after(() => {
  cy.task('deleteUser', TEST_ADMIN.username)
  cy.task('deleteUser', TEST_GUEST.username)
})
