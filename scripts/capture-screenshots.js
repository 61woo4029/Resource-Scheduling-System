/**
 * 매뉴얼용 스크린샷 자동 캡처
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '../docs/screenshots');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@selim.kr', password: 'admin123!' };
const USER  = { email: 'user@selim.kr',  password: 'user123!' };

async function shot(page, name) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function login(page, cred = ADMIN) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/이메일/i).fill(cred.email);
  await page.getByLabel(/비밀번호/i).fill(cred.password);
  await page.getByRole('button', { name: /로그인/i }).click();
  await page.waitForURL('**/dashboard');
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--font-render-hinting=none', '--disable-font-subpixel-positioning'],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. 로그인 페이지
  console.log('📸 로그인');
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await shot(page, '01_login');

  // 로그인 실패
  await page.getByLabel(/이메일/i).fill('wrong@email.com');
  await page.getByLabel(/비밀번호/i).fill('wrongpass');
  await page.getByRole('button', { name: /로그인/i }).click();
  await page.waitForTimeout(1000);
  await shot(page, '02_login_fail');

  // 2. 대시보드 (관리자)
  console.log('📸 대시보드');
  await login(page, ADMIN);
  await shot(page, '03_dashboard_admin');

  // 3. 대시보드 (일반 사용자)
  await login(page, USER);
  await shot(page, '04_dashboard_user');

  // 4. 자산 관리 (관리자로)
  console.log('📸 자산 관리');
  await login(page, ADMIN);
  await page.getByRole('button', { name: '자산 관리', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '05_asset_list');

  // 자산 등록 다이얼로그
  await page.getByRole('button', { name: /자산 등록/i }).click();
  await page.waitForSelector('[role="dialog"]');
  await shot(page, '06_asset_register');
  await page.getByRole('button', { name: '취소' }).click();

  // 노트북 탭
  await page.getByRole('tab', { name: '노트북' }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '07_asset_laptop');

  // 5. 회의실 예약
  console.log('📸 회의실 예약');
  await page.getByRole('button', { name: '회의실 예약', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '08_meeting_room');

  // 예약 다이얼로그
  const emptyCell = page.locator('table').last().locator('tbody td:not(:first-child):not(:has(*))').first();
  if (await emptyCell.isVisible()) {
    await emptyCell.click();
    await page.waitForSelector('[role="dialog"]');
    await shot(page, '09_meeting_book');
    await page.keyboard.press('Escape');
  }

  // 주별 뷰
  const weekTab = page.getByRole('tab', { name: /주별/i }).first();
  if (await weekTab.isVisible()) {
    await weekTab.click();
    await page.waitForLoadState('networkidle');
    await shot(page, '10_meeting_weekly');
  }

  // 6. 법인차량 예약
  console.log('📸 법인차량');
  await page.getByRole('button', { name: '법인차량 예약', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '11_vehicle');

  // 예약 다이얼로그
  await page.getByRole('button', { name: /예약하기/i }).click();
  await page.waitForSelector('[role="dialog"]');
  await shot(page, '12_vehicle_book');
  await page.keyboard.press('Escape');

  // 주별 뷰
  await page.getByRole('tab', { name: '주별' }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '13_vehicle_weekly');

  // 7. 마이페이지
  console.log('📸 마이페이지');
  await page.getByRole('button', { name: '마이페이지', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '14_mypage_profile');

  await page.getByRole('tab', { name: /비밀번호/i }).click();
  await shot(page, '15_mypage_password');

  await page.getByRole('tab', { name: /권한 신청/i }).click();
  await shot(page, '16_mypage_permission');

  // 8. 관리자 메뉴 (사용자 관리)
  console.log('📸 관리자 메뉴');
  await page.getByRole('button', { name: '사용자 관리', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '17_user_mgmt');

  // 부서 관리
  await page.getByRole('button', { name: '부서 관리', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '18_dept_mgmt');

  // 권한 관리
  await page.getByRole('button', { name: '권한 관리', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '19_perm_mgmt');

  // 메뉴 관리
  await page.getByRole('button', { name: '메뉴 관리', exact: true }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '20_menu_mgmt');

  await browser.close();
  console.log('\n✅ 스크린샷 캡처 완료:', OUT_DIR);
})();
