import { Page, expect } from '@playwright/test';

export class GroupMemberPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.page.getByText('Group Members', { exact: true })).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndGoToOpportunity(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Go to Opportunity', exact: true }).click();
    await this.page.waitForURL(/\/Opportunity\//, { timeout: 30000, waitUntil: 'domcontentloaded' });
  }
}
