import { Page, expect } from '@playwright/test';

export class OpportunityDetailPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    // .slds-page-header__name-title is only rendered on Salesforce Lightning
    // standard record-detail pages (/lightning/r/...) — not on wizard/form pages.
    // This avoids the strict-mode violation caused by broad OR locators that
    // match the global app h1 and other page-header elements simultaneously.
    await expect(
      this.page.locator('.slds-page-header__name-title')
    ).toBeVisible({ timeout: 20000 });
  }

  async assertAccountName(firstName: string, lastName: string): Promise<void> {
    // Account Name on Opportunity detail combines First + Last with a space
    // TODO: verify selector — field may render in lightning-formatted-text or a span
    const accountNameField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Account Name/i }).first();
    await expect(accountNameField).toContainText(`${firstName} ${lastName}`, { timeout: 15000 });
  }

  async assertType(expectedType: string): Promise<void> {
    // TODO: verify selector
    const typeField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /^Type$/i }).first();
    await expect(typeField).toContainText(expectedType, { timeout: 15000 });
  }

  async assertStage(expectedStage: string): Promise<void> {
    // TODO: verify selector
    const stageField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Stage/i }).first();
    await expect(stageField).toContainText(expectedStage, { timeout: 15000 });
  }

  async assertDepartureDate(departureDateMMDDYYYY: string): Promise<void> {
    // departureDateMMDDYYYY is MM/DD/YYYY. Salesforce detail view typically
    // displays as M/D/YYYY — strip leading zeros for a loose match.
    // TODO: verify selector and date display format on live UI
    const [mm, dd, yyyy] = departureDateMMDDYYYY.split('/');
    const displayDate = `${parseInt(mm)}/${parseInt(dd)}/${yyyy}`;
    const departureField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Departure Date/i }).first();
    await expect(departureField).toContainText(displayDate, { timeout: 15000 });
  }

  async assertReturnDate(returnDateDMonYYYY: string): Promise<void> {
    // returnDateDMonYYYY is "D Mon YYYY" (e.g. "20 Jun 2026") from the datepicker input.
    // Salesforce detail view displays as M/D/YYYY — convert for a loose match.
    // TODO: verify selector and date display format on live UI
    const sfMonths: Record<string, number> = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sept: 9, Oct: 10, Nov: 11, Dec: 12,
    };
    const parts = returnDateDMonYYYY.split(' ');
    const day = parseInt(parts[0]);
    const month = sfMonths[parts[1]] ?? 0;
    const year = parts[2];
    const displayDate = `${month}/${day}/${year}`;
    const returnField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Return Date/i }).first();
    await expect(returnField).toContainText(displayDate, { timeout: 15000 });
  }

  async assertHolidayType(expectedType: string): Promise<void> {
    // Holiday Type in Holiday Details section
    // TODO: verify selector — field may be in a separate "Holiday Details" section
    const holidayTypeField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Holiday Type/i }).first();
    await expect(holidayTypeField).toContainText(expectedType, { timeout: 15000 });
  }
}
