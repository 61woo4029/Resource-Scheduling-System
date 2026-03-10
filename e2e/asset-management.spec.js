const { test, expect } = require('@playwright/test');
const { ADMIN, USER, login } = require('./helpers');

test.describe('자산 관리', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole('button', { name: '자산 관리', exact: true }).click();
    await expect(page.getByRole('heading', { name: /자산 관리/i })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  // ── 페이지 로드 ────────────────────────────────────────────────────────────

  test('페이지 로드 - 탭 및 테이블 표시', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '데스크탑' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '노트북' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '서버' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '모니터' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '자산관리번호' })).toBeVisible();
  });

  test('탭 전환 - 노트북', async ({ page }) => {
    await page.getByRole('tab', { name: '노트북' }).click();
    await expect(page.getByRole('tab', { name: '노트북' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('모니터 탭 - OS/CPU/RAM 컬럼 미표시', async ({ page }) => {
    await page.getByRole('tab', { name: '모니터' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('columnheader', { name: 'OS' })).not.toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CPU' })).not.toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'RAM' })).not.toBeVisible();
  });

  test('데스크탑 탭 - OS/CPU/RAM 컬럼 표시', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '데스크탑' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('columnheader', { name: 'OS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CPU' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'RAM' })).toBeVisible();
  });

  // ── 관리자 버튼 ───────────────────────────────────────────────────────────

  test('관리자 기능 버튼 표시', async ({ page }) => {
    await expect(page.getByRole('button', { name: /자산 등록/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /일괄 업로드/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /템플릿/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /엑셀 다운로드/i })).toBeVisible();
  });

  test('일반 사용자 - 관리 버튼 미표시', async ({ page }) => {
    // USER 계정으로 재로그인
    await page.goto('/login');
    await login(page, USER);
    await page.getByRole('button', { name: '자산 관리', exact: true }).click();
    await expect(page.getByRole('heading', { name: /자산 관리/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /자산 등록/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /일괄 업로드/i })).not.toBeVisible();
  });

  // ── 자산 등록 ─────────────────────────────────────────────────────────────

  test('자산 등록 다이얼로그 열기', async ({ page }) => {
    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '자산 등록' })).toBeVisible();
    await dialog.getByRole('button', { name: '취소' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('자산 등록 성공', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const uniqueNumber = `TEST-${suffix}`;
    const uniqueSN = `SN-${suffix}`;

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/자산관리번호/i).fill(uniqueNumber);
    await dialog.getByLabel(/사용자명/i).fill('테스터');
    await dialog.getByLabel(/제조사/i).fill('삼성');
    await dialog.getByLabel(/모델명/i).fill('갤럭시북');
    await dialog.getByLabel('S/N').fill(uniqueSN);

    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
    await expect(dialog).not.toBeVisible();
  });

  // ── 자산 수정 ─────────────────────────────────────────────────────────────

  test('자산 수정', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const uniqueNumber = `EDIT-${suffix}`;
    const uniqueSN = `SN-E${suffix}`;

    // 등록
    await page.getByRole('button', { name: /자산 등록/i }).click();
    let dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/자산관리번호/i).fill(uniqueNumber);
    await dialog.getByLabel(/사용자명/i).fill('수정전');
    await dialog.getByLabel('S/N').fill(uniqueSN);
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // 등록된 행의 수정 버튼(첫 번째 아이콘) 클릭
    const row = page.getByRole('row').filter({ hasText: uniqueNumber });
    await row.getByRole('button').first().click();

    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '자산 수정' })).toBeVisible();
    await dialog.getByLabel(/사용자명/i).clear();
    await dialog.getByLabel(/사용자명/i).fill('수정후');
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 수정되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  // ── 자산 삭제 ─────────────────────────────────────────────────────────────

  test('자산 삭제', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const uniqueNumber = `DEL-${suffix}`;
    const uniqueSN = `SN-D${suffix}`;

    // 등록
    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/자산관리번호/i).fill(uniqueNumber);
    await dialog.getByLabel(/사용자명/i).fill('삭제테스트');
    await dialog.getByLabel('S/N').fill(uniqueSN);
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // 삭제 버튼(마지막 아이콘) 클릭 → confirm 수락
    const row = page.getByRole('row').filter({ hasText: uniqueNumber });
    page.once('dialog', d => d.accept());
    await row.getByRole('button').last().click();

    await expect(page.getByText(/삭제되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  // ── 검색 ──────────────────────────────────────────────────────────────────

  test('검색 - 자산관리번호 입력 후 검색', async ({ page }) => {
    await page.getByLabel('자산관리번호').fill('TEST');
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('검색 - 상태 필터 (사용)', async ({ page }) => {
    // 검색 영역의 상태 Select (combobox)
    await page.locator('label').filter({ hasText: /^상태$/ }).locator('xpath=following-sibling::div').click();
    await page.getByRole('option', { name: '사용', exact: true }).click();
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('검색 - 사용자명 입력 후 검색', async ({ page }) => {
    await page.getByLabel('사용자명').fill('관리자');
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('table')).toBeVisible();
  });

  // ── Excel / 업로드 ────────────────────────────────────────────────────────

  test('일괄 업로드 다이얼로그 열기 및 닫기', async ({ page }) => {
    await page.getByRole('button', { name: /일괄 업로드/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '엑셀 업로드' })).toBeVisible();
    // 파일 없으면 업로드 버튼 비활성화
    await expect(dialog.getByRole('button', { name: '업로드' })).toBeDisabled();
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('엑셀 다운로드 버튼 클릭', async ({ page }) => {
    // 다운로드 이벤트 감지
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: /엑셀 다운로드/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/assets_DESKTOP\.xlsx/i);
  });

  test('템플릿 다운로드 버튼 클릭', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: /템플릿/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/template_DESKTOP\.xlsx/i);
  });
});
