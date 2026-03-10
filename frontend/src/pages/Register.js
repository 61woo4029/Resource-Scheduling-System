import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  CircularProgress, MenuItem, Select, FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import { authApi, departmentApi } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  useEffect(() => {
    departmentApi.getDepartments().then(res => setDepartments(res.data.data || [])).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await authApi.register({ ...data, departmentId: Number(data.departmentId) });
      navigate('/login');
    } catch (e) {
      setError(e.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', py: 4 }}>
      <Card sx={{ width: 450, p: 2 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
            사내 자원관리 시스템
          </Typography>
          <Typography variant="h6" align="center" gutterBottom color="text.secondary">
            회원가입
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth label="이메일" margin="normal" type="email"
              {...register('email', {
                required: '이메일을 입력하세요',
                pattern: { value: /^[a-zA-Z0-9.]+@selim\.kr$/, message: '@selim.kr 도메인만 허용됩니다' }
              })}
              error={!!errors.email} helperText={errors.email?.message}
            />
            <TextField
              fullWidth label="비밀번호" margin="normal" type="password"
              {...register('password', {
                required: '비밀번호를 입력하세요',
                minLength: { value: 8, message: '8자 이상 입력하세요' },
                pattern: { value: /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/, message: '소문자, 숫자, 특수문자를 포함해야 합니다' }
              })}
              error={!!errors.password} helperText={errors.password?.message}
            />
            <TextField
              fullWidth label="비밀번호 확인" margin="normal" type="password"
              {...register('passwordConfirm', {
                required: '비밀번호 확인을 입력하세요',
                validate: (v) => v === watch('password') || '비밀번호가 일치하지 않습니다'
              })}
              error={!!errors.passwordConfirm} helperText={errors.passwordConfirm?.message}
            />
            <TextField
              fullWidth label="이름" margin="normal"
              {...register('name', { required: '이름을 입력하세요' })}
              error={!!errors.name} helperText={errors.name?.message}
            />
            <FormControl fullWidth margin="normal" error={!!errors.departmentId}>
              <InputLabel>부서</InputLabel>
              <Select
                label="부서"
                defaultValue=""
                {...register('departmentId', { required: '부서를 선택하세요' })}
              >
                {departments.map((d) => (
                  <MenuItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</MenuItem>
                ))}
              </Select>
              {errors.departmentId && <FormHelperText>{errors.departmentId.message}</FormHelperText>}
            </FormControl>
            <TextField
              fullWidth label="직급" margin="normal"
              {...register('position', { required: '직급을 입력하세요' })}
              error={!!errors.position} helperText={errors.position?.message}
            />
            <TextField
              fullWidth label="전화번호" margin="normal" placeholder="010-0000-0000"
              {...register('phone', {
                required: '전화번호를 입력하세요',
                pattern: { value: /^010-\d{4}-\d{4}$/, message: '010-XXXX-XXXX 형식으로 입력하세요' }
              })}
              error={!!errors.phone} helperText={errors.phone?.message}
            />
            <Button fullWidth variant="contained" type="submit" sx={{ mt: 2, mb: 1 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : '가입하기'}
            </Button>
          </form>
          <Typography align="center" variant="body2" sx={{ mt: 1 }}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" style={{ color: '#1976d2' }}>로그인</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
