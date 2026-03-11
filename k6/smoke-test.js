/**
 * 자원관리시스템 - 스모크 테스트
 * 배포 후 API 전체가 정상 동작하는지 빠르게 검증
 *
 * 실행: k6 run k6/smoke-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api';
const TODAY = new Date().toISOString().split('T')[0];

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed:   ['rate==0'],      // 오류 0%
    http_req_duration: ['p(95)<5000'],   // 5초 이내
  },
};

function jsonHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return { headers: h };
}

export default function () {
  let adminToken = null;
  let userToken  = null;

  // ── 인증 ──────────────────────────────────────────────────────────────────
  group('인증', () => {
    // 관리자 로그인
    const adminRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'admin@selim.kr', password: 'admin123!' }),
      jsonHeaders(null)
    );
    check(adminRes, { '관리자 로그인 200': (r) => r.status === 200 });
    adminToken = JSON.parse(adminRes.body).data?.accessToken;

    // 일반 사용자 로그인
    const userRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'user@selim.kr', password: 'user123!' }),
      jsonHeaders(null)
    );
    check(userRes, { '사용자 로그인 200': (r) => r.status === 200 });
    userToken = JSON.parse(userRes.body).data?.accessToken;

    // 잘못된 계정 로그인 → 401 예상
    const failRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'wrong@test.com', password: 'wrong' }),
      jsonHeaders(null)
    );
    check(failRes, { '잘못된 로그인 401': (r) => r.status === 401 });
  });

  sleep(0.5);

  // ── 사용자 API ─────────────────────────────────────────────────────────────
  group('사용자 API', () => {
    const res = http.get(`${BASE_URL}/users/me`, jsonHeaders(userToken));
    check(res, { '내 정보 조회 200': (r) => r.status === 200 });

    const listRes = http.get(`${BASE_URL}/users`, jsonHeaders(adminToken));
    check(listRes, { '사용자 목록 (관리자) 200': (r) => r.status === 200 });

    const forbiddenRes = http.get(`${BASE_URL}/users`, jsonHeaders(userToken));
    check(forbiddenRes, { '사용자 목록 (일반) 403': (r) => r.status === 403 });
  });

  sleep(0.5);

  // ── 자산 API ───────────────────────────────────────────────────────────────
  group('자산 API', () => {
    const categories = ['DESKTOP', 'LAPTOP', 'SERVER', 'MONITOR'];
    for (const cat of categories) {
      const res = http.get(`${BASE_URL}/assets?category=${cat}`, jsonHeaders(adminToken));
      check(res, { [`자산 목록 ${cat} 200`]: (r) => r.status === 200 });
    }
  });

  sleep(0.5);

  // ── 회의실 API ─────────────────────────────────────────────────────────────
  group('회의실 API', () => {
    const roomsRes = http.get(`${BASE_URL}/meeting-rooms`, jsonHeaders(userToken));
    check(roomsRes, { '회의실 목록 200': (r) => r.status === 200 });

    const resRes = http.get(`${BASE_URL}/room-reservations?date=${TODAY}`, jsonHeaders(userToken));
    check(resRes, { '회의실 예약 조회 200': (r) => r.status === 200 });

    const myRes = http.get(`${BASE_URL}/room-reservations/my`, jsonHeaders(userToken));
    check(myRes, { '내 회의실 예약 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── 법인차량 API ───────────────────────────────────────────────────────────
  group('법인차량 API', () => {
    const vehiclesRes = http.get(`${BASE_URL}/vehicles`, jsonHeaders(userToken));
    check(vehiclesRes, { '차량 목록 200': (r) => r.status === 200 });

    const resRes = http.get(`${BASE_URL}/vehicle-reservations?date=${TODAY}`, jsonHeaders(userToken));
    check(resRes, { '차량 예약 조회 200': (r) => r.status === 200 });

    const myRes = http.get(`${BASE_URL}/vehicle-reservations/my`, jsonHeaders(userToken));
    check(myRes, { '내 차량 예약 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── 메뉴 API ───────────────────────────────────────────────────────────────
  group('메뉴 API', () => {
    const myMenuRes = http.get(`${BASE_URL}/menus/my`, jsonHeaders(userToken));
    check(myMenuRes, { '내 메뉴 200': (r) => r.status === 200 });

    const treeRes = http.get(`${BASE_URL}/menus/tree`, jsonHeaders(adminToken));
    check(treeRes, { '메뉴 트리 (관리자) 200': (r) => r.status === 200 });
  });

  sleep(0.5);

  // ── 로그아웃 ───────────────────────────────────────────────────────────────
  group('로그아웃', () => {
    const res = http.post(`${BASE_URL}/auth/logout`, null, jsonHeaders(userToken));
    check(res, { '로그아웃 200': (r) => r.status === 200 });
  });
}
