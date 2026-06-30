import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { HomePage } from '../../pages/HomePage';

const USERNAME = process.env.STAGING_USER || 'yogesh.kumar@bughunters.io';
const PASSWORD = process.env.STAGING_PASSWORD || 'Bughunters@1234567890';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(USERNAME, PASSWORD);
    await loginPage.assertLoginSuccess();

    const homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  test('TC-001: Home page loads with all expected UI elements', async ({ page }) => {
    // Verify header/logo, nav bar, main content area, and user greeting are all visible
    const homePage = new HomePage(page);
    await homePage.assertAllUIElementsVisible();
  });

  test('TC-002: Navigation links on Home page route to correct sections', async ({ page }) => {
    const homePage = new HomePage(page);

    // Click Opportunities nav link and verify URL routes to Opportunity section
    await homePage.clickNavLink('Opportunities');
    await expect(page).toHaveURL(/\/Opportunity\//i, { timeout: 15000 });

    // Navigate back to Home, then verify Accounts link also routes correctly
    await homePage.navigateToHome();
    await homePage.clickNavLink('Accounts');
    await expect(page).toHaveURL(/\/Account\//i, { timeout: 15000 });
  });

  test('TC-003: Dashboard widgets/summary cards display accurate data', async ({ page }) => {
    // Precondition: at least one record exists in the staging org
    const homePage = new HomePage(page);
    await homePage.assertWidgetsVisible();
    await homePage.assertWidgetsHaveContent();
  });

  test('TC-005: Home page shows appropriate empty state when no data is available', async ({ page }) => {
    // Precondition: user account with no/zero records.
    // Validates that when widgets have no data the page layout remains intact
    // and no raw null/undefined values are rendered.
    const homePage = new HomePage(page);
    await homePage.assertNoLayoutErrors();

    // No widget should render a raw null or undefined value
    await expect(page.getByText('null', { exact: true })).toHaveCount(0);
    await expect(page.getByText('undefined', { exact: true })).toHaveCount(0);
  });
});
