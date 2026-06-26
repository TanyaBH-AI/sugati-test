import { Page, expect } from '@playwright/test';

export class GroupMembersPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    // TODO: verify selector — wait for Group Members page heading/title
    await expect(
      this.page.getByRole('heading', { name: /Group Members/i })
        .or(this.page.getByText('Group Members', { exact: true }).first())
    ).toBeVisible({ timeout: 20000 });
  }

  async clickSaveAndGoToOpportunity(): Promise<void> {
    // TODO: verify selector — button label on Group Members page
    await this.page.getByRole('button', { name: 'Save & Go to Opportunity', exact: true }).click();
  }
}
