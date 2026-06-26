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
    // Holiday Type is a lookup/pill field (not a lightning-combobox).
    // Pre-selected values render as an SLDS pill that may take time to hydrate.
    const pill = this.page.locator('.slds-pill').filter({ hasText: value }).first();
    try {
      await expect(pill).toBeVisible({ timeout: 10000 });
      return; // Already selected
    } catch {
      // Not pre-selected as pill — try other detection
    }

    // Fallback: check via field section text (non-pill text match)
    const fieldSection = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Holiday Type/i }).first();
    const pillWithValue = fieldSection.getByText(value, { exact: true });
    if (await pillWithValue.isVisible({ timeout: 3000 }).catch(() => false)) {
      return;
    }

    // Value not selected — try lookup/grouped-combobox input
    const lookupInput = fieldSection.locator('input').first();
    if (await lookupInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lookupInput.click();
      await lookupInput.fill(value);
      await this.page.getByRole('option', { name: new RegExp(value, 'i') }).first().click({ timeout: 10000 });
      return;
    }

    // Last resort: lightning-combobox (unlikely for this field)
    const combobox = this.page.locator('lightning-combobox').filter({ hasText: /holiday type/i }).first();
    if (await combobox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await combobox.locator('button, input').first().click();
      await this.page.locator('lightning-base-combobox-item span.slds-truncate')
        .filter({ hasText: value }).first().click({ timeout: 10000 });
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
      await this.page.locator('lightning-base-combobox-item span.slds-truncate')
        .filter({ hasText: currency }).first().click({ timeout: 10000 });
      return;
    }

    // Last resort: any select near Currency text
    const selectNear = this.page.locator('select').filter({ hasText: /None/i }).first();
    await selectNear.selectOption({ label: currency });
  }

  async fillDepartureDate(date: string): Promise<void> {
    const dateInput = this.page.locator('lightning-datepicker input').nth(0);
    if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dateInput.fill(date);
      await dateInput.press('Tab');
      return;
    }
    const fallback = this.page.locator('.slds-form-element').filter({ hasText: /Departure Date/i })
      .locator('input').first();
    await expect(fallback).toBeVisible({ timeout: 15000 });
    await fallback.fill(date);
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
