import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillSalutation(value: string): Promise<void> {
    const salutationSelect = this.page.locator('select').first();
    await expect(salutationSelect).toBeVisible({ timeout: 15000 });
    // Wait for options to populate before selecting (Salesforce loads them async)
    // Use exact text match to avoid substring collisions (e.g. "Mr" matching "Mrs")
    await salutationSelect.locator('option').filter({ hasText: new RegExp(`^${value}$`) }).first().waitFor({ timeout: 15000 });
    await salutationSelect.selectOption({ label: value });
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
