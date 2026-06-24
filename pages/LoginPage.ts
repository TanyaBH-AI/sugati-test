import { Page, expect } from '@playwright/test';

export class LoginPage {
  private readonly page: Page;

  // Salesforce standard login selectors
  private readonly usernameInput = '#username';
  private readonly passwordInput = '#password';
  private readonly loginButton = '#Login';
  private readonly loginError = '#error';

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto('/');
    // Salesforce redirects to the login page — wait for the username field
    await this.page.waitForSelector(this.usernameInput, { timeout: 30000 });
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.fill(this.usernameInput, username);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
  }

  async assertLoginSuccess(): Promise<void> {
    // After successful Salesforce login, the URL changes to a Lightning page
    // Wait for navigation away from the login domain
    await this.page.waitForURL(/.*lightning\.force\.com.*/, { timeout: 60000 });
    // Verify we're on a Lightning page (home or setup)
    await expect(this.page).toHaveURL(/.*lightning\.force\.com.*/);
  }

  async assertLoginFailure(): Promise<void> {
    // Salesforce shows an error message on failed login
    const errorElement = this.page.locator(this.loginError);
    await expect(errorElement).toBeVisible({ timeout: 15000 });
    // Verify we're still on the login page
    await expect(this.page).toHaveURL(/.*salesforce\.com.*/);
  }
}
