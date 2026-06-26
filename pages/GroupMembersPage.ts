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

  async dismissErrorToast(): Promise<void> {
    // AB-36: clicking "Save & Go to Opportunity" throws a "List index out of bounds: 0" error toast.
    // Wait for the toast to appear, then close it so we can proceed.
    const toast = this.page.locator('.slds-notify_toast, .slds-notify--toast, [role="alert"]').first();
    const toastVisible = await toast.isVisible({ timeout: 10000 }).catch(() => false);
    if (!toastVisible) return; // No toast — nothing to dismiss

    // .slds-notify__close is the canonical Salesforce Lightning toast close button class.
    // The button is in the DOM but may not pass Playwright's visibility check due to
    // shadow DOM or CSS layering — use { force: true } to click it regardless.
    const closeBtn = this.page.locator('.slds-notify__close').first();
    if (await closeBtn.count() > 0) {
      await closeBtn.click({ force: true });
    } else {
      // Fallback: press Escape to dismiss the toast
      await this.page.keyboard.press('Escape');
    }

    // Wait for the toast to disappear before continuing
    await expect(toast).not.toBeVisible({ timeout: 8000 }).catch(() => {/* toast may have already gone */});
  }

  async clickSaveAndOpportunity(): Promise<void> {
    // After dismissing the AB-36 error toast, click "Save & Opportunity" to proceed.
    // The user reported this button label; it may differ slightly — try exact match first,
    // then fall back to a partial-text match.
    // TODO: verify selector against live UI
    const exactBtn = this.page.getByRole('button', { name: 'Save & Opportunity', exact: true });
    if (await exactBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exactBtn.click();
      return;
    }
    // Fallback: the original button may still be available after toast dismissal
    const fallbackBtn = this.page.getByRole('button', { name: /Save.*Opportunity/i }).first();
    await expect(fallbackBtn).toBeVisible({ timeout: 10000 });
    await fallbackBtn.click();
  }
}
