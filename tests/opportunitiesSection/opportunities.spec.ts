import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { OpportunitiesPage } from '../../pages/OpportunitiesPage';

const USERNAME = process.env.STAGING_USER || 'yogesh.kumar@bughunters.io';
const PASSWORD = process.env.STAGING_PASSWORD || 'Bughunters@1234567890';

test.describe('Opportunities Section', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(USERNAME, PASSWORD);
    await loginPage.assertLoginSuccess();

    const oppsPage = new OpportunitiesPage(page);
    await oppsPage.navigateToList();
  });

  // ─── TC-001: Create a new Opportunity with valid data ───────────────────────
  test('TC-001: Create a new Opportunity with valid data', async ({ page }) => {
    const oppsPage = new OpportunitiesPage(page);

    await oppsPage.clickNew();
    await oppsPage.selectRecordType();
    await oppsPage.fillOpportunityName('Test Opportunity Q3 BUG406');
    await oppsPage.selectStage('Enquiry');
    await oppsPage.fillCloseDate('31/12/2026');
    await oppsPage.saveOpportunity();

    await oppsPage.assertPageLoaded();
    await oppsPage.assertOpportunityName('Test Opportunity Q3 BUG406');
  });

  // ─── TC-002: Edit an existing Opportunity — update Stage and Amount ─────────
  test('TC-002: Edit an existing Opportunity — update Stage and Amount', async ({ page }) => {
    const oppsPage = new OpportunitiesPage(page);

    // Create a fresh opportunity to edit (ensures test isolation)
    await oppsPage.clickNew();
    await oppsPage.selectRecordType();
    await oppsPage.fillOpportunityName('Edit Stage Opp BUG406');
    await oppsPage.selectStage('Enquiry');
    await oppsPage.fillCloseDate('31/12/2026');
    await oppsPage.saveOpportunity();
    await oppsPage.assertPageLoaded();

    // Open the edit modal from the detail page
    const editBtn = page.getByRole('button', { name: 'Edit', exact: true });
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();

    const editModal = page.locator('.slds-modal');
    await expect(editModal).toBeVisible({ timeout: 20000 });

    // Update Stage to Enquiry
    const stageBtn = editModal.locator('button[aria-label="Stage"]').first();
    await expect(stageBtn).toBeVisible({ timeout: 10000 });
    await stageBtn.click();
    await page.getByRole('option', { name: 'Enquiry', exact: true }).click({ timeout: 10000 });

    // Update Amount (field may not be on all record layouts)
    const amountInput = editModal.locator('input[name="Amount"]').first();
    if (await amountInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await amountInput.click({ clickCount: 3 });
      await amountInput.fill('75000');
    }

    // Save
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Assert: edit modal closed, no error toast
    await expect(editModal).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('.slds-notify--error')).not.toBeVisible({ timeout: 5000 });
  });

  // ─── TC-003: Negative — create Opportunity with missing required Close Date ──
  test('TC-003: Attempt to create Opportunity with missing required Close Date (negative)', async ({ page }) => {
    const oppsPage = new OpportunitiesPage(page);

    await oppsPage.clickNew();
    await oppsPage.selectRecordType();
    await oppsPage.fillOpportunityName('Neg Test Opp BUG406');
    await oppsPage.selectStage('Enquiry');
    // Intentionally omit fillCloseDate() to trigger required-field validation
    await oppsPage.saveOpportunity();

    // Assert: inline validation error is visible (.slds-has-error or aria-invalid)
    await expect(
      page.locator('.slds-has-error, [aria-invalid="true"]').first()
    ).toBeVisible({ timeout: 10000 });
  });
});
