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
    // Wait for "Booking Type" heading — the modal is a custom LWC without role="dialog"
    await expect(this.page.getByText('Booking Type', { exact: true })).toBeVisible({ timeout: 30000 });
  }

  async selectIndividual(): Promise<void> {
    // Click Individual tile — scope to slds-modal container to avoid false matches
    const individualOption = this.page.locator('.slds-modal, [class*="modal"]').getByText('Individual').first();
    await expect(individualOption).toBeVisible({ timeout: 15000 });
    await individualOption.click();
    // Wait for client information form to load
    await expect(this.page.locator('input[type="text"]:not([readonly])').first()).toBeVisible({ timeout: 30000 });
  }
}
