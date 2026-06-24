import { Page, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'https://sugatidevqa-dev-ed.lightning.force.com').replace(/\/$/, '');

export class HolidayEnquiryPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(`${BASE_URL}/lightning/n/sugati_qa__Holiday_Enquiry_V2`, {
      waitUntil: 'load',
      timeout: 60000,
    });
    // Wait for the page content to stabilize
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  async dismissModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
    // Brief wait for modal animation to complete
    await this.page.waitForTimeout(500);
  }

  async selectIndividual(): Promise<void> {
    const individualTile = this.page.locator('.slds-modal__container >> text=Individual');
    await expect(individualTile).toBeVisible({ timeout: 15000 });
    await individualTile.click();
    // Wait for the next page to begin loading
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }
}
