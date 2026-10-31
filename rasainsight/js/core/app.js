/**
 * RasaInsight — Application Entry Point
 * Boots the application, registers routes, initializes services.
 */

const App = (() => {

  function registerRoutes() {
    Router.register('/dashboard',    () => DashboardPage.render());
    Router.register('/customers',    () => CustomersPage.render());
    Router.register('/customers/:id', ({ id }) => CustomersPage.render(id));
    Router.register('/transactions', () => TransactionsPage.render());
    Router.register('/transactions/:id', ({ id }) => TransactionsPage.render(id));
    Router.register('/products',     () => ProductsPage.render());
    Router.register('/products/:id', ({ id }) => ProductsPage.render(id));
    Router.register('/loyalty',      () => LoyaltyPage.render());
    Router.register('/feedback',     () => FeedbackPage.render());
    Router.register('/complaints',   () => ComplaintsPage.render());
    Router.register('/bi',           () => BIPage.render());
    Router.register('/ai-insights',  () => AIInsightsPage.render());
    Router.register('/settings',     () => SettingsPage.render());
  }

  function init() {
    // Check if data is initialized or force reimport requested
    const forceReimport = Storage.getFlag('force_reimport');
    if (forceReimport) Storage.clearFlag('force_reimport');

    if (!Storage.isInitialized() || forceReimport) {
      // Show import screen
      ImportScreen.render();
      return;
    }

    // Render app shell
    AppShell.render();

    // Register all page routes
    registerRoutes();

    // Update complaints badge
    AppShell.updateComplaintsBadge();

    // Start router (listen to hash changes + handle initial hash)
    Router.listen();

    // Log startup info
    const stats = Storage.getStats();
    console.log('[RasaInsight] App initialized.', stats);
  }

  return { init };
})();

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
