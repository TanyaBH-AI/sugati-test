import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { OpportunityDetailPage } from '../../pages/OpportunityDetailPage';

const STAGING_USER = process.env.STAGING_USER || '';
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || '';
const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'https://sugatidevqa-dev-ed.lightning.force.com').replace(/\/$/, '');

// Shared across TC-001 → TC-002 (sequential describe block, fullyParallel: false)
let createdOpportunityName: string;

/**
 * Navigates to the Opportunity list and opens the New Opportunity form.
 * Handles the optional record-type dialog (selects Booking when present).
 */
async function openNewOpportunityForm(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/lightning/o/Opportunity/list`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^New$/i }).click();

  // Record type selection dialog — present when multiple record types exist
  const dialog = page.getByRole('dialog', { name: /New Opportunity/i });
  if (await dialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    const bookingRadio = dialog.getByRole('radio', { name: /Booking/i });
    if (await bookingRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bookingRadio.click();
    }
    await dialog.getByRole('button', { name: /^Next$/i }).click();
  }
}

test.describe('Opportunities Section', () => {

  test('TC-001: Create a New Opportunity with Valid Data', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Unique name so TC-002 can reliably locate this record
    createdOpportunityName = `Test Opp ${Date.now()}`;

    await openNewOpportunityForm(page);

    // Fill required fields
    await page.getByRole('textbox', { name: /Opportunity Name/i }).fill(createdOpportunityName);

    const stageCombobox = page.getByRole('combobox', { name: 'Stage' }).first();
    await stageCombobox.click();
    await page.getByRole('option', { name: 'Enquiry' }).first().click();

    const closeDateInput = page.getByRole('textbox', { name: /Close Date/i });
    await closeDateInput.fill('31/12/2026');
    await closeDateInput.press('Tab');

    // Submit — "Save & Next" for wizard flow, plain "Save" for standard modal
    const saveAndNextBtn = page.getByRole('button', { name: 'Save & Next', exact: true });
    if (await saveAndNextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveAndNextBtn.click();
    } else {
      await page.getByRole('button', { name: 'Save', exact: true }).click();
    }

    // Verify: navigated to detail page or back to list with the new record visible
    await page.waitForURL(
      /\/lightning\/r\/Opportunity\/|\/lightning\/o\/Opportunity\/list/,
      { timeout: 30000 }
    );
    await expect(page.getByText(createdOpportunityName).first()).toBeVisible({ timeout: 15000 });
  });

  test('TC-002: Edit an Existing Opportunity and Verify Changes Are Saved', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const opportunityDetailPage = new OpportunityDetailPage(page);

    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Navigate to the opportunity created in TC-001
    await page.goto(`${BASE_URL}/lightning/o/Opportunity/list`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: createdOpportunityName }).first().click();
    await opportunityDetailPage.assertPageLoaded();

    // Inline-edit the Stage field
    await page.getByRole('button', { name: /Edit Stage/i }).click();
    const stageCombobox = page.getByRole('combobox', { name: 'Stage' }).first();
    await stageCombobox.click();
    await page.getByRole('option', { name: 'Quote pending' }).first().click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Verify the Stage field shows the updated value
    await opportunityDetailPage.assertStage('Quote pending');
  });

  test('TC-003: Attempt to Create Opportunity with Missing Required Field (Name)', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();

    await openNewOpportunityForm(page);

    // Deliberately leave Name empty — fill Stage and Close Date only
    const stageCombobox = page.getByRole('combobox', { name: 'Stage' }).first();
    await stageCombobox.click();
    await page.getByRole('option', { name: 'Enquiry' }).first().click();

    const closeDateInput = page.getByRole('textbox', { name: /Close Date/i });
    await closeDateInput.fill('31/12/2026');
    await closeDateInput.press('Tab');

    // Attempt to submit without Name
    const saveAndNextBtn = page.getByRole('button', { name: 'Save & Next', exact: true });
    if (await saveAndNextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveAndNextBtn.click();
    } else {
      await page.getByRole('button', { name: 'Save', exact: true }).click();
    }

    // Verify: form stays open with inline validation error on Name field
    await expect(page.locator('.slds-has-error').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.slds-modal__container')).toBeVisible({ timeout: 5000 });
  });

});
