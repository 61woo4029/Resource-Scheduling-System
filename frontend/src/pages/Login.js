import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { login } from '../store/authSlice';
import { authApi } from '../services/api';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data);
      dispatch(login(res.data.data));
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <Box sx={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-15%', right: '-5%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', top: '30%', right: '15%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,200,255,0.15)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      <Card sx={{
        width: 420, mx: 2,
        backdropFilter: 'blur(20px)',
        background: 'rgba(255, 255, 255, 0.97)',
        borderRadius: '28px !important',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.5) !important',
        position: 'relative',
        zIndex: 1,
        border: 'none !important',
      }}>
        <CardContent sx={{ p: 4.5 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '24px', mx: 'auto', mb: 2.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 40px rgba(108, 99, 255, 0.45)',
              fontSize: 36,
            }}>
              <span>🏢</span>
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5,
            }}>
              사내 자원관리 시스템
            </Typography>
            <Typography variant="body2" color="text.secondary">
              계정에 로그인하여 시작하세요
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '12px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth label="이메일" margin="normal" type="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#6C63FF', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              {...register('email', { required: '이메일을 입력하세요' })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              fullWidth label="비밀번호" margin="normal"
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#6C63FF', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end" size="small"
                    >
                      {showPassword
                        ? <VisibilityOffIcon sx={{ fontSize: 18 }} />
                        : <VisibilityIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              {...register('password', { required: '비밀번호를 입력하세요' })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              fullWidth variant="contained" type="submit"
              sx={{
                mt: 3, mb: 1.5, py: 1.6,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.3px',
                borderRadius: '14px !important',
                boxShadow: '0 8px 24px rgba(108, 99, 255, 0.4) !important',
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : '로그인'}
            </Button>
          </form>

          <Typography align="center" variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            계정이 없으신가요?{' '}
            <Link to="/register" style={{
              color: '#6C63FF', fontWeight: 700, textDecoration: 'none',
            }}>
              회원가입
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
