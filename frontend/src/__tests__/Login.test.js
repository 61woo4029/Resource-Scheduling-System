import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import Login from '../pages/Login';

jest.mock('../services/api', () => ({
  authApi: { login: jest.fn() },
}));

const { authApi } = require('../services/api');

// useNavigate mock
const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

function renderLogin() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </Provider>
  );
}

describe('Login 컴포넌트', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('이메일, 비밀번호 입력 필드와 로그인 버튼이 렌더링됨', () => {
    renderLogin();
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
  });

  test('빈 폼 제출 시 react-hook-form 에러 메시지 표시', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /로그인/i }));
    await waitFor(() => {
      expect(screen.getByText('이메일을 입력하세요')).toBeInTheDocument();
      expect(screen.getByText('비밀번호를 입력하세요')).toBeInTheDocument();
    });
  });

  test('이메일만 입력 후 제출 시 비밀번호 에러 표시', async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /로그인/i }));
    await waitFor(() => {
      expect(screen.getByText('비밀번호를 입력하세요')).toBeInTheDocument();
    });
  });

  test('로그인 성공 시 /dashboard로 이동', async () => {
    authApi.login.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'mock-access', refreshToken: 'mock-refresh',
          user: { userId: 1, email: 'test@test.com', name: '테스터', role: 'USER' },
        },
      },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/비밀번호/i), { target: { value: 'password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('로그인 성공 시 localStorage에 토큰 저장', async () => {
    authApi.login.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'mock-access', refreshToken: 'mock-refresh',
          user: { userId: 1, email: 'test@test.com', name: '테스터', role: 'USER' },
        },
      },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/비밀번호/i), { target: { value: 'password123!' } });
    fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('mock-access');
    });
  });

  test('로그인 API 실패 시 에러 Alert 표시', async () => {
    authApi.login.mockRejectedValueOnce({
      response: { data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
    });

    renderLogin();
    fireEvent.change(screen.getByLabelText(/이메일/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/비밀번호/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

    await waitFor(() => {
      expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
    });
  });

  test('회원가입 링크가 존재함', () => {
    renderLogin();
    expect(screen.getByText('회원가입')).toBeInTheDocument();
  });
});
