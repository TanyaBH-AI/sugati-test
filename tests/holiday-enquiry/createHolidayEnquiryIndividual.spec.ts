import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HolidayEnquiryPage } from '../../pages/HolidayEnquiryPage';
import { ClientInfoPage } from '../../pages/ClientInfoPage';
import { OpportunityFormPage } from '../../pages/OpportunityFormPage';
import { GroupMemberPage } from '../../pages/GroupMemberPage';
import { OpportunityRecordPage } from '../../pages/OpportunityRecordPage';

const STAGING_USER = process.env.STAGING_USER || '';
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || '';

/**
 * Returns a date N days from now in "DD Mon YYYY" format (e.g. "26 Jul 2026").
 */
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

test.describe('Create Holiday Enquiry - Individual', () => {
  let loginPage: LoginPage;
  let holidayEnquiryPage: HolidayEnquiryPage;
  let clientInfoPage: ClientInfoPage;
  let opportunityFormPage: OpportunityFormPage;
  let groupMemberPage: GroupMemberPage;
  let opportunityRecordPage: OpportunityRecordPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    holidayEnquiryPage = new HolidayEnquiryPage(page);
    clientInfoPage = new ClientInfoPage(page);
    opportunityFormPage = new OpportunityFormPage(page);
    groupMemberPage = new GroupMemberPage(page);
    opportunityRecordPage = new OpportunityRecordPage(page);
  });

  test('TC-01: Create individual holiday enquiry with valid client and opportunity details', async ({ page }) => {
    // Step 1-3: Login
    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Step 4-5: Navigate to Holiday Enquiry V2 and select Individual
    await holidayEnquiryPage.navigate();
    await holidayEnquiryPage.selectIndividual();

    // Step 6: Assert Client Info form is visible
    await expect(page.locator('select[name="salutation"]')).toBeVisible({ timeout: 15000 });

    // Step 7-9: Fill client information
    await clientInfoPage.fillSalutation('Mr.');
    await clientInfoPage.fillFirstName('TEST93166780');
    await clientInfoPage.fillLastName('Art27260');

    // Step 10: Click Search
    await clientInfoPage.clickSearch();

    // Step 11: Conditional — if Save & Close is visible, click it
    const saveAndCloseBtn = page.getByRole('button', { name: 'Save & Close', exact: true });
    if (await saveAndCloseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientInfoPage.clickSaveAndClose();
    }

    // Step 12: Click Save & Next
    await clientInfoPage.clickSaveAndNext();

    // Step 13: Assert Opportunity form loaded
    await opportunityFormPage.assertPageLoaded();

    // Step 14: Select Holiday Type
    await opportunityFormPage.selectHolidayType('Generic');

    // Step 15: Select Currency
    await opportunityFormPage.selectCurrency('USD');

    // Step 16: Fill Departure Date (30 days from now)
    await opportunityFormPage.fillDepartureDate(getFutureDate(30));

    // Step 17: Fill Nights
    await opportunityFormPage.fillNights('5');

    // Step 18: Verify Return Date is auto-populated
    const returnDate = await opportunityFormPage.getReturnDate();
    expect(returnDate).not.toBe('');

    // Step 19: Click Save & Next on Opportunity form
    await opportunityFormPage.clickSaveAndNext();

    // Step 20: Assert Group Members page loaded
    await groupMemberPage.assertPageLoaded();

    // Step 21: Click Save & Go to Opportunity
    await groupMemberPage.clickSaveAndGoToOpportunity();

    // Step 22: Assert Opportunity Record page loaded
    await opportunityRecordPage.assertPageLoaded();

    // Step 23: Assert URL contains /Opportunity/
    await expect(page).toHaveURL(/\/Opportunity\//);
  });
});
