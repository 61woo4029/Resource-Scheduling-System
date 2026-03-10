/**
 * 공통 헬퍼 함수
 */

const ADMIN = { email: 'admin@selim.kr', password: 'admin123!' };
const USER  = { email: 'user@selim.kr',  password: 'user123!' };

/**
 * 로그인 후 대시보드까지 이동
 */
async function login(page, credentials = ADMIN) {
  await page.goto('/login');
  await page.getByLabel(/이메일/i).fill(credentials.email);
  await page.getByLabel(/비밀번호/i).fill(credentials.password);
  await page.getByRole('button', { name: /로그인/i }).click();
  await page.waitForURL('**/dashboard');
}

/**
 * 로그아웃
 */
async function logout(page) {
  await page.getByRole('button', { name: /로그아웃/i }).click();
  await page.waitForURL('**/login');
}

module.exports = { ADMIN, USER, login, logout };
