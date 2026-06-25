import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HolidayEnquiryPage } from '../../pages/HolidayEnquiryPage';
import { ClientInfoPage } from '../../pages/ClientInfoPage';
import { OpportunityFormPage } from '../../pages/OpportunityFormPage';
import { GroupMemberPage } from '../../pages/GroupMemberPage';
import { OpportunityRecordPage } from '../../pages/OpportunityRecordPage';

const VALID_USERNAME = process.env.STAGING_USER || 'yogesh.kumar@bughunters.io';
const VALID_PASSWORD = process.env.STAGING_PASSWORD || 'Bughunters@1234567890';

test.describe('Opportunity Creation — Holiday Enquiry V2', () => {
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

  test('Happy path — create opportunity with valid client and booking details', async ({ page }) => {
    // Steps 1-2: Login and verify
    await loginPage.navigate();
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Step 3: Navigate to Holiday Enquiry V2
    await holidayEnquiryPage.navigate();

    // Step 4: Select Individual booking type
    await holidayEnquiryPage.selectIndividual();

    // Step 5: Client information form should be visible
    await expect(page.locator('input[type="text"]:not([readonly])').first()).toBeVisible({ timeout: 15000 });

    // Step 6: Fill salutation
    await clientInfoPage.fillSalutation('Mr');

    // Step 7: Fill first name
    await clientInfoPage.fillFirstName('TEST93166769');

    // Step 8: Fill last name
    await clientInfoPage.fillLastName('Art27269');

    // Step 9: Click search button
    await clientInfoPage.clickSearch();

    // Step 10: Click save and next
    await clientInfoPage.clickSaveAndNext();

    // Step 11: Opportunity page should be visible
    await opportunityFormPage.assertHolidayTypePreFilled();

    // Step 12: Select "Generic" from holiday type
    await opportunityFormPage.selectHolidayType('Generic');

    // Step 13: Select "USD" from Booking currency
    await opportunityFormPage.selectCurrency('USD');

    // Step 14: Select a future departure date
    const futureDate = getFutureDate(30);
    await opportunityFormPage.fillDepartureDate(futureDate);

    // Step 15: Enter 5 nights
    await opportunityFormPage.fillNights('5');

    // Step 16: Verify the return date is auto-populated
    const returnDate = await opportunityFormPage.getReturnDate();
    expect(returnDate).toBeTruthy();

    // Step 17: Click save and next
    await opportunityFormPage.clickSaveAndNext();

    // Step 18: Group member page should be visible
    await groupMemberPage.assertPageLoaded();

    // Step 19: Verify valid details are displayed
    await expect(page.getByText('Group Members', { exact: true })).toBeVisible();

    // Step 20: Click save and go to opportunity
    await groupMemberPage.clickSaveAndGoToOpportunity();

    // Steps 21-22: Opportunity record page should be visible with entered details
    await opportunityRecordPage.assertPageLoaded();
    await expect(page).toHaveURL(/\/Opportunity\//);
  });
});

/**
 * Returns a date string N days in the future formatted as "DD MMM YYYY"
 * (e.g. "25 Jul 2026") — the format Salesforce Lightning datepicker expects.
 */
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
