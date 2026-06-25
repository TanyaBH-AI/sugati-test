import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillSalutation(value: string): Promise<void> {
    // The salutation is a native <select name="salutation"> with slds-select class.
    // Option values include a trailing period (e.g. "Mr.", "Ms.", "Mrs.", "Dr.", "Prof.").
    const salutationSelect = this.page.locator('select[name="salutation"]');
    await expect(salutationSelect).toBeVisible({ timeout: 15000 });
    // Wait for options to populate (first real option after the blank placeholder)
    await salutationSelect.locator('option:nth-child(2)').waitFor({ state: 'attached', timeout: 20000 });
    // Normalize: append period if caller passed "Mr" instead of "Mr."
    const normalizedValue = value.endsWith('.') ? value : `${value}.`;
    await salutationSelect.selectOption({ value: normalizedValue });
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
    // The form Search button is the last Search button on the page
    // (the global search in the header is first in DOM order)
    const searchButtons = this.page.getByRole('button', { name: 'Search', exact: true });
    await searchButtons.last().click();
    // After search with random names: wait for either Save & Close or Save & Next or Clear Search
    await expect(
      this.page.getByRole('button', { name: 'Save & Close', exact: true })
        .or(this.page.getByRole('button', { name: 'Save & Next', exact: true })
        .or(this.page.getByRole('button', { name: 'Clear Search', exact: true })))
    ).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndClose(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Close', exact: true }).click();
    await expect(this.page.getByRole('button', { name: 'Save & Next', exact: true })).toBeVisible({ timeout: 15000 });
  }

  async clickSaveAndNext(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Next', exact: true }).click();
    await expect(this.page.locator('input[value*="Generic" i]')).toBeVisible({ timeout: 30000 });
  }
}
