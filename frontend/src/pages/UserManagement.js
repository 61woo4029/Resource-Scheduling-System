import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Chip, Snackbar, Alert, TablePagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { userApi, departmentApi } from '../services/api';

const roleOptions = [
  { value: 'USER', label: '일반 사용자' },
  { value: 'ASSET_ADMIN', label: '자산 관리자' },
  { value: 'SYSTEM_ADMIN', label: '시스템 관리자' },
];

const roleColor = (role) => {
  if (role === 'SYSTEM_ADMIN') return 'error';
  if (role === 'ASSET_ADMIN') return 'warning';
  return 'default';
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', position: '', phone: '', role: '', departmentId: '', isActive: true });
  const [pwResetDialog, setPwResetDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  useEffect(() => { departmentApi.getDepartments().then(r => setDepartments(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => { fetchUsers(); }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      const res = await userApi.getUsers({
        page, size: rowsPerPage,
        name: searchName || undefined,
        departmentId: searchDept || undefined,
        role: searchRole || undefined,
      });
      setUsers(res.data.data?.items || []);
      setTotal(res.data.data?.pagination?.totalItems || 0);
    } catch {}
  };

  const handleSearch = () => { setPage(0); fetchUsers(); };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name, position: user.position || '', phone: user.phone || '', role: user.role, departmentId: user.departmentId || '', isActive: user.isActive !== false });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await userApi.updateUser(editingUser.userId, editForm);
      showAlert('사용자 정보가 수정되었습니다.');
      setDialogOpen(false);
      fetchUsers();
    } catch (e) {
      showAlert(e.response?.data?.message || '수정 실패', 'error');
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      showAlert('비밀번호는 8자 이상이어야 합니다.', 'error');
      return;
    }
    try {
      await userApi.resetPassword(editingUser.userId, { newPassword });
      showAlert('비밀번호가 초기화되었습니다.');
      setPwResetDialog(false);
      setNewPassword('');
    } catch (e) {
      showAlert(e.response?.data?.message || '초기화 실패', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">사용자 관리</Typography>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField size="small" label="이름" value={searchName} onChange={e => setSearchName(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>부서</InputLabel>
          <Select label="부서" value={searchDept} onChange={e => setSearchDept(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {departments.map(d => <MenuItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>역할</InputLabel>
          <Select label="역할" value={searchRole} onChange={e => setSearchRole(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {roleOptions.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSearch}>검색</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell align="center">NO.</TableCell>
              <TableCell align="center">이름</TableCell>
              <TableCell align="center">이메일</TableCell>
              <TableCell align="center">부서</TableCell>
              <TableCell align="center">직급</TableCell>
              <TableCell align="center">전화번호</TableCell>
              <TableCell align="center">역할</TableCell>
              <TableCell align="center">상태</TableCell>
              <TableCell align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u, idx) => (
              <TableRow key={u.userId} hover>
                <TableCell align="center">{page * rowsPerPage + idx + 1}</TableCell>
                <TableCell align="center">{u.name}</TableCell>
                <TableCell align="center">{u.email}</TableCell>
                <TableCell align="center">{u.departmentName}</TableCell>
                <TableCell align="center">{u.position}</TableCell>
                <TableCell align="center">{u.phone}</TableCell>
                <TableCell align="center">
                  <Chip label={roleOptions.find(r => r.value === u.role)?.label || u.role} size="small" color={roleColor(u.role)} />
                </TableCell>
                <TableCell align="center">
                  <Chip label={u.isActive !== false ? '활성' : '비활성'} size="small" color={u.isActive !== false ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenEdit(u)}><EditIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}>데이터 없음</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div" count={total} page={page} rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="페이지당 행:"
      />

      {/* 사용자 수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>사용자 수정</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={6}>
              <TextField fullWidth size="small" label="이름" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="직급" value={editForm.position} onChange={e => setEditForm(f => ({ ...f, position: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="전화번호" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>부서</InputLabel>
                <Select label="부서" value={editForm.departmentId} onChange={e => setEditForm(f => ({ ...f, departmentId: e.target.value }))}>
                  {departments.map(d => <MenuItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>역할</InputLabel>
                <Select label="역할" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {roleOptions.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>상태</InputLabel>
                <Select label="상태" value={editForm.isActive} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value }))}>
                  <MenuItem value={true}>활성</MenuItem>
                  <MenuItem value={false}>비활성</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPwResetDialog(true); setDialogOpen(false); }}>비밀번호 초기화</Button>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* 비밀번호 초기화 다이얼로그 */}
      <Dialog open={pwResetDialog} onClose={() => setPwResetDialog(false)}>
        <DialogTitle>비밀번호 초기화 - {editingUser?.name}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="새 비밀번호" type="password" sx={{ mt: 2 }} value={newPassword} onChange={e => setNewPassword(e.target.value)} helperText="8자 이상" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwResetDialog(false)}>취소</Button>
          <Button variant="contained" onClick={handlePasswordReset}>초기화</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
