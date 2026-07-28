# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should show error for invalid credentials
- Location: tests\e2e\auth.spec.ts:12:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:5174/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e7]:
      - generic [ref=e9]:
        - img "SARAL Logo" [ref=e10]
        - heading "Welcome to SARAL" [level=2] [ref=e11]
        - paragraph [ref=e12]: Your complete school management solution
        - generic [ref=e13]:
          - generic [ref=e14]:
            - img [ref=e16]
            - generic [ref=e23]: Streamlined school administration
          - generic [ref=e24]:
            - img [ref=e26]
            - generic [ref=e29]: Comprehensive academic tracking
          - generic [ref=e30]:
            - img [ref=e32]
            - generic [ref=e37]: Complete student management
      - generic [ref=e40]:
        - generic [ref=e41]:
          - heading "Sign in to your account" [level=1] [ref=e42]
          - paragraph [ref=e43]: Enter your credentials to access your dashboard
        - generic [ref=e44]:
          - generic [ref=e45]:
            - text: Username
            - textbox "Username" [ref=e46]:
              - /placeholder: Enter your username
          - generic [ref=e47]:
            - generic [ref=e49]: Password
            - textbox "Password" [ref=e50]:
              - /placeholder: ••••••••
          - generic [ref=e51]:
            - checkbox "Remember me !" [ref=e52] [cursor=pointer]
            - checkbox
            - generic [ref=e53]: Remember me !
          - button "Sign In" [ref=e54] [cursor=pointer]:
            - img
            - text: Sign In
    - generic [ref=e55]: © 2026 SARAL School Management System. All rights reserved.
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   test('should display login page', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     // Check for unique text on the page
  7  |     await expect(page.getByText(/sign in to your account/i)).toBeVisible();
  8  |     await expect(page.getByPlaceholder(/enter your username/i)).toBeVisible();
  9  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  10 |   });
  11 | 
  12 |   test('should show error for invalid credentials', async ({ page }) => {
> 13 |     await page.goto('/');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  14 |     await page.getByPlaceholder(/enter your username/i).fill('wronguser');
  15 |     await page.locator('input[type="password"]').fill('wrongpassword');
  16 |     await page.getByRole('button', { name: /sign in/i }).click();
  17 |     
  18 |     // The API request might take a second, so we wait for the toast message
  19 |     await expect(page.getByText('Login Failed', { exact: true })).toBeVisible();
  20 |   });
  21 | });
  22 | 
```