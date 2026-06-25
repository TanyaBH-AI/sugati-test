import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillSalutation(value: string): Promise<void> {
    // In Salesforce LWC, the "Salutation" label lives in the parent .slds-form-element wrapper,
    // NOT inside the lightning-combobox shadow DOM — filter on the wrapper, then drill in.
    const salutationCombobox = this.page
      .locator('.slds-form-element')
      .filter({ hasText: /\bsalutation\b/i })
      .locator('lightning-combobox')
      .first();
    await expect(salutationCombobox).toBeVisible({ timeout: 15000 });
    await salutationCombobox.click();
    const option = this.page.locator(`[role="option"]:has-text("${value}")`);
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
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
    const searchBtn = this.page.locator('button:has-text("Search")');
    await expect(searchBtn).toBeVisible({ timeout: 15000 });
    await searchBtn.click();
    // Wait for search results / Save & Close button to appear
    await expect(this.page.locator('button:has-text("Save & Close")')).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndClose(): Promise<void> {
    const saveCloseBtn = this.page.locator('button:has-text("Save & Close")');
    await expect(saveCloseBtn).toBeVisible({ timeout: 15000 });
    await saveCloseBtn.click();
    // Wait for Save & Next to confirm the panel closed
    await expect(this.page.locator('button:has-text("Save & Next")')).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndNext(): Promise<void> {
    const saveNextBtn = this.page.locator('button:has-text("Save & Next")');
    await expect(saveNextBtn).toBeVisible({ timeout: 15000 });
    await saveNextBtn.click();
    // Wait for opportunity form to load (Generic holiday type field)
    await expect(this.page.locator('input[value*="Generic" i]')).toBeVisible({ timeout: 30000 });
  }
}
