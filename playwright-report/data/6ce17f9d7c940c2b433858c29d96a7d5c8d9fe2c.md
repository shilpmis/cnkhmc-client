# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: students.spec.ts >> Student Management >> should display students page correctly
- Location: tests\e2e\students.spec.ts:19:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /student/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /student/i }).first()

```

```yaml
- img "SARAL Logo"
- heading "Welcome to SARAL" [level=2]
- paragraph: Your complete school management solution
- img
- text: Streamlined school administration
- img
- text: Comprehensive academic tracking
- img
- text: Complete student management
- heading "Sign in to your account" [level=1]
- paragraph: Enter your credentials to access your dashboard
- text: Username
- textbox "Username":
  - /placeholder: Enter your username
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
- checkbox "Remember me !"
- text: Remember me !
- button "Sign In":
  - img
  - text: Sign In
- text: © 2026 SARAL School Management System. All rights reserved.
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Student Management', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Login with the known CNKHMC Admin credentials
  6  |     await page.goto('/');
  7  |     await page.getByPlaceholder(/enter your username/i).fill('cnkhmc_admin');
  8  |     await page.locator('input[type="password"]').fill('12345678');
  9  |     await page.getByRole('button', { name: /sign in/i }).click();
  10 |     
  11 |     // Wait for redirect to the dashboard or students page
  12 |     await expect(page).toHaveURL(/\/d/i, { timeout: 10000 });
  13 |     
  14 |     // Navigate to students page
  15 |     await page.goto('/d/students');
  16 |     await expect(page).toHaveURL(/\/d\/students/i, { timeout: 10000 });
  17 |   });
  18 | 
  19 |   test('should display students page correctly', async ({ page }) => {
> 20 |     await expect(page.getByRole('heading', { name: /student/i }).first()).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  21 |     
  22 |     // Check if the add student button is visible
  23 |     await expect(page.getByRole('button', { name: /add student/i })).toBeVisible();
  24 |   });
  25 | });
  26 | 
```