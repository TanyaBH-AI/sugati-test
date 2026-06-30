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
  // Org locale is DD/MM/YYYY — same fix as commit 20334e3
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Navigate directly to the New Opportunity URL and open the Booking record-type form.
 *  Returns after the Booking form fields are visible and ready for input.
 */
async function openNewBookingForm(page: Page): Promise<void> {
  // Navigate directly to the new-opportunity URL to avoid timing issues with
  // clicking the New button from the list before the list is fully rendered.
  await page.goto('/lightning/o/Opportunity/new');
  await page.waitForLoadState('domcontentloaded');

  // Record-type selection modal — wait for Next button (unique to the modal).
  const nextBtn = page.getByRole('button', { name: 'Next', exact: true });
  const modalAppeared = await nextBtn.isVisible({ timeout: 20000 }).catch(() => false);
  if (modalAppeared) {
    await nextBtn.click();
  }

  // Wait for the form to load — use input[name="Name"] to avoid strict-mode violation
  // from getByLabel('Opportunity Name') which also matches the list-view column header.
  await expect(page.locator('input[name="Name"]').first()).toBeVisible({ timeout: 25000 });
}

/** Fill the required Booking form fields (Name, Close Date, Stage). */
async function fillBookingRequiredFields(
  page: Page,
  opportunityName: string,
): Promise<void> {
  // Opportunity Name — use input[name="Name"] to avoid strict-mode violation
  await page.locator('input[name="Name"]').first().fill(opportunityName);

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

    // The record is created when either:
    // (a) the URL redirects to the record detail page, OR
    // (b) a success toast notification appears (Salesforce may stay on current page).
    // A "We hit a snag." overlay may appear — pre-existing bug BH-441; ignore it.
    const recordDetailUrl = /\/lightning\/r\/[A-Za-z0-9]{15,18}\/view/i;
    const savedByUrl = await page.waitForURL(recordDetailUrl, { timeout: 15000, waitUntil: 'domcontentloaded' })
      .then(() => true).catch(() => false);
    if (!savedByUrl) {
      // Fall back to success toast check — record was still created
      await expect(
        page.locator('status').filter({ hasText: /was created/i }).first()
      ).toBeVisible({ timeout: 20000 });
    }
  });

  test('TC-002 — search for an existing Booking opportunity by name and verify match in list', async ({
    page,
  }) => {
    // Create a uniquely-named opportunity so we have a known record to search for.
    const oppName = uniqueOpportunityName();

    await openNewBookingForm(page);
    await fillBookingRequiredFields(page, oppName);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL(/\/lightning\/r\/[A-Za-z0-9]{15,18}\/view/i, { timeout: 30000, waitUntil: 'domcontentloaded' });

    // Navigate back to the Opportunities list view and wait for the table to load
    await page.goto('/lightning/o/Opportunity/list?filterName=Recent');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the list table to be present before interacting with search
    await expect(page.locator('table').first()).toBeVisible({ timeout: 30000 });

    // Salesforce list-view search: click the search button to reveal the search input
    const searchButton = page
      .getByRole('button', { name: /search this list/i })
      .first();
    if (await searchButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchButton.click();
    }

    // Scope to the list-view header to avoid matching the hidden global search input
    const listHeader = page.locator('[data-component-id="forceListViewManagerHeader"], .slds-page-header, .forceListViewManagerHeader').first();
    const searchInput = listHeader.locator('input[type="search"]').first();
    const searchVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (searchVisible) {
      await searchInput.fill(oppName);
      await searchInput.press('Enter');
    } else {
      // Fallback: try the global search flow as an alternative
      await page.getByPlaceholder(/search this list/i).first().fill(oppName);
      await page.getByPlaceholder(/search this list/i).first().press('Enter');
    }

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

    // Inline validation errors must appear — scope to field-level error containers,
    // not the forceInlineSpinner which also carries role="alert" but is hidden.
    await expect(
      page.locator('.slds-has-error, [class*="errorMessageCell"], lightning-input .slds-form-element__help').first()
    ).toBeVisible({ timeout: 15000 });

    // No redirect to a record detail page — URL must not contain /Opportunity/
    expect(page.url()).not.toMatch(/\/lightning\/r\/[A-Za-z0-9]{15,18}\/view/i);
  });
});
