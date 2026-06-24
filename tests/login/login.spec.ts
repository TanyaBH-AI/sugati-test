import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

const VALID_USERNAME = process.env.STAGING_USER || 'yogesh.kumar@bughunters.io';
const VALID_PASSWORD = process.env.STAGING_PASSWORD || 'Bughunters@1234567890';
const INVALID_PASSWORD = 'WrongPassword123!';

test.describe('Salesforce Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('TC-01: Valid login navigates to Lightning dashboard', async () => {
    await loginPage.login(VALID_USERNAME, VALID_PASSWORD);
    await loginPage.assertLoginSuccess();
  });

  test('TC-02: Invalid password shows error and stays on login page', async () => {
    await loginPage.login(VALID_USERNAME, INVALID_PASSWORD);
    await loginPage.assertLoginFailure();
  });
});
