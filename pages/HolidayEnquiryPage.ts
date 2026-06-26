import { Page, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'https://sugatidevqa-dev-ed.lightning.force.com').replace(/\/$/, '');

export class HolidayEnquiryPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(`${BASE_URL}/lightning/n/sugati_qa__Holiday_Enquiry_V2`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await expect(this.page.getByText('Booking Type')).toBeVisible({ timeout: 30000 });
  }

  async selectIndividual(): Promise<void> {
    const modal = this.page.locator('.slds-modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: 15000 });
    await modal.getByText('Individual', { exact: true }).click();
    await expect(this.page.locator('input[type="text"]').first()).toBeVisible({ timeout: 15000 });
  }
}
