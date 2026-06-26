import { Page, expect } from '@playwright/test';

export class OpportunityFormPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    await expect(this.page.getByText('Holiday Type', { exact: true }).first()).toBeVisible({ timeout: 30000 });
  }

  async selectHolidayType(value: string): Promise<void> {
    // Holiday Type is a lookup/pill field. When pre-selected, the input has
    // aria-readonly="true" and data-value set to the selected value.
    const fieldSection = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Holiday Type/i }).first();
    await expect(fieldSection).toBeVisible({ timeout: 15000 });

    // Check if already selected via data-value attribute on the input
    const inputWithValue = fieldSection.locator(`input[data-value="${value}"]`);
    if (await inputWithValue.isVisible({ timeout: 5000 }).catch(() => false)) {
      return; // Already selected
    }

    // Also check for readonly input (value may be set even if data-value format differs)
    const readonlyInput = fieldSection.locator('input[aria-readonly="true"]');
    if (await readonlyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dataVal = await readonlyInput.getAttribute('data-value');
      if (dataVal && dataVal.toLowerCase() === value.toLowerCase()) {
        return; // Already selected
      }
    }

    // Not selected — use editable input to search and select
    const editableInput = fieldSection.locator('input:not([aria-readonly="true"])').first();
    if (await editableInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editableInput.click();
      await editableInput.fill(value);
      await this.page.getByRole('option', { name: new RegExp(value, 'i') }).first().click({ timeout: 10000 });
    }
  }

  async selectCurrency(currency: string): Promise<void> {
    // Booking Currency may be a native <select> or lightning-combobox.
    // Try native select first (screenshot shows native dropdown styling).
    const currencySection = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Currency/i }).first();
    const nativeSelect = currencySection.locator('select').first();
    if (await nativeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nativeSelect.selectOption({ label: currency });
      return;
    }

    // Fall back to lightning-combobox
    const combobox = this.page.locator('lightning-combobox').filter({ hasText: /currency/i }).first();
    if (await combobox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await combobox.locator('button, input').first().click();
      // Wait for options to render, then click via role (shadow-DOM-safe)
      await expect(this.page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
      await this.page.getByRole('option', { name: currency, exact: true }).click({ timeout: 10000 });
      return;
    }

    // Last resort: any select near Currency text
    const selectNear = this.page.locator('select').filter({ hasText: /None/i }).first();
    await selectNear.selectOption({ label: currency });
  }

  async fillDepartureDate(date: string): Promise<void> {
    // date arrives as MM/DD/YYYY; Salesforce datepicker expects D MMM YYYY (e.g. "3 Aug 2026")
    const [mm, dd, yyyy] = date.split('/').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const sfDate = `${dd} ${months[mm - 1]} ${yyyy}`;

    const dateInput = this.page.locator('lightning-datepicker input').nth(0);
    if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dateInput.fill(sfDate);
      await dateInput.press('Tab');
      return;
    }
    const fallback = this.page.locator('.slds-form-element').filter({ hasText: /Departure Date/i })
      .locator('input').first();
    await expect(fallback).toBeVisible({ timeout: 15000 });
    await fallback.fill(sfDate);
    await fallback.press('Tab');
  }

  async fillNights(nights: string): Promise<void> {
    const nightsSection = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /^Nights$/i }).first();
    const scopedInput = nightsSection.locator('input').first();
    if (await scopedInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await scopedInput.fill(nights);
      await scopedInput.press('Tab');
      return;
    }
    const nightsInput = this.page.locator('input[name*="night" i], input[type="number"]').first();
    await expect(nightsInput).toBeVisible({ timeout: 15000 });
    await nightsInput.fill(nights);
    await nightsInput.press('Tab');
  }

  async getReturnDate(): Promise<string> {
    const returnDateInput = this.page.locator('lightning-datepicker').nth(1).locator('input');
    if (await returnDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      return await returnDateInput.inputValue();
    }
    const fallback = this.page.locator('.slds-form-element').filter({ hasText: /Return Date/i })
      .locator('input').first();
    await expect(fallback).toBeVisible({ timeout: 15000 });
    return await fallback.inputValue();
  }

  async assertSaveAndNextEnabled(): Promise<void> {
    await expect(
      this.page.getByRole('button', { name: 'Save & Next', exact: true })
    ).toBeEnabled({ timeout: 15000 });
  }
}
