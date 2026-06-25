import { Page, expect } from '@playwright/test';

export class OpportunityFormPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertHolidayTypePreFilled(): Promise<void> {
    const holidayTypeInput = this.page.locator('input[value*="Generic" i]');
    await expect(holidayTypeInput).toBeVisible({ timeout: 15000 });
  }

  async selectHolidayType(value: string): Promise<void> {
    const holidayCombobox = this.page.locator('lightning-combobox').filter({ hasText: /holiday type/i });
    await expect(holidayCombobox).toBeVisible({ timeout: 15000 });
    await holidayCombobox.click();
    const option = this.page.locator(`[role="option"]:has-text("${value}")`);
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  async selectCurrency(currency: string): Promise<void> {
    const currencyCombobox = this.page.locator('lightning-combobox').filter({ hasText: /currency/i });
    await expect(currencyCombobox).toBeVisible({ timeout: 15000 });
    await currencyCombobox.click();
    const option = this.page.locator(`[role="option"]:has-text("${currency}")`);
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  }

  async fillDepartureDate(date: string): Promise<void> {
    const departureDateInput = this.page.locator('lightning-datepicker input').nth(0);
    await expect(departureDateInput).toBeVisible({ timeout: 15000 });
    await departureDateInput.fill(date);
    await departureDateInput.press('Tab');
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
    const saveNextBtn = this.page.locator('button:has-text("Save & Next")');
    await expect(saveNextBtn).toBeVisible({ timeout: 15000 });
    await saveNextBtn.click();
    // Wait for Group Members heading instead of networkidle
    await expect(this.page.getByText('Group Members', { exact: true })).toBeVisible({ timeout: 30000 });
  }
}
