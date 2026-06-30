import { Page, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'https://sugatidevqa-dev-ed.lightning.force.com').replace(/\/$/, '');

export class OpportunitiesPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToList(): Promise<void> {
    await this.page.goto(`${BASE_URL}/lightning/o/Opportunity/home`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await expect(this.page.locator('.slds-page-header, [class*="pageHeader"]').first())
      .toBeVisible({ timeout: 30000 });
  }

  async clickNew(): Promise<void> {
    await this.page.getByRole('button', { name: 'New', exact: true }).click();
  }

  async selectRecordType(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /New Opportunity/i }))
      .toBeVisible({ timeout: 20000 });

    // Primary: role + accessible name (resilient across Salesforce versions)
    const tourRadio = this.page.getByRole('radio', { name: /Tour For Tour Opportunities/i });
    if (await tourRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Salesforce Lightning radio inputs are positioned off-screen behind a
      // custom visual element; dispatchEvent bypasses pointer-event interception.
      await tourRadio.dispatchEvent('click');
    } else {
      // Fallback: visual picker label text
      const tourLabel = this.page.locator('.slds-visual-picker label').filter({ hasText: /Tour/i }).first();
      await expect(tourLabel).toBeVisible({ timeout: 10000 });
      await tourLabel.click();
    }

    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  async fillOpportunityName(name: string): Promise<void> {
    // Scope to modal form container to avoid matching unrelated Name inputs on the page
    const nameInput = this.page.locator('.slds-modal').locator('input[name="Name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 20000 });
    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.fill(name);
  }

  async selectStage(stage = 'Enquiry'): Promise<void> {
    const stageBtn = this.page.locator('button[aria-label="Stage"]').first();
    await expect(stageBtn).toBeVisible({ timeout: 15000 });
    await stageBtn.click();
    await this.page.getByRole('option', { name: stage, exact: true }).click({ timeout: 10000 });
  }

  async fillCloseDate(date = '31/12/2026'): Promise<void> {
    const closeDateInput = this.page.locator('input[name="CloseDate"]').first();
    await expect(closeDateInput).toBeVisible({ timeout: 15000 });
    await closeDateInput.scrollIntoViewIfNeeded();
    await closeDateInput.fill(date);
    await closeDateInput.press('Tab');
  }

  async saveOpportunity(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save', exact: true }).click();
  }

  async assertPageLoaded(): Promise<void> {
    // URL check only: Salesforce Lightning SPA keeps list-view slds-page-header
    // elements in the DOM (hidden) while the detail page renders, making any
    // .slds-page-header/.slds-page-header__name-title DOM assertion unreliable.
    // Downstream assertions (assertOpportunityName / Edit button) confirm content.
    await this.page.waitForURL(/\/lightning\/r\/Opportunity\//i, { timeout: 30000 });
  }

  async assertOpportunityName(name: string): Promise<void> {
    // getByText().first() resolves to the hidden list-view span (SPA keeps prior
    // page DOM in memory). Use page title instead — Salesforce sets it to the
    // record name once the detail page hydrates, unaffected by DOM visibility.
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await expect(this.page).toHaveTitle(new RegExp(escaped, 'i'), { timeout: 20000 });
  }
}
