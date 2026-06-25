import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Fill the Salutation field.
   * In Salesforce Lightning, this renders as a lightning-combobox (not a native <select>).
   * Strategy: click the combobox trigger to open the dropdown, then select the option
   * using an exact-text match on the listbox item to avoid matching "Mrs." or "Mr.".
   * Falls back to native <select> if a lightning-combobox is not found.
   */
  async fillSalutation(value: string): Promise<void> {
    // Strategy 1: Lightning combobox (most likely in Lightning Experience)
    const lightningCombobox = this.page.locator('lightning-combobox, lightning-grouped-combobox').first();
    const nativeSelect = this.page.locator('select').first();

    // Check which element type is present
    const isLightningCombobox = await lightningCombobox.isVisible({ timeout: 5000 }).catch(() => false);

    if (isLightningCombobox) {
      // Click the combobox trigger (button or input) to open the dropdown
      await lightningCombobox.locator('button, input').first().click();

      // Wait for the dropdown listbox to appear and select the exact option
      // Use role="option" with exact text to avoid matching "Mrs." when selecting "Mr"
      const option = this.page.locator('lightning-base-combobox-item').filter({
        has: this.page.locator(`span.slds-truncate`, { hasText: new RegExp(`^${value}$`) })
      }).first();
      await expect(option).toBeVisible({ timeout: 10000 });
      await option.click();
    } else {
      // Strategy 2: Native <select> fallback
      await expect(nativeSelect).toBeVisible({ timeout: 15000 });
      // Wait for options to load
      await nativeSelect.locator('option:nth-child(2)').waitFor({ state: 'attached', timeout: 15000 });
      await nativeSelect.selectOption({ label: value });
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
    await this.page.locator('button:has-text("Search")').click();
    await expect(this.page.locator('button:has-text("Save & Close")')).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndClose(): Promise<void> {
    await this.page.locator('button:has-text("Save & Close")').click();
    await expect(this.page.locator('button:has-text("Save & Next")')).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndNext(): Promise<void> {
    await this.page.locator('button:has-text("Save & Next")').click();
    await expect(this.page.locator('input[value*="Generic" i]')).toBeVisible({ timeout: 30000 });
  }
}
