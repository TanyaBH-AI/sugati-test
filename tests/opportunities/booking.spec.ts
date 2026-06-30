import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const STAGING_USER = process.env.STAGING_USER || '';
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || '';

function uniqueOpportunityName(): string {
  return `Test Booking ${Date.now()}`;
}

function closeDateFormatted(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

/** Navigate to Opportunities list and open the New Booking record-type form.
 *  Returns after the Booking form fields are visible and ready for input.
 */
async function openNewBookingForm(page: Page): Promise<void> {
  await page.goto('/lightning/o/Opportunity/list?filterName=Recent');
  await page.waitForLoadState('networkidle');

  // Click the New button in the list header
  await page.getByRole('button', { name: 'New', exact: true }).click();

  // Record-type selection modal
  const modal = page.locator('[role="dialog"]').first();
  await expect(modal).toBeVisible({ timeout: 20000 });
  await modal.getByText('Booking', { exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Wait for the form to load — Opportunity Name must be visible
  await expect(page.getByLabel('Opportunity Name')).toBeVisible({ timeout: 25000 });
}

/** Fill the required Booking form fields (Name, Close Date, Stage). */
async function fillBookingRequiredFields(
  page: Page,
  opportunityName: string,
): Promise<void> {
  // Opportunity Name
  await page.getByLabel('Opportunity Name').fill(opportunityName);

  // Close Date — prefer datepicker input scoped to the Close Date section
  const closeDateSection = page
    .locator('.slds-form-element')
    .filter({ hasText: /close date/i })
    .first();
  await expect(closeDateSection).toBeVisible({ timeout: 15000 });
  const closeDateInput = closeDateSection
    .locator('lightning-datepicker input')
    .first();
  if (await closeDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await closeDateInput.fill(closeDateFormatted());
    await closeDateInput.press('Tab');
  } else {
    const fallbackInput = closeDateSection.locator('input').first();
    await expect(fallbackInput).toBeVisible({ timeout: 10000 });
    await fallbackInput.fill(closeDateFormatted());
    await fallbackInput.press('Tab');
  }

  // Stage — lightning-combobox scoped to the Stage section
  const stageSection = page
    .locator('.slds-form-element')
    .filter({ hasText: /\bstage\b/i })
    .first();
  await expect(stageSection).toBeVisible({ timeout: 15000 });
  const stageCombobox = stageSection.locator('lightning-combobox').first();
  if (await stageCombobox.isVisible({ timeout: 5000 }).catch(() => false)) {
    await stageCombobox.locator('button, input').first().click();
    await page
      .locator('lightning-base-combobox-item')
      .filter({ hasText: 'Enquiry' })
      .first()
      .click();
  } else {
    // Fallback: trigger button rendered outside shadow root
    const stageButton = stageSection
      .locator('button[aria-haspopup="listbox"]')
      .first();
    await stageButton.click();
    await page.getByRole('option', { name: 'Enquiry' }).first().click();
  }
}

test.describe('Booking Opportunities', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();
  });

  test('TC-001 — create a new Booking opportunity and verify redirect to record detail', async ({
    page,
  }) => {
    const oppName = uniqueOpportunityName();

    await openNewBookingForm(page);
    await fillBookingRequiredFields(page, oppName);

    // Save the record
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // The record is created when the URL redirects to the Opportunity record page.
    // A "We hit a snag." overlay may appear (known pre-existing bug BH-441);
    // the test passes as long as the redirect occurred.
    await page.waitForURL(/\/lightning\/r\/Opportunity\//i, { timeout: 30000 });
    expect(page.url()).toMatch(/\/lightning\/r\/Opportunity\//i);
  });

  test('TC-002 — search for an existing Booking opportunity by name and verify match in list', async ({
    page,
  }) => {
    // Create a uniquely-named opportunity so we have a known record to search for.
    const oppName = uniqueOpportunityName();

    await openNewBookingForm(page);
    await fillBookingRequiredFields(page, oppName);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL(/\/lightning\/r\/Opportunity\//i, { timeout: 30000 });

    // Navigate back to the Opportunities list view
    await page.goto('/lightning/o/Opportunity/list?filterName=Recent');
    await page.waitForLoadState('networkidle');

    // Use the list search input to filter by the opportunity name.
    // Salesforce list-view search: button with label "Search this list" reveals an input.
    const searchButton = page
      .getByRole('button', { name: /search this list/i })
      .first();
    if (await searchButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchButton.click();
    }
    const searchInput = page
      .locator('input[type="search"], input[placeholder*="Search"]')
      .first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill(oppName);
    await searchInput.press('Enter');

    // Wait for the list to refresh and assert the row for our opportunity is visible
    await expect(
      page.getByRole('link', { name: oppName }).first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test('TC-003 — leave required fields empty on Booking form and verify inline validation errors', async ({
    page,
  }) => {
    await openNewBookingForm(page);

    // Do NOT fill any required fields — click Save immediately
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Inline validation errors must appear
    await expect(page.locator('[role="alert"]').first()).toBeVisible({
      timeout: 15000,
    });

    // No redirect to a record detail page — URL must not contain /Opportunity/
    expect(page.url()).not.toMatch(/\/lightning\/r\/Opportunity\//i);
  });
});
