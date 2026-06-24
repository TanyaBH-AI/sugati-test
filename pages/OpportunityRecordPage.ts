import { Page, expect } from '@playwright/test';

export class OpportunityRecordPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/Opportunity\//, { timeout: 30000 });
  }
}
