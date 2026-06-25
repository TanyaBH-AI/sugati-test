import { Page, expect } from '@playwright/test';

export class OpportunityFormPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertHolidayTypePreFilled(): Promise<void> {
    await expect(this.page.locator('input[value*="Generic" i]')).toBeVisible({ timeout: 15000 });
  }

  async selectHolidayType(value: string): Promise<void> {
    const combobox = this.page.locator('lightning-combobox').filter({ hasText: /holiday type/i }).first();
    await expect(combobox).toBeVisible({ timeout: 15000 });
    await combobox.locator('button, input').first().click();
    await this.page.locator('lightning-base-combobox-item span.slds-truncate').filter({ hasText: value }).first().click();
  }

  async selectCurrency(currency: string): Promise<void> {
    const combobox = this.page.locator('lightning-combobox').filter({ hasText: /currency/i }).first();
    await expect(combobox).toBeVisible({ timeout: 15000 });
    await combobox.locator('button, input').first().click();
    await this.page.locator('lightning-base-combobox-item span.slds-truncate').filter({ hasText: currency }).first().click();
  }

  async fillDepartureDate(date: string): Promise<void> {
    const dateInput = this.page.locator('lightning-datepicker input').nth(0);
    await expect(dateInput).toBeVisible({ timeout: 15000 });
    await dateInput.fill(date);
    await dateInput.press('Tab');
  }

  async fillNights(nights: string): Promise<void> {
    const nightsInput = this.page.locator('input[name*="night" i], input[type="number"]').first();
    await expect(nightsInput).toBeVisible({ timeout: 15000 });
    await nightsInput.fill(nights);
    await nightsInput.press('Tab');
  }

  async getReturnDate(): Promise<string> {
    const returnDateInput = this.page.locator('lightning-datepicker').nth(1).locator('input');
    await expect(returnDateInput).toBeVisible({ timeout: 15000 });
    return await returnDateInput.inputValue();
  }

  async clickSaveAndNext(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save & Next', exact: true }).click();
    await expect(this.page.getByText('Group Members', { exact: true })).toBeVisible({ timeout: 30000 });
  }
}
