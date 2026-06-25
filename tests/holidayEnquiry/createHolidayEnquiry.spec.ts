import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HolidayEnquiryPage } from '../../pages/HolidayEnquiryPage';
import { ClientInfoPage } from '../../pages/ClientInfoPage';
import { OpportunityFormPage } from '../../pages/OpportunityFormPage';
import { GroupMemberPage } from '../../pages/GroupMemberPage';
import { OpportunityRecordPage } from '../../pages/OpportunityRecordPage';

const VALID_USERNAME = process.env.STAGING_USER || 'yogesh.kumar@bughunters.io';
const VALID_PASSWORD = process.env.STAGING_PASSWORD || 'Bughunters@1234567890';

function randomName(): string {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const letters = Array.from({ length: 4 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join('');
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `${letters}${digits}`;
}

function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

test.describe('Create Holiday Enquiry (Individual)', () => {
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

  test('TC-01: Create Individual Holiday Enquiry happy path', async ({ page }) => {
    // Step 1: Login via SOAP
    await loginPage.navigate();
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Step 2: Navigate to Holiday Enquiry V2
    await holidayEnquiryPage.navigate();

    // Step 3: Select Individual from Booking Type modal
    await holidayEnquiryPage.selectIndividual();

    // Step 4: Verify Client Information form is displayed
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 15000 });

    // Steps 5-6: Fill client information (salutation skipped per user request)
    const firstName = randomName();
    const lastName = randomName();
    await clientInfoPage.fillFirstName(firstName);
    await clientInfoPage.fillLastName(lastName);

    // Step 8: Click Search
    await clientInfoPage.clickSearch();

    // Step 9: Click Save & Close (only if visible — random names may not match existing clients)
    const saveAndCloseBtn = page.getByRole('button', { name: 'Save & Close', exact: true });
    if (await saveAndCloseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientInfoPage.clickSaveAndClose();
    }

    // Step 10: Click Save & Next
    await clientInfoPage.clickSaveAndNext();

    // Step 11: Verify Opportunity page is displayed (holiday type field visible)
    await opportunityFormPage.assertHolidayTypePreFilled();

    // Step 12: Select Holiday Type: Generic
    await opportunityFormPage.selectHolidayType('Generic');

    // Step 13: Select Booking Currency: USD
    await opportunityFormPage.selectCurrency('USD');

    // Step 14: Fill Departure Date (30 days from now)
    const departureDate = getFutureDate(30);
    await opportunityFormPage.fillDepartureDate(departureDate);

    // Step 15: Fill Nights: 5
    await opportunityFormPage.fillNights('5');

    // Step 16: Verify Return Date is auto-populated
    const returnDate = await opportunityFormPage.getReturnDate();
    expect(returnDate).not.toBe('');

    // Step 17: Click Save & Next
    await opportunityFormPage.clickSaveAndNext();

    // Step 18: Verify Group Members page is displayed
    await groupMemberPage.assertPageLoaded();

    // Step 19: Click Save & Go to Opportunity
    await groupMemberPage.clickSaveAndGoToOpportunity();

    // Step 20: Verify Opportunity record page is displayed
    await opportunityRecordPage.assertPageLoaded();

    // Step 21: Verify previously entered details are saved (URL contains /Opportunity/)
    await expect(page).toHaveURL(/\/Opportunity\//);
  });
});
