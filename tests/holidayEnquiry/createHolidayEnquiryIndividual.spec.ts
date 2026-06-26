import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HolidayEnquiryPage } from '../../pages/HolidayEnquiryPage';
import { ClientInfoPage } from '../../pages/ClientInfoPage';
import { OpportunityFormPage } from '../../pages/OpportunityFormPage';

const STAGING_USER = process.env.STAGING_USER || '';
const STAGING_PASSWORD = process.env.STAGING_PASSWORD || '';

function randomAlphanumeric(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letter = letters.charAt(Math.floor(Math.random() * letters.length));
  const nums = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
  return letter + nums;
}

function randomFutureDate(): string {
  const today = new Date();
  const daysAhead = 30 + Math.floor(Math.random() * 60);
  const future = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const mm = String(future.getMonth() + 1).padStart(2, '0');
  const dd = String(future.getDate()).padStart(2, '0');
  const yyyy = future.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function addDays(dateStr: string, days: number): string {
  const [mm, dd, yyyy] = dateStr.split('/').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  date.setDate(date.getDate() + days);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

test.describe('Create Holiday Enquiry - Individual', () => {
  let loginPage: LoginPage;
  let holidayEnquiryPage: HolidayEnquiryPage;
  let clientInfoPage: ClientInfoPage;
  let opportunityFormPage: OpportunityFormPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    holidayEnquiryPage = new HolidayEnquiryPage(page);
    clientInfoPage = new ClientInfoPage(page);
    opportunityFormPage = new OpportunityFormPage(page);
  });

  test('should create a holiday enquiry for an individual client', async ({ page }) => {
    // Step 1: Login
    await loginPage.navigate();
    await loginPage.login(STAGING_USER, STAGING_PASSWORD);
    await loginPage.assertLoginSuccess();

    // Step 2: Navigate to Holiday Enquiry V2 and select Individual
    await holidayEnquiryPage.navigate();
    await holidayEnquiryPage.selectIndividual();

    // Step 3: Assert Client Info form is visible
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 15000 });

    // Step 4: Fill First Name and Last Name with random alphanumeric strings
    const firstName = randomAlphanumeric();
    const lastName = randomAlphanumeric();
    await clientInfoPage.fillFirstName(firstName);
    await clientInfoPage.fillLastName(lastName);

    // Step 5: Click Search
    await clientInfoPage.clickSearch();

    // Step 6: Conditional - if Save & Close is visible, click it
    const saveCloseBtn = page.getByRole('button', { name: 'Save & Close', exact: true });
    const isSaveCloseVisible = await saveCloseBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (isSaveCloseVisible) {
      await clientInfoPage.clickSaveAndClose();
    }

    // Step 7: Assert Save & Next button is enabled
    await expect(
      page.getByRole('button', { name: 'Save & Next', exact: true })
    ).toBeEnabled({ timeout: 15000 });

    // Step 8: Click Save & Next to proceed to Opportunity form
    await clientInfoPage.clickSaveAndNext();

    // Step 9: Verify Opportunity form is displayed
    await opportunityFormPage.assertPageLoaded();

    // Step 10: Fill Opportunity form fields
    await opportunityFormPage.selectHolidayType('Generic');
    await opportunityFormPage.selectCurrency('USD');

    const departureDate = randomFutureDate();
    await opportunityFormPage.fillDepartureDate(departureDate);
    await opportunityFormPage.fillNights('5');

    // Step 11: Verify Return Date is auto-populated (departure + 5 nights)
    const returnDate = await opportunityFormPage.getReturnDate();
    const expectedReturn = addDays(departureDate, 5);
    expect(returnDate).toBe(expectedReturn);

    // Step 12: Verify Save & Next button is enabled on Opportunity form
    await opportunityFormPage.assertSaveAndNextEnabled();
  });
});
