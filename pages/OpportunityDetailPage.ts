import { Page, expect } from '@playwright/test';

export class OpportunityDetailPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async assertPageLoaded(): Promise<void> {
    // URL-based assertion: Salesforce Opportunity record URLs contain /lightning/r/Opportunity/
    // This is more reliable than DOM class selectors which vary by org/component version.
    await this.page.waitForURL(/\/lightning\/r\/Opportunity\//i, { timeout: 30000 });
    // Additional visible-element check to confirm page content has rendered
    await expect(this.page.locator('.slds-page-header').first()).toBeVisible({ timeout: 10000 });
  }

  async assertAccountName(firstName: string, lastName: string): Promise<void> {
    // Scope into the value element: label is in __label, value is in __static or __control
    const accountNameField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Account Name/i }).first()
      .locator('.slds-form-element__static, .slds-form-element__control').first();
    await expect(accountNameField).toContainText(`${firstName} ${lastName}`, { timeout: 15000 });
  }

  async assertType(expectedType: string): Promise<void> {
    // Target the form element whose label is exactly the 'Type' picklist —
    // NOT 'Holiday Type' or 'Opportunity Record Type' (both also contain 'Type').
    // Filter via the child label element to exclude 'Record' and 'Holiday' words.
    const typeField = this.page
      .locator('.slds-form-element')
      .filter({
        has: this.page.locator('.slds-form-element__label')
          .filter({ hasText: 'Type' })
          .filter({ hasNotText: /Record|Holiday/ }),
      })
      .first();
    await expect(typeField).toContainText(expectedType, { timeout: 15000 });
  }

  async assertStage(expectedStage: string): Promise<void> {
    // Scope to .slds-form-element containers only; assert on the element directly
    // to be resilient across picklist component variations
    const stageField = this.page
      .locator('.slds-form-element')
      .filter({ hasText: /\bStage\b/ })
      .first();
    await expect(stageField).toContainText(expectedStage, { timeout: 15000 });
  }

  async assertDepartureDate(departureDateMMDDYYYY: string): Promise<void> {
    // departureDateMMDDYYYY is MM/DD/YYYY. Salesforce org uses DD/MM/YYYY locale.
    const [mm, dd, yyyy] = departureDateMMDDYYYY.split('/');
    const displayDate = `${dd}/${mm}/${yyyy}`;
    const departureField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Departure Date/i }).first()
      .locator('.slds-form-element__static, .slds-form-element__control').first();
    await expect(departureField).toContainText(displayDate, { timeout: 15000 });
  }

  async assertReturnDate(returnDateDMonYYYY: string): Promise<void> {
    // returnDateDMonYYYY is "D Mon YYYY" (e.g. "20 Jun 2026") from the datepicker input.
    // Salesforce detail view displays as M/D/YYYY — convert for a loose match.
    const sfMonths: Record<string, number> = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sept: 9, Oct: 10, Nov: 11, Dec: 12,
    };
    const parts = returnDateDMonYYYY.split(' ');
    const day = parseInt(parts[0]);
    const month = sfMonths[parts[1]] ?? 0;
    const year = parts[2];
    // Salesforce org uses DD/MM/YYYY locale — zero-pad day and month.
    const displayDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    const returnField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Return Date/i }).first()
      .locator('.slds-form-element__static, .slds-form-element__control').first();
    await expect(returnField).toContainText(displayDate, { timeout: 15000 });
  }

  async assertHolidayType(expectedType: string): Promise<void> {
    const holidayTypeField = this.page.locator('.slds-form-element, [class*="form-element"]')
      .filter({ hasText: /Holiday Type/i }).first()
      .locator('.slds-form-element__static, .slds-form-element__control').first();
    await expect(holidayTypeField).toContainText(expectedType, { timeout: 15000 });
  }
}
