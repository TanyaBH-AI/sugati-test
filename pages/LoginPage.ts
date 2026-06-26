import { Page, expect } from '@playwright/test';

const BASE_URL = (process.env.PLAYWRIGHT_BASE_URL || 'https://sugatidevqa-dev-ed.lightning.force.com').replace(/\/$/, '');

export class LoginPage {
  private readonly page: Page;

  // Salesforce standard login selectors (used for invalid-credential UI path)
  private readonly usernameInput = '#username';
  private readonly passwordInput = '#password';
  private readonly loginButton = '#Login';
  private readonly loginError = '#error';

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Obtain a Salesforce session ID via SOAP login API.
   * This bypasses the "Verify Your Identity" MFA challenge that triggers for
   * headless browser sessions. Throws if the credentials are invalid.
   */
  private async getSalesforceSessionId(username: string, password: string): Promise<string> {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:partner.soap.sforce.com">
  <soapenv:Body>
    <urn:login>
      <urn:username>${username}</urn:username>
      <urn:password>${password}</urn:password>
    </urn:login>
  </soapenv:Body>
</soapenv:Envelope>`;

    const response = await fetch('https://login.salesforce.com/services/Soap/u/58.0', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': 'login' },
      body: soapEnvelope,
    });

    const text = await response.text();

    // SOAP faults (invalid credentials, locked account, etc.) contain <faultcode>
    if (text.includes('<faultcode>') || text.includes('<faultstring>')) {
      const faultMatch = text.match(/<faultstring>(.*?)<\/faultstring>/s);
      throw new Error(`Salesforce SOAP login failed: ${faultMatch?.[1] ?? 'unknown error'}`);
    }

    const sessionIdMatch = text.match(/<sessionId>(.*?)<\/sessionId>/);
    if (!sessionIdMatch) {
      throw new Error(`Salesforce SOAP login: unexpected response — no sessionId found`);
    }
    return sessionIdMatch[1];
  }

  async navigate(): Promise<void> {
    await this.page.goto('/');
    // Salesforce redirects unauthenticated requests to the login page
    await this.page.waitForSelector(this.usernameInput, { timeout: 30000 });
  }

  /**
   * Log in to Salesforce.
   * - Valid credentials: uses SOAP API + frontdoor.jsp to bypass MFA for automated sessions.
   * - Invalid credentials: SOAP call throws, falls back to UI login so the error
   *   message is visible for assertLoginFailure().
   */
  async login(username: string, password: string): Promise<void> {
    try {
      const sessionId = await this.getSalesforceSessionId(username, password);
      // frontdoor.jsp exchanges a valid session ID for a browser session — no MFA prompt
      await this.page.goto(`${BASE_URL}/secur/frontdoor.jsp?sid=${sessionId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
    } catch {
      // SOAP login failed (wrong password) — fall through to UI to show the error message
      await this.page.fill(this.usernameInput, username);
      await this.page.fill(this.passwordInput, password);
      await this.page.click(this.loginButton);
    }
  }

  async assertLoginSuccess(): Promise<void> {
    // frontdoor.jsp navigates directly to Lightning; URL will contain lightning.force.com
    await this.page.waitForURL(/.*lightning\.force\.com.*/, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/.*lightning\.force\.com.*/);
  }

  async assertLoginFailure(): Promise<void> {
    // After UI login with invalid credentials, Salesforce shows #error on the login page
    const errorElement = this.page.locator(this.loginError);
    await expect(errorElement).toBeVisible({ timeout: 15000 });
    await expect(this.page).toHaveURL(/.*salesforce\.com.*/);
  }
}
