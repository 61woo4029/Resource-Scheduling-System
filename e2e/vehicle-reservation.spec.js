const { test, expect } = require('@playwright/test');
const { login } = require('./helpers');
const dayjs = require('dayjs');

test.describe('법인차량 예약', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: '법인차량 예약', exact: true }).click();
    await expect(page.getByRole('heading', { name: /법인차량 예약/i })).toBeVisible();
  });

  test('법인차량 예약 페이지 로드 및 차량 목록 표시', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '시간' })).toBeVisible();
  });

  test('일별/주별 탭 전환', async ({ page }) => {
    await page.getByRole('tab', { name: '주별' }).click();
    await expect(page.getByRole('tab', { name: '주별' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: '일별' }).click();
    await expect(page.getByRole('tab', { name: '일별' })).toHaveAttribute('aria-selected', 'true');
  });

  test('예약하기 버튼 클릭 시 다이얼로그 표시', async ({ page }) => {
    await page.getByRole('button', { name: /예약하기/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // 다이얼로그 내 제목 확인 (strict mode 방지를 위해 dialog 스코프 사용)
    await expect(page.getByRole('dialog').getByRole('heading', { name: '차량 예약' })).toBeVisible();
  });

  test('필수값 미입력 시 경고 알림 표시', async ({ page }) => {
    await page.getByRole('button', { name: /예약하기/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /저장/i }).click();
    // 필수값 경고 스낵바 표시 확인
    await expect(page.getByText(/입력해주세요/i)).toBeVisible({ timeout: 10000 });
  });

  test('예약 생성 후 표에 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /예약하기/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 차량 선택 - combobox 직접 클릭
    await dialog.locator('[role="combobox"]').click();
    await page.getByRole('option').first().click();

    // 오늘 날짜
    const today = dayjs().format('YYYY-MM-DD');
    await dialog.getByLabel(/예약일/i).fill(today);

    // Date.now() 기반 유니크 시간 슬롯 (30분 단위, 08:00~18:30 중 하나)
    const slotIndex = Date.now() % 22;
    const slotHour = 8 + Math.floor(slotIndex / 2);
    const slotMin = (slotIndex % 2) === 0 ? '00' : '30';
    const startTime = `${String(slotHour).padStart(2, '0')}:${slotMin}`;
    const endHour = slotMin === '30' ? slotHour + 1 : slotHour;
    const endMin = slotMin === '30' ? '00' : '30';
    const endTime = `${String(endHour).padStart(2, '0')}:${endMin}`;

    await dialog.getByLabel(/시작 시간/i).fill(startTime);
    await dialog.getByLabel(/종료 시간/i).fill(endTime);

    // 목적 입력 (유니크 텍스트로 충돌 방지)
    const uniquePurpose = `출장_${Date.now().toString().slice(-5)}`;
    await dialog.getByLabel(/목적/i).fill(uniquePurpose);

    // 행선지 입력
    await dialog.getByLabel(/행선지/i).fill('서울');

    await dialog.getByRole('button', { name: /저장/i }).click();

    // 성공 알림 및 오늘 날짜 표에서 예약 확인
    await expect(page.getByText(/예약이 완료되었습니다/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(uniquePurpose)).toBeVisible({ timeout: 5000 });
  });

  test('날짜 이동 버튼 동작', async ({ page }) => {
    const dateBtn = page.locator('button').filter({ hasText: /\d{4}년/ }).first();
    const initialText = await dateBtn.textContent();
    // 날짜 버튼 바로 다음 버튼(다음 날짜로 이동 버튼) 클릭
    await dateBtn.locator('xpath=following-sibling::button[1]').click();
    const nextText = await dateBtn.textContent();
    expect(initialText).not.toBe(nextText);
  });
});
