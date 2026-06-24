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

    // Login via SOAP API bypass
    await loginPage.navigate();
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await loginPage.assertLoginSuccess();
  });

  test('TC-01: Happy path — create opportunity with valid details', async ({ page }) => {
    // Step 1: Navigate to Holiday Enquiry V2 and select Individual
    await holidayEnquiryPage.navigate();
    await holidayEnquiryPage.selectIndividual();

    // Step 2: Fill client information
    await clientInfoPage.fillFirstName('TEST93166768');
    await clientInfoPage.fillLastName('Art27267');
    await clientInfoPage.clickAddDetails();
    await clientInfoPage.clickSaveAndClose();
    await clientInfoPage.clickSaveAndNext();

    // Step 3: Fill opportunity form
    await opportunityFormPage.assertHolidayTypePreFilled();
    await opportunityFormPage.selectCurrency('USD');
    await opportunityFormPage.fillDepartureDate('25 Dec 2026');
    await opportunityFormPage.fillNights('5');

    // Step 4: Verify return date auto-populates
    const returnDate = await opportunityFormPage.getReturnDate();
    expect(returnDate).toBeTruthy();

    // Step 5: Proceed to Group Members
    await opportunityFormPage.clickSaveAndNext();
    await groupMemberPage.assertPageLoaded();

    // Step 6: Save and navigate to Opportunity record
    await groupMemberPage.clickSaveAndGoToOpportunity();
    await opportunityRecordPage.assertPageLoaded();
  });

  test('TC-02: Negative — past departure date shows validation error', async ({ page }) => {
    // Navigate to Holiday Enquiry V2 and select Individual
    await holidayEnquiryPage.navigate();
    await holidayEnquiryPage.selectIndividual();

    // Fill client information (same flow as happy path)
    await clientInfoPage.fillFirstName('TEST93166768');
    await clientInfoPage.fillLastName('Art27267');
    await clientInfoPage.clickAddDetails();
    await clientInfoPage.clickSaveAndClose();
    await clientInfoPage.clickSaveAndNext();

    // Fill opportunity form with a PAST departure date
    await opportunityFormPage.assertHolidayTypePreFilled();
    await opportunityFormPage.selectCurrency('USD');
    await opportunityFormPage.fillDepartureDate('1 Jan 2026');
    await opportunityFormPage.fillNights('5');

    // Attempt to proceed — should show validation error
    await opportunityFormPage.clickSaveAndNext();

    // Verify validation error is displayed
    // NOTE: If no error appears, this may be a known bug (AB-35)
    await opportunityFormPage.assertValidationError();
  });
});
