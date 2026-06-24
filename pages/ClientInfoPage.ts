import { Page, expect } from '@playwright/test';

export class ClientInfoPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async fillFirstName(name: string): Promise<void> {
    const firstNameInput = this.page.locator('input[type="text"]:not([readonly])').nth(0);
    await expect(firstNameInput).toBeVisible({ timeout: 15000 });
    await firstNameInput.fill(name);
  }

  async fillLastName(name: string): Promise<void> {
    const lastNameInput = this.page.locator('input[type="text"]:not([readonly])').nth(1);
    await expect(lastNameInput).toBeVisible({ timeout: 15000 });
    await lastNameInput.fill(name);
  }

  async clickAddDetails(): Promise<void> {
    const addDetailsBtn = this.page.locator('button:has-text("Add Details")');
    await expect(addDetailsBtn).toBeVisible({ timeout: 15000 });
    await addDetailsBtn.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  async clickSaveAndClose(): Promise<void> {
    const saveCloseBtn = this.page.locator('button:has-text("Save & Close")');
    await expect(saveCloseBtn).toBeVisible({ timeout: 15000 });
    await saveCloseBtn.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  async clickSaveAndNext(): Promise<void> {
    const saveNextBtn = this.page.locator('button:has-text("Save & Next")');
    await expect(saveNextBtn).toBeVisible({ timeout: 15000 });
    await saveNextBtn.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }
}
