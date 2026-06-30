import { Page, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'https://sugatidevqa-dev-ed.lightning.force.com').replace(/\/$/, '');

export class HomePage {
  private readonly page: Page;

  // Global header logo (top-left Salesforce waffle/logo)
  private readonly headerLogo = '.slds-global-header__logo, .slds-icon-waffle';
  // Context bar / app navigation containing page tabs
  private readonly navBar = '.slds-context-bar';
  // Main content body of the Lightning page
  private readonly mainContent = 'main, .slds-template__container, [class*="pageBody"]';
  // User avatar / profile button in the utility bar
  private readonly userProfile = '.slds-global-header .slds-utility-bar, [data-aura-class*="userProfile"], .slds-global-header__item--utility';
  // Dashboard widget/summary cards
  private readonly widgetCard = '.slds-card';
  // Empty-state illustration (shown when no data exists for a widget)
  private readonly emptyStateElement = '.slds-illustration, [class*="emptyState"], [class*="empty-state"]';

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToHome(): Promise<void> {
    await this.page.goto(`${BASE_URL}/lightning/n/standard-home`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Wait for global header as the page-load signal
    await expect(this.page.locator(this.headerLogo).first()).toBeVisible({ timeout: 30000 });
  }

  async assertAllUIElementsVisible(): Promise<void> {
    // Header / logo
    await expect(this.page.locator(this.headerLogo).first()).toBeVisible({ timeout: 30000 });
    // App navigation bar
    await expect(this.page.locator(this.navBar).first()).toBeVisible({ timeout: 30000 });
    // Main content area
    await expect(this.page.locator(this.mainContent).first()).toBeVisible({ timeout: 30000 });
    // User profile / greeting in the utility bar
    await expect(this.page.locator(this.userProfile).first()).toBeVisible({ timeout: 30000 });
  }

  async clickNavLink(linkName: string): Promise<void> {
    // Try tab role first (Lightning context bar renders items as tabs), then link role
    const byTab = this.page.getByRole('tab', { name: new RegExp(linkName, 'i') });
    const byLink = this.page.getByRole('link', { name: new RegExp(linkName, 'i') });
    const link = byTab.or(byLink);
    await expect(link.first()).toBeVisible({ timeout: 15000 });
    await link.first().click();
  }

  async assertWidgetsVisible(): Promise<void> {
    // At least one card/widget must be present on the Home page
    await expect(this.page.locator(this.widgetCard).first()).toBeVisible({ timeout: 30000 });
  }

  async assertWidgetsHaveContent(): Promise<void> {
    const cards = this.page.locator(this.widgetCard);
    const count = await cards.count();
    // At least one widget must be rendered
    expect(count).toBeGreaterThan(0);
    // No card should display raw null or N/A as widget content
    const nullValueCards = cards.filter({ hasText: /^\s*null\s*$/ });
    await expect(nullValueCards).toHaveCount(0);
  }

  async assertNoLayoutErrors(): Promise<void> {
    // Page structure must be intact regardless of data state
    await expect(this.page.locator(this.headerLogo).first()).toBeVisible({ timeout: 30000 });
    await expect(this.page.locator(this.mainContent).first()).toBeVisible({ timeout: 30000 });
    // Salesforce error panels must not be present
    const errorPanel = this.page.locator('[data-aura-class*="auraError"], [class*="forceErrorPanel"]');
    await expect(errorPanel).toHaveCount(0);
  }

  async assertEmptyStateVisible(): Promise<void> {
    await expect(this.page.locator(this.emptyStateElement).first()).toBeVisible({ timeout: 30000 });
  }
}
