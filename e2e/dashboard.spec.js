const { test, expect } = require('@playwright/test');
const { ADMIN, USER, login } = require('./helpers');

test.describe('대시보드', () => {
  test('관리자 대시보드 - 모든 섹션 표시', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page.getByRole('heading', { name: /안녕하세요/i })).toBeVisible();
    // 관리자 사이드바 메뉴 확인 (button으로 구현됨, exact 필요)
    await expect(page.getByRole('button', { name: '사용자 관리', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '권한 관리', exact: true })).toBeVisible();
  });

  test('일반 사용자 대시보드 - 관리자 메뉴 없음', async ({ page }) => {
    await login(page, USER);
    await expect(page.getByRole('heading', { name: /안녕하세요/i })).toBeVisible();
    await expect(page.getByRole('button', { name: '사용자 관리', exact: true })).not.toBeVisible();
  });

  test('사이드바 주요 메뉴 표시', async ({ page }) => {
    await login(page, USER);
    await expect(page.getByRole('button', { name: '자산 관리', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '회의실 예약', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '법인차량 예약', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '마이페이지', exact: true })).toBeVisible();
  });
});
