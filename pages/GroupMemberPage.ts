import { Page, expect } from '@playwright/test';

export class GroupMemberPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    const heading = this.page.getByText('Group Members', { exact: true });
    await expect(heading).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndGoToOpportunity(): Promise<void> {
    const saveBtn = this.page.locator('button:has-text("Save & Go to Opportunity")');
    await expect(saveBtn).toBeVisible({ timeout: 15000 });
    await saveBtn.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }
}
