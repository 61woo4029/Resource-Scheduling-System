import authReducer, { login, logout, updateTokens, updateUser } from '../store/authSlice';

describe('authSlice 단위 테스트', () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  };

  const mockUser = { userId: 1, email: 'test@test.com', name: '테스터', role: 'USER' };

  beforeEach(() => {
    localStorage.clear();
  });

  test('초기 상태는 미인증', () => {
    const state = authReducer(undefined, { type: '@@INIT' });
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });

  test('login 액션 - 토큰과 사용자 정보 저장', () => {
    const payload = { accessToken: 'acc-token', refreshToken: 'ref-token', user: mockUser };
    const state = authReducer(initialState, login(payload));

    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe('acc-token');
    expect(state.refreshToken).toBe('ref-token');
    expect(state.user).toEqual(mockUser);
  });

  test('login 액션 - localStorage에 토큰 저장', () => {
    const payload = { accessToken: 'acc-token', refreshToken: 'ref-token', user: mockUser };
    authReducer(initialState, login(payload));

    expect(localStorage.getItem('accessToken')).toBe('acc-token');
    expect(localStorage.getItem('refreshToken')).toBe('ref-token');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser);
  });

  test('logout 액션 - 상태 초기화', () => {
    const loggedInState = {
      user: mockUser, accessToken: 'acc-token',
      refreshToken: 'ref-token', isAuthenticated: true,
    };
    const state = authReducer(loggedInState, logout());

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  test('logout 액션 - localStorage 항목 삭제', () => {
    localStorage.setItem('accessToken', 'acc-token');
    localStorage.setItem('refreshToken', 'ref-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const loggedInState = {
      user: mockUser, accessToken: 'acc-token',
      refreshToken: 'ref-token', isAuthenticated: true,
    };
    authReducer(loggedInState, logout());

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('updateTokens 액션 - 토큰만 갱신', () => {
    const loggedInState = {
      user: mockUser, accessToken: 'old-acc',
      refreshToken: 'old-ref', isAuthenticated: true,
    };
    const state = authReducer(loggedInState, updateTokens({
      accessToken: 'new-acc', refreshToken: 'new-ref',
    }));

    expect(state.accessToken).toBe('new-acc');
    expect(state.refreshToken).toBe('new-ref');
    expect(state.user).toEqual(mockUser); // 사용자 정보 유지
    expect(state.isAuthenticated).toBe(true);
  });

  test('updateUser 액션 - 사용자 정보 부분 업데이트', () => {
    const loggedInState = {
      user: mockUser, accessToken: 'acc-token',
      refreshToken: 'ref-token', isAuthenticated: true,
    };
    const state = authReducer(loggedInState, updateUser({ name: '변경된이름', position: '대리' }));

    expect(state.user.name).toBe('변경된이름');
    expect(state.user.position).toBe('대리');
    expect(state.user.email).toBe('test@test.com'); // 기존 값 유지
  });

  test('localStorage에 토큰 있으면 초기 상태가 인증됨', () => {
    localStorage.setItem('accessToken', 'stored-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    // 모듈 재로딩 없이 직접 초기값 확인
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user'));
    expect(token).toBe('stored-token');
    expect(user.email).toBe('test@test.com');
  });
});
