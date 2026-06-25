import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HolidayEnquiryPage } from '../../pages/HolidayEnquiryPage';
import { ClientInfoPage } from '../../pages/ClientInfoPage';
import { OpportunityFormPage } from '../../pages/OpportunityFormPage';
import { GroupMemberPage } from '../../pages/GroupMemberPage';
import { OpportunityRecordPage } from '../../pages/OpportunityRecordPage';

const STAGING_USER = process.env.STAGING_USER || '';
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || '';

function randomName(prefix: string): string {
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  const digits = Math.floor(10000 + Math.random() * 90000).toString();
  return `${prefix}${letters}${digits}`;
}

function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

test.describe('Holiday Enquiry V2 — Create Opportunity', () => {
  let loginPage: LoginPage;
  let holidayEnquiryPage: HolidayEnquiryPage;
  let clientInfoPage: ClientInfoPage;
  let opportunityFormPage: OpportunityFormPage;
  let groupMemberPage: GroupMemberPage;
  let opportunityRecordPage: OpportunityRecordPage;

  const firstName = randomName('TEST');
  const lastName = randomName('Art');
  const departureDate = getFutureDate(30);

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    holidayEnquiryPage = new HolidayEnquiryPage(page);
    clientInfoPage = new ClientInfoPage(page);
    opportunityFormPage = new OpportunityFormPage(page);
    groupMemberPage = new GroupMemberPage(page);
    opportunityRecordPage = new OpportunityRecordPage(page);
  });

  test('should create an opportunity via Individual booking flow', async ({ page }) => {
    // Step 1-2: Login and verify
    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Step 3: Navigate to Holiday Enquiry V2
    await holidayEnquiryPage.navigate();

    // Step 4: Select Individual booking type
    await holidayEnquiryPage.selectIndividual();

    // Step 5-6: Fill client information
    await clientInfoPage.fillSalutation('Mr.');
    await clientInfoPage.fillFirstName(firstName);
    await clientInfoPage.fillLastName(lastName);

    // Step 9: Click Search (scoped to form)
    await clientInfoPage.clickSearch();

    // Step 10: Handle Save & Close (conditional) then Save & Next
    const saveAndCloseBtn = page.getByRole('button', { name: 'Save & Close', exact: true });
    if (await saveAndCloseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clientInfoPage.clickSaveAndClose();
    }
    await clientInfoPage.clickSaveAndNext();

    // Step 11: Opportunity page should be visible
    await opportunityFormPage.assertPageLoaded();

    // Step 12: Select Generic holiday type
    await opportunityFormPage.selectHolidayType('Generic');

    // Step 13: Select USD booking currency
    await opportunityFormPage.selectCurrency('USD');

    // Step 14: Select future departure date
    await opportunityFormPage.fillDepartureDate(departureDate);

    // Step 15: Enter 5 nights
    await opportunityFormPage.fillNights('5');

    // Step 16: Verify return date is auto-populated
    const returnDate = await opportunityFormPage.getReturnDate();
    expect(returnDate).not.toBe('');

    // Step 17: Save & Next to Group Members
    await opportunityFormPage.clickSaveAndNext();

    // Step 18: Group member page should be visible
    await groupMemberPage.assertPageLoaded();

    // Step 19-20: Save & Go to Opportunity
    await groupMemberPage.clickSaveAndGoToOpportunity();

    // Step 21-22: Verify Opportunity record page
    await opportunityRecordPage.assertPageLoaded();
  });
});
