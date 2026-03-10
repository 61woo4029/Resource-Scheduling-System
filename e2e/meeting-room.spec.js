const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');
const dayjs = require('dayjs');

test.describe('회의실 예약', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '회의실 예약', exact: true }).click();
    await expect(page.getByRole('heading', { name: /회의실 예약/i })).toBeVisible();
    // 예약 데이터가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
  });

  test('회의실 예약 페이지 로드 및 표 표시', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: '시간' })).toBeVisible();
    await expect(page.getByRole('table').last()).toBeVisible();
  });

  test('일별/주별 탭 전환', async ({ page }) => {
    const weekTab = page.getByRole('tab', { name: /주별/i }).first();
    if (await weekTab.isVisible()) {
      await weekTab.click();
      await expect(weekTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  // 빈 셀 찾기: 자식 요소가 없는 셀 = 예약 없는 슬롯 (데이터 로드 후)
  function getEmptyCell(page) {
    const schedulerTable = page.getByRole('table').last();
    return schedulerTable.locator('tbody td:not(:first-child):not(:has(*))').first();
  }

  test('빈 슬롯 클릭 시 예약 다이얼로그 표시', async ({ page }) => {
    await getEmptyCell(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('필수값 미입력 시 경고', async ({ page }) => {
    await getEmptyCell(page).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /예약$/i }).click();
    await expect(page.getByText(/입력해주세요/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('예약 생성 후 표에 표시', async ({ page }) => {
    const uniqueTitle = `테스트회의_${Date.now().toString().slice(-6)}`;

    await getEmptyCell(page).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 회의실 선택 (이미 선택되어 있을 수 있지만 확인)
    const roomSelect = dialog.locator('[role="combobox"]').first();
    const roomValue = await roomSelect.textContent();
    if (!roomValue?.trim()) {
      await roomSelect.click();
      await page.getByRole('option').first().click();
    }

    // 제목 입력 (유니크한 제목)
    await dialog.getByLabel(/회의 제목/i).fill(uniqueTitle);

    // 참석 인원
    await dialog.getByLabel(/참석 인원/i).fill('3');

    await dialog.getByRole('button', { name: /예약$/i }).click();

    // 성공 메시지 확인
    await expect(page.getByText(/예약이 완료되었습니다/i)).toBeVisible({ timeout: 10000 });
  });
});
