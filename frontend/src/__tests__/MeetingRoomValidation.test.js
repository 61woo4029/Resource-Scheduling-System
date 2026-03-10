/**
 * 회의실 예약 유효성 검사 로직 단위 테스트
 */

// 예약 저장 유효성 검사 함수 (컴포넌트에서 추출한 순수 함수)
function validateReservation(reservation) {
  const errors = {};
  if (!reservation.meetingTitle?.trim()) {
    errors.meetingTitle = '회의 제목을 입력해주세요.';
  }
  if (!reservation.attendeeCount || Number(reservation.attendeeCount) <= 0) {
    errors.attendeeCount = '참석 인원을 입력해주세요.';
  }
  return errors;
}

describe('회의실 예약 유효성 검사', () => {
  test('회의 제목과 참석 인원이 모두 있으면 에러 없음', () => {
    const errors = validateReservation({ meetingTitle: '주간 회의', attendeeCount: 5 });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('회의 제목이 빈 문자열이면 에러 반환', () => {
    const errors = validateReservation({ meetingTitle: '', attendeeCount: 3 });
    expect(errors.meetingTitle).toBeDefined();
  });

  test('회의 제목이 공백만 있으면 에러 반환', () => {
    const errors = validateReservation({ meetingTitle: '   ', attendeeCount: 3 });
    expect(errors.meetingTitle).toBeDefined();
  });

  test('참석 인원이 없으면 에러 반환', () => {
    const errors = validateReservation({ meetingTitle: '주간 회의', attendeeCount: '' });
    expect(errors.attendeeCount).toBeDefined();
  });

  test('참석 인원이 0이면 에러 반환', () => {
    const errors = validateReservation({ meetingTitle: '주간 회의', attendeeCount: 0 });
    expect(errors.attendeeCount).toBeDefined();
  });

  test('참석 인원이 음수면 에러 반환', () => {
    const errors = validateReservation({ meetingTitle: '주간 회의', attendeeCount: -1 });
    expect(errors.attendeeCount).toBeDefined();
  });

  test('회의 제목과 참석 인원 모두 없으면 두 개의 에러', () => {
    const errors = validateReservation({ meetingTitle: '', attendeeCount: '' });
    expect(errors.meetingTitle).toBeDefined();
    expect(errors.attendeeCount).toBeDefined();
  });

  test('meetingTitle이 undefined면 에러 반환', () => {
    const errors = validateReservation({ attendeeCount: 3 });
    expect(errors.meetingTitle).toBeDefined();
  });

  test('참석 인원이 문자열 숫자면 유효', () => {
    const errors = validateReservation({ meetingTitle: '회의', attendeeCount: '5' });
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('회의 시간 유효성 검사', () => {
  const TIME_SLOTS = [];
  for (let h = 8; h < 20; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
  }

  test('TIME_SLOTS는 08:00부터 19:30까지 생성', () => {
    expect(TIME_SLOTS[0]).toBe('08:00');
    expect(TIME_SLOTS[TIME_SLOTS.length - 1]).toBe('19:30');
    expect(TIME_SLOTS).toHaveLength(24);
  });

  test('시작 시간이 종료 시간보다 이른지 확인', () => {
    const startIdx = TIME_SLOTS.indexOf('09:00');
    const endIdx = TIME_SLOTS.indexOf('10:00');
    expect(startIdx).toBeLessThan(endIdx);
  });

  test('동일 시간은 유효하지 않음', () => {
    const startIdx = TIME_SLOTS.indexOf('09:00');
    const endIdx = TIME_SLOTS.indexOf('09:00');
    expect(startIdx).not.toBeLessThan(endIdx);
  });
});
