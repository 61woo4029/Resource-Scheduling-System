/**
 * 자원관리시스템 - k6 성능 테스트 (실제 사용 패턴 시뮬레이션)
 *
 * 시나리오: 로그인 → 대시보드 → 자산 조회 → 회의실 예약 조회 → 법인차량 예약 조회
 *
 * 실행 방법:
 *   k6 run k6/load-test.js
 *   k6 run --out json=k6/result.json k6/load-test.js   (JSON 결과 저장)
 *   k6 run --out csv=k6/result.csv k6/load-test.js    (CSV 결과 저장)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// ─── 설정 ─────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api';
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// 테스트 계정 (환경변수 우선, fallback으로 기본 계정 사용)
const ACCOUNTS = new SharedArray('accounts', () => [
  {
    email:    __ENV.ADMIN_EMAIL    || 'admin@selim.kr',
    password: __ENV.ADMIN_PASSWORD || 'admin123!',
  },
  {
    email:    __ENV.USER_EMAIL    || 'user@selim.kr',
    password: __ENV.USER_PASSWORD || 'user123!',
  },
]);

// ─── 커스텀 메트릭 ────────────────────────────────────────────────────────────
const loginFailRate    = new Rate('login_fail_rate');
const apiErrorRate     = new Rate('api_error_rate');
const loginDuration    = new Trend('login_duration_ms',    true);
const assetDuration    = new Trend('asset_list_duration_ms', true);
const roomDuration     = new Trend('room_reservation_duration_ms', true);
const vehicleDuration  = new Trend('vehicle_reservation_duration_ms', true);
const reservationCount = new Counter('reservation_queries_total');

// ─── 부하 단계 설정 ───────────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 5  },  // 워밍업: 5명까지 증가
    { duration: '1m',  target: 20 },  // 보통 부하: 20명 유지
    { duration: '1m',  target: 50 },  // 중간 부하: 50명까지 증가
    { duration: '2m',  target: 50 },  // 피크: 50명 유지
    { duration: '30s', target: 0  },  // 쿨다운: 0명으로 감소
  ],
  thresholds: {
    // 응답 성공률
    http_req_failed:              ['rate<0.05'],   // 전체 오류율 5% 미만
    login_fail_rate:              ['rate<0.01'],   // 로그인 실패율 1% 미만
    api_error_rate:               ['rate<0.05'],   // API 오류율 5% 미만

    // 응답 시간 (p95 기준)
    http_req_duration:            ['p(95)<3000'],  // 전체 p95 3초 미만
    login_duration_ms:            ['p(95)<2000'],  // 로그인 p95 2초 미만
    asset_list_duration_ms:       ['p(95)<2000'],  // 자산목록 p95 2초 미만
    room_reservation_duration_ms: ['p(95)<2000'],  // 회의실 p95 2초 미만
    vehicle_reservation_duration_ms: ['p(95)<2000'], // 차량 p95 2초 미만
  },
};

// ─── 공통 헬퍼 ────────────────────────────────────────────────────────────────
function jsonHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { headers };
}

function checkResponse(res, name) {
  const ok = check(res, {
    [`${name} - status 200`]: (r) => r.status === 200,
    [`${name} - success true`]: (r) => {
      try { return JSON.parse(r.body).success === true; }
      catch { return false; }
    },
  });
  apiErrorRate.add(!ok);
  return ok;
}

// ─── 메인 시나리오 ─────────────────────────────────────────────────────────────
export default function () {
  // 랜덤 계정 선택 (멀티 유저 시뮬레이션)
  const account = ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)];

  let token = null;

  // ── 1단계: 로그인 ──────────────────────────────────────────────────────────
  group('01_로그인', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: account.email, password: account.password }),
      jsonHeaders(null)
    );
    loginDuration.add(Date.now() - start);

    // body 1회만 파싱
    let body = null;
    try { body = JSON.parse(res.body); } catch (_) {}

    const ok = check(res, {
      '로그인 성공 (200)': (r) => r.status === 200,
      '토큰 발급됨':       () => !!body?.data?.accessToken,
    });

    loginFailRate.add(!ok);

    if (ok) token = body.data.accessToken;
  });

  if (!token) {
    sleep(1);
    return; // 로그인 실패 시 이후 단계 건너뜀
  }

  sleep(1); // 페이지 로딩 시간 시뮬레이션

  // ── 2단계: 대시보드 (내 메뉴 + 내 정보 + 권한 신청 건수) ──────────────────
  group('02_대시보드', () => {
    const responses = http.batch([
      ['GET', `${BASE_URL}/menus/my`,                    null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/users/me`,                    null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/permission-requests/pending/count`, null, jsonHeaders(token)],
    ]);

    checkResponse(responses[0], '내 메뉴 조회');
    checkResponse(responses[1], '내 정보 조회');
    // pending count는 관리자만 200, 일반 사용자는 403일 수 있음
    check(responses[2], { '권한신청 건수 응답': (r) => r.status === 200 || r.status === 403 });
  });

  sleep(2); // 사용자가 대시보드 확인하는 시간

  // ── 3단계: 자산 목록 조회 ──────────────────────────────────────────────────
  group('03_자산_목록_조회', () => {
    const categories = ['DESKTOP', 'LAPTOP', 'SERVER', 'MONITOR'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/assets?category=${category}&page=0&size=20`,
      jsonHeaders(token)
    );
    assetDuration.add(Date.now() - start);

    checkResponse(res, `자산목록_${category}`);

    sleep(1);

    // 목록 중 첫 번째 자산 상세 조회 (있을 경우)
    try {
      const body = JSON.parse(res.body);
      const assets = body.data?.content || body.data || [];
      if (Array.isArray(assets) && assets.length > 0) {
        const assetId = assets[0].assetId || assets[0].id;
        if (assetId) {
          const detailRes = http.get(`${BASE_URL}/assets/${assetId}`, jsonHeaders(token));
          checkResponse(detailRes, '자산 상세 조회');
        }
      }
    } catch (_) {}
  });

  sleep(2);

  // ── 4단계: 회의실 예약 조회 ────────────────────────────────────────────────
  group('04_회의실_예약_조회', () => {
    reservationCount.add(1);

    const start = Date.now();
    const responses = http.batch([
      ['GET', `${BASE_URL}/meeting-rooms`,                            null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/room-reservations?date=${TODAY}`,          null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/room-reservations/my`,                     null, jsonHeaders(token)],
    ]);
    roomDuration.add(Date.now() - start);

    checkResponse(responses[0], '회의실 목록');
    checkResponse(responses[1], '회의실 예약 조회 (오늘)');
    checkResponse(responses[2], '내 회의실 예약');
  });

  sleep(2);

  // ── 5단계: 법인차량 예약 조회 ──────────────────────────────────────────────
  group('05_법인차량_예약_조회', () => {
    reservationCount.add(1);

    const start = Date.now();
    const responses = http.batch([
      ['GET', `${BASE_URL}/vehicles`,                                  null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/vehicle-reservations?date=${TODAY}`,        null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/vehicle-reservations/my`,                   null, jsonHeaders(token)],
    ]);
    vehicleDuration.add(Date.now() - start);

    checkResponse(responses[0], '차량 목록');
    checkResponse(responses[1], '차량 예약 조회 (오늘)');
    checkResponse(responses[2], '내 차량 예약');
  });

  sleep(2);

  // ── 6단계: 내 마이페이지 조회 ──────────────────────────────────────────────
  group('06_마이페이지', () => {
    const responses = http.batch([
      ['GET', `${BASE_URL}/users/me`,              null, jsonHeaders(token)],
      ['GET', `${BASE_URL}/permission-requests/my`, null, jsonHeaders(token)],
    ]);

    checkResponse(responses[0], '프로필 조회');
    checkResponse(responses[1], '내 권한 신청 목록');
  });

  sleep(1);

  // ── 7단계: 로그아웃 ────────────────────────────────────────────────────────
  group('07_로그아웃', () => {
    const res = http.post(`${BASE_URL}/auth/logout`, null, jsonHeaders(token));
    check(res, { '로그아웃 성공': (r) => r.status === 200 });
  });

  // 다음 VU 반복 전 대기 (1~3초 랜덤)
  sleep(1 + Math.random() * 2);
}

// ─── 테스트 종료 후 요약 출력 ─────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;

  const fmt = (v) => (v !== undefined ? v.toFixed(2) : 'N/A');

  const summary = `
========================================
  자원관리시스템 성능 테스트 결과 요약
========================================

[요청 통계]
  총 요청 수:       ${metrics.http_reqs?.values?.count ?? 'N/A'}
  평균 RPS:         ${fmt(metrics.http_reqs?.values?.rate)} req/s
  총 데이터 수신:   ${((metrics.data_received?.values?.count ?? 0) / 1024 / 1024).toFixed(2)} MB

[응답 시간 (전체)]
  평균:   ${fmt(metrics.http_req_duration?.values?.avg)} ms
  p50:    ${fmt(metrics.http_req_duration?.values['p(50)'])} ms
  p90:    ${fmt(metrics.http_req_duration?.values['p(90)'])} ms
  p95:    ${fmt(metrics.http_req_duration?.values['p(95)'])} ms
  p99:    ${fmt(metrics.http_req_duration?.values['p(99)'])} ms
  최대:   ${fmt(metrics.http_req_duration?.values?.max)} ms

[주요 API 응답 시간 (p95)]
  로그인:        ${fmt(metrics.login_duration_ms?.values['p(95)'])} ms
  자산 목록:     ${fmt(metrics.asset_list_duration_ms?.values['p(95)'])} ms
  회의실 예약:   ${fmt(metrics.room_reservation_duration_ms?.values['p(95)'])} ms
  차량 예약:     ${fmt(metrics.vehicle_reservation_duration_ms?.values['p(95)'])} ms

[오류율]
  전체 HTTP 오류:  ${fmt((metrics.http_req_failed?.values?.rate ?? 0) * 100)} %
  로그인 실패:     ${fmt((metrics.login_fail_rate?.values?.rate ?? 0) * 100)} %
  API 오류:        ${fmt((metrics.api_error_rate?.values?.rate ?? 0) * 100)} %

[임계값 통과 여부]
${Object.entries(metrics)
  .filter(([, v]) => v.thresholds)
  .map(([k, v]) => {
    const allPassed = Object.values(v.thresholds).every((t) => t.ok);
    return `  ${allPassed ? '✓' : '✗'} ${k}`;
  }).join('\n') || '  (임계값 없음)'}

========================================
`;

  return {
    stdout: summary,
    'k6/result-summary.txt': summary,
  };
}
