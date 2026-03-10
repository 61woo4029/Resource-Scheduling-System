const { test, expect } = require('@playwright/test');
const { ADMIN, USER, login, logout } = require('./helpers');

test.describe('인증', () => {
  test('관리자 로그인 성공 후 대시보드 이동', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { name: /안녕하세요/i })).toBeVisible();
  });

  test('일반 사용자 로그인 성공', async ({ page }) => {
    await login(page, USER);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/이메일/i).fill(ADMIN.email);
    await page.getByLabel(/비밀번호/i).fill('wrongpassword');
    await page.getByRole('button', { name: /로그인/i }).click();
    // 로그인 페이지에 머물며 오류 메시지 표시
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('비로그인 상태에서 대시보드 접근 시 로그인 페이지로 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('로그아웃 후 로그인 페이지 이동', async ({ page }) => {
    await login(page, USER);
    await logout(page);
    await expect(page).toHaveURL(/login/);
  });
});
