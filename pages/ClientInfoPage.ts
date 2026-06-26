import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillSalutation(value: string): Promise<void> {
    const normalizedValue = value.endsWith('.') ? value : `${value}.`;
    // Try native <select> first (standard Salesforce salutation)
    const nativeSelect = this.page.locator('select').first();
    const isNative = await nativeSelect.isVisible({ timeout: 5000 }).catch(() => false);

    if (isNative) {
      await nativeSelect.selectOption({ label: normalizedValue });
    } else {
      // Lightning combobox fallback
      const combobox = this.page.locator('lightning-combobox').filter({ hasText: /salutation/i }).first();
      await expect(combobox).toBeVisible({ timeout: 15000 });
      await combobox.locator('button, input').first().click();
      await this.page.locator('lightning-base-combobox-item span.slds-truncate').filter({ hasText: value }).first().click();
    }
  }

  async fillFirstName(name: string): Promise<void> {
    const firstNameInput = this.page.locator('input[type="text"]:not([readonly])').nth(0);
    await expect(firstNameInput).toBeVisible({ timeout: 15000 });
    await firstNameInput.fill(name);
  }

  async fillLastName(name: string): Promise<void> {
    const lastNameInput = this.page.locator('input[type="text"]:not([readonly])').nth(1);
    await expect(lastNameInput).toBeVisible({ timeout: 15000 });
    await lastNameInput.fill(name);
  }

  async clickSearch(): Promise<void> {
    const searchButtons = this.page.getByRole('button', { name: 'Search', exact: true });
    await searchButtons.last().click();
    await Promise.race([
      this.page.getByRole('button', { name: 'Save & Close', exact: true }).waitFor({ state: 'visible', timeout: 15000 }),
      this.page.getByRole('button', { name: 'Save & Next', exact: true }).waitFor({ state: 'visible', timeout: 15000 }),
      this.page.getByRole('button', { name: 'Clear Search', exact: true }).waitFor({ state: 'visible', timeout: 15000 }),
    ]);
  }

  async clickSaveAndClose(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await expect(this.page.getByRole('button', { name: 'Save & Next', exact: true })).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndNext(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Next', exact: true }).click();
    await expect(this.page.getByText('Departure Date').first()).toBeVisible({ timeout: 30000 });
  }
}
