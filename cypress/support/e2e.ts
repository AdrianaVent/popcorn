import './commands'

// Disable CSS animations and transitions globally so tests don't flake on
// opacity/transform states mid-animation (e.g. animate-fade-in on tab sections).
Cypress.on('window:before:load', (win) => {
  const style = win.document.createElement('style')
  style.textContent = '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }'
  win.document.head.appendChild(style)
})

const TEST_ADMIN = { username: 'cypress_admin', password: 'CypressAdmin1!', role: 'admin' as const }
const TEST_GUEST = { username: 'cypress_guest', password: 'CypressGuest1!', role: 'guest' as const }

before(() => {
  cy.task('deleteUser', TEST_ADMIN.username)
  cy.task('deleteUser', TEST_GUEST.username)
  cy.task('seedUser', TEST_ADMIN)
  cy.task('seedUser', TEST_GUEST)
})

after(() => {
  cy.task('deleteUser', TEST_ADMIN.username)
  cy.task('deleteUser', TEST_GUEST.username)
})
