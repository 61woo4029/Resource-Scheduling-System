const { test, expect } = require('@playwright/test');
const { ADMIN, login } = require('./helpers');

// ── 공통 헬퍼 ──────────────────────────────────────────────────────────────

/**
 * 지정 탭으로 전환 후 자산을 등록하고 성공 메시지까지 확인한다.
 * serialNumber는 unique constraint 때문에 항상 고유값을 전달해야 한다.
 */
async function registerAsset(page, { tab, assetNumber, sn, user = '테스터', manufacturer = '삼성', model = '테스트모델', os, cpu, ram, ssd, hdd } = {}) {
  await page.getByRole('tab', { name: tab }).click();
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /자산 등록/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(/자산관리번호/i).fill(assetNumber);
  await dialog.getByLabel(/사용자명/i).fill(user);
  await dialog.getByLabel(/제조사/i).fill(manufacturer);
  await dialog.getByLabel(/모델명/i).fill(model);
  await dialog.getByLabel('S/N').fill(sn);

  if (os)  await dialog.getByLabel('OS').fill(os);
  if (cpu) await dialog.getByLabel('CPU').fill(cpu);
  if (ram) await dialog.getByLabel('RAM').fill(ram);
  if (ssd) await dialog.getByLabel('SSD').fill(ssd);
  if (hdd) await dialog.getByLabel('HDD').fill(hdd);

  await dialog.getByRole('button', { name: '저장' }).click();
  await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 노트북 (LAPTOP)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
test.describe('자산 관리 - 노트북', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole('button', { name: '자산 관리', exact: true }).click();
    await expect(page.getByRole('heading', { name: /자산 관리/i })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('노트북 탭 전환 및 테이블 표시', async ({ page }) => {
    await page.getByRole('tab', { name: '노트북' }).click();
    await expect(page.getByRole('tab', { name: '노트북' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('columnheader', { name: 'OS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CPU' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'RAM' })).toBeVisible();
  });

  test('노트북 등록 - OS/CPU/RAM/SSD/HDD 포함', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '노트북',
      assetNumber: `NB-${suffix}`,
      sn: `SNB-${suffix}`,
      user: '노트북사용자',
      manufacturer: 'LG',
      model: 'gram17',
      os: 'Windows 11',
      cpu: 'Intel i7-1360P',
      ram: '32GB',
      ssd: '1TB',
      hdd: '',
    });

    // 등록된 자산이 목록에 표시되는지 확인 (exact: true로 S/N 셀 중복 매칭 방지)
    await expect(page.getByRole('cell', { name: `NB-${suffix}`, exact: true })).toBeVisible();
  });

  test('노트북 등록 다이얼로그 - 사양 필드 표시 확인', async ({ page }) => {
    await page.getByRole('tab', { name: '노트북' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel('OS')).toBeVisible();
    await expect(dialog.getByLabel('CPU')).toBeVisible();
    await expect(dialog.getByLabel('RAM')).toBeVisible();
    await expect(dialog.getByLabel('SSD')).toBeVisible();
    await expect(dialog.getByLabel('HDD')).toBeVisible();

    await dialog.getByRole('button', { name: '취소' }).click();
  });

  test('노트북 수정', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '노트북',
      assetNumber: `NB-E${suffix}`,
      sn: `SNB-E${suffix}`,
      user: '수정전',
      os: 'Windows 10',
      cpu: 'Intel i5',
      ram: '16GB',
    });

    const row = page.getByRole('row').filter({ hasText: `NB-E${suffix}` });
    await row.getByRole('button').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '자산 수정' })).toBeVisible();

    // RAM 수정
    await dialog.getByLabel('RAM').clear();
    await dialog.getByLabel('RAM').fill('32GB');

    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 수정되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  test('노트북 삭제', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '노트북',
      assetNumber: `NB-D${suffix}`,
      sn: `SNB-D${suffix}`,
      user: '삭제테스트',
    });

    const row = page.getByRole('row').filter({ hasText: `NB-D${suffix}` });
    page.once('dialog', d => d.accept());
    await row.getByRole('button').last().click();

    await expect(page.getByText(/삭제되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  test('노트북 검색 - 자산관리번호로 필터', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '노트북',
      assetNumber: `NB-S${suffix}`,
      sn: `SNB-S${suffix}`,
      user: '검색테스트',
    });

    // 자산관리번호로 검색 (exact: true로 다이얼로그 잔여 DOM 중복 매칭 방지)
    await page.getByLabel('자산관리번호', { exact: true }).fill(`NB-S${suffix}`);
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('cell', { name: `NB-S${suffix}`, exact: true })).toBeVisible();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 서버 (SERVER)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
test.describe('자산 관리 - 서버', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole('button', { name: '자산 관리', exact: true }).click();
    await expect(page.getByRole('heading', { name: /자산 관리/i })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('서버 탭 전환 및 테이블 표시', async ({ page }) => {
    await page.getByRole('tab', { name: '서버' }).click();
    await expect(page.getByRole('tab', { name: '서버' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('columnheader', { name: 'OS' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CPU' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'RAM' })).toBeVisible();
  });

  test('서버 등록 - OS/CPU/RAM/SSD/HDD 포함', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '서버',
      assetNumber: `SRV-${suffix}`,
      sn: `SSR-${suffix}`,
      user: '인프라팀',
      manufacturer: 'Dell',
      model: 'PowerEdge R750',
      os: 'Ubuntu 22.04',
      cpu: 'Xeon Gold 6338',
      ram: '256GB',
      ssd: '4TB',
      hdd: '8TB',
    });

    await expect(page.getByRole('cell', { name: `SRV-${suffix}` })).toBeVisible();
  });

  test('서버 등록 다이얼로그 - 사양 필드 표시 확인', async ({ page }) => {
    await page.getByRole('tab', { name: '서버' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.getByLabel('OS')).toBeVisible();
    await expect(dialog.getByLabel('CPU')).toBeVisible();
    await expect(dialog.getByLabel('RAM')).toBeVisible();
    await expect(dialog.getByLabel('SSD')).toBeVisible();
    await expect(dialog.getByLabel('HDD')).toBeVisible();

    await dialog.getByRole('button', { name: '취소' }).click();
  });

  test('서버 수정', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '서버',
      assetNumber: `SRV-E${suffix}`,
      sn: `SSR-E${suffix}`,
      user: '수정전',
      os: 'CentOS 7',
      cpu: 'Xeon E5',
      ram: '64GB',
    });

    const row = page.getByRole('row').filter({ hasText: `SRV-E${suffix}` });
    await row.getByRole('button').first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '자산 수정' })).toBeVisible();

    await dialog.getByLabel('OS').clear();
    await dialog.getByLabel('OS').fill('Ubuntu 22.04');

    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 수정되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  test('서버 삭제', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await registerAsset(page, {
      tab: '서버',
      assetNumber: `SRV-D${suffix}`,
      sn: `SSR-D${suffix}`,
      user: '삭제테스트',
    });

    const row = page.getByRole('row').filter({ hasText: `SRV-D${suffix}` });
    page.once('dialog', d => d.accept());
    await row.getByRole('button').last().click();

    await expect(page.getByText(/삭제되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  test('서버 검색 - 사용자명으로 필터', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const uniqueUser = `인프라_${suffix}`;

    await registerAsset(page, {
      tab: '서버',
      assetNumber: `SRV-S${suffix}`,
      sn: `SSR-S${suffix}`,
      user: uniqueUser,
    });

    // 사용자명으로 검색 (exact: true로 다이얼로그 잔여 DOM 중복 매칭 방지)
    await page.getByLabel('사용자명', { exact: true }).fill(uniqueUser);
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('cell', { name: uniqueUser, exact: true })).toBeVisible();
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 모니터 (MONITOR)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
test.describe('자산 관리 - 모니터', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole('button', { name: '자산 관리', exact: true }).click();
    await expect(page.getByRole('heading', { name: /자산 관리/i })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('모니터 탭 전환 및 테이블 표시', async ({ page }) => {
    await page.getByRole('tab', { name: '모니터' }).click();
    await expect(page.getByRole('tab', { name: '모니터' })).toHaveAttribute('aria-selected', 'true');
    await page.waitForLoadState('networkidle');
    // 모니터는 OS/CPU/RAM 컬럼 없음
    await expect(page.getByRole('columnheader', { name: 'OS' })).not.toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'CPU' })).not.toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'RAM' })).not.toBeVisible();
  });

  test('모니터 등록 다이얼로그 - OS/CPU/RAM 필드 없음 확인', async ({ page }) => {
    await page.getByRole('tab', { name: '모니터' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 모니터 등록 폼에는 OS/CPU/RAM/SSD/HDD 필드가 없어야 함
    await expect(dialog.getByLabel('OS')).not.toBeVisible();
    await expect(dialog.getByLabel('CPU')).not.toBeVisible();
    await expect(dialog.getByLabel('RAM')).not.toBeVisible();
    await expect(dialog.getByLabel('SSD')).not.toBeVisible();
    await expect(dialog.getByLabel('HDD')).not.toBeVisible();

    // 기본 필드는 존재해야 함
    await expect(dialog.getByLabel(/자산관리번호/i)).toBeVisible();
    await expect(dialog.getByLabel(/사용자명/i)).toBeVisible();
    await expect(dialog.getByLabel(/제조사/i)).toBeVisible();
    await expect(dialog.getByLabel(/모델명/i)).toBeVisible();

    await dialog.getByRole('button', { name: '취소' }).click();
  });

  test('모니터 등록 성공', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await page.getByRole('tab', { name: '모니터' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/자산관리번호/i).fill(`MON-${suffix}`);
    await dialog.getByLabel(/사용자명/i).fill('모니터사용자');
    await dialog.getByLabel(/제조사/i).fill('삼성');
    await dialog.getByLabel(/모델명/i).fill('Odyssey G9');
    await dialog.getByLabel('S/N').fill(`SMN-${suffix}`);

    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('cell', { name: `MON-${suffix}` })).toBeVisible();
  });

  test('모니터 수정', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await page.getByRole('tab', { name: '모니터' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/자산관리번호/i).fill(`MON-E${suffix}`);
    await dialog.getByLabel(/사용자명/i).fill('수정전');
    await dialog.getByLabel('S/N').fill(`SMN-E${suffix}`);
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: `MON-E${suffix}` });
    await row.getByRole('button').first().click();

    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: '자산 수정' })).toBeVisible();
    // 수정 폼에도 OS/CPU/RAM 없음 확인
    await expect(editDialog.getByLabel('OS')).not.toBeVisible();

    await editDialog.getByLabel(/사용자명/i).clear();
    await editDialog.getByLabel(/사용자명/i).fill('수정후');
    await editDialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 수정되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  test('모니터 삭제', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);

    await page.getByRole('tab', { name: '모니터' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /자산 등록/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/자산관리번호/i).fill(`MON-D${suffix}`);
    await dialog.getByLabel(/사용자명/i).fill('삭제테스트');
    await dialog.getByLabel('S/N').fill(`SMN-D${suffix}`);
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText(/자산이 등록되었습니다/i)).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const row = page.getByRole('row').filter({ hasText: `MON-D${suffix}` });
    page.once('dialog', d => d.accept());
    await row.getByRole('button').last().click();

    await expect(page.getByText(/삭제되었습니다/i)).toBeVisible({ timeout: 10000 });
  });

  test('모니터 상태 필터 - 미사용 검색', async ({ page }) => {
    await page.getByRole('tab', { name: '모니터' }).click();
    await page.waitForLoadState('networkidle');

    await page.locator('label').filter({ hasText: /^상태$/ }).locator('xpath=following-sibling::div').click();
    await page.getByRole('option', { name: '미사용', exact: true }).click();
    await page.getByRole('button', { name: '검색' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('table')).toBeVisible();
  });
});
