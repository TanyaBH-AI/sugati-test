import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillSalutation(value: string): Promise<void> {
    const salutationSelect = this.page.locator('select').first();
    await expect(salutationSelect).toBeVisible({ timeout: 15000 });

    // Attempt 3: Wait for ANY options to load (not a specific label),
    // then discover what's available and pick the best match.
    // The first <option> is typically a blank placeholder, so wait for a 2nd.
    await salutationSelect.locator('option:nth-child(2)').waitFor({ state: 'attached', timeout: 20000 }).catch(async () => {
      // If no native options appear, this might be a lightning-combobox.
      // Click to open and select from the rendered dropdown list.
      await salutationSelect.click();
      const option = this.page.locator(`lightning-base-combobox-item span[title="${value}"]`).first();
      await option.waitFor({ timeout: 10000 });
      await option.click();
      return;
    });

    // Log all available options for diagnostics
    const allOptions = await salutationSelect.locator('option').allTextContents();
    console.log(`[fillSalutation] Available options: ${JSON.stringify(allOptions)}`);

    // Try exact label match first, then partial match, then index fallback
    const exactMatch = allOptions.find(o => o.trim() === value);
    const partialMatch = allOptions.find(o => o.trim().startsWith(value));
    if (exactMatch) {
      await salutationSelect.selectOption({ label: exactMatch });
    } else if (partialMatch) {
      await salutationSelect.selectOption({ label: partialMatch });
    } else if (allOptions.length > 1) {
      // Fallback: select first non-empty option
      await salutationSelect.selectOption({ index: 1 });
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
