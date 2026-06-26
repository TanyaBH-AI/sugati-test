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
    // TODO: verify selector — Salesforce Lightning toasts use .slds-notify or role="alert"
    const toast = this.page.locator('.slds-notify_toast, .slds-notify--toast, .toastMessage')
      .or(this.page.getByRole('alert').first());
    await expect(toast.first()).toBeVisible({ timeout: 10000 });

    // Click the close (✕) button on the toast
    // TODO: verify selector — close button is typically aria-label="Close" or title="Close" inside the toast container
    const closeBtn = this.page.locator('.slds-notify_toast button[title="Close"], .slds-notify--toast button[title="Close"]')
      .or(this.page.locator('[role="alert"] button[title="Close"]'))
      .or(this.page.getByRole('button', { name: 'Close', exact: true }).filter({ has: this.page.locator('[class*="notify"]') }));
    if (await closeBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await closeBtn.first().click();
    } else {
      // Fallback: click whichever Close button is visible near the toast area
      await this.page.locator('button[title="Close"]').first().click();
    }

    // Wait for the toast to disappear before continuing
    await expect(toast.first()).not.toBeVisible({ timeout: 8000 }).catch(() => {/* toast may have already gone */});
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
