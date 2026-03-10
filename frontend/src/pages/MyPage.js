import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Grid, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, Snackbar, Alert,
} from '@mui/material';
import { updateUser } from '../store/authSlice';
import { userApi, permissionApi, roomReservationApi, vehicleReservationApi } from '../services/api';

const statusColor = (s) => {
  if (s === 'CONFIRMED' || s === 'APPROVED') return 'success';
  if (s === 'CANCELLED' || s === 'REJECTED') return 'error';
  return 'warning';
};

const statusLabel = (s) => {
  const m = { CONFIRMED: '확정', CANCELLED: '취소됨', PENDING: '대기중', APPROVED: '승인', REJECTED: '거절' };
  return m[s] || s;
};

export default function MyPage() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const [tab, setTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // 내 정보
  const [infoForm, setInfoForm] = useState({ name: '', phone: '', position: '' });
  const [infoLoading, setInfoLoading] = useState(false);

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');

  // 예약 내역
  const [roomReservations, setRoomReservations] = useState([]);
  const [vehicleReservations, setVehicleReservations] = useState([]);

  // 권한 신청
  const [myRequests, setMyRequests] = useState([]);
  const [reqDialog, setReqDialog] = useState(false);
  const [reqForm, setReqForm] = useState({ requestedRole: 'ASSET_ADMIN', reason: '' });

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  useEffect(() => {
    if (user) {
      setInfoForm({ name: user.name || '', phone: user.phone || '', position: user.position || '' });
    }
  }, [user]);

  useEffect(() => {
    if (tab === 2) {
      roomReservationApi.getMyReservations().then(r => setRoomReservations(r.data.data || [])).catch(() => {});
      vehicleReservationApi.getMyReservations().then(r => setVehicleReservations(r.data.data || [])).catch(() => {});
    }
    if (tab === 3) {
      permissionApi.getMyRequests().then(r => setMyRequests(r.data.data || [])).catch(() => {});
    }
  }, [tab]);

  const handleInfoSave = async () => {
    setInfoLoading(true);
    try {
      const res = await userApi.updateProfile(infoForm);
      dispatch(updateUser(res.data.data));
      showAlert('정보가 수정되었습니다.');
    } catch (e) {
      showAlert(e.response?.data?.message || '수정 실패', 'error');
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    try {
      await userApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showAlert('비밀번호가 변경되었습니다.');
    } catch (e) {
      showAlert(e.response?.data?.message || '변경 실패', 'error');
    }
  };

  const handleCancelRoomRes = async (id) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await roomReservationApi.cancelReservation(id);
      showAlert('예약이 취소되었습니다.');
      roomReservationApi.getMyReservations().then(r => setRoomReservations(r.data.data || [])).catch(() => {});
    } catch (e) {
      showAlert(e.response?.data?.message || '취소 실패', 'error');
    }
  };

  const handleCancelVehicleRes = async (id) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await vehicleReservationApi.deleteReservation(id);
      showAlert('예약이 취소되었습니다.');
      vehicleReservationApi.getMyReservations().then(r => setVehicleReservations(r.data.data || [])).catch(() => {});
    } catch (e) {
      showAlert(e.response?.data?.message || '취소 실패', 'error');
    }
  };

  const handlePermissionRequest = async () => {
    try {
      await permissionApi.createRequest(reqForm);
      setReqDialog(false);
      showAlert('권한 신청이 제출되었습니다.');
      permissionApi.getMyRequests().then(r => setMyRequests(r.data.data || [])).catch(() => {});
    } catch (e) {
      showAlert(e.response?.data?.message || '신청 실패', 'error');
    }
  };

  const roleLabel = (r) => {
    const m = { USER: '일반 사용자', ASSET_ADMIN: '자산 관리자', SYSTEM_ADMIN: '시스템 관리자' };
    return m[r] || r;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">마이페이지</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="내 정보" />
        <Tab label="비밀번호 변경" />
        <Tab label="예약 내역" />
        <Tab label="권한 신청" />
      </Tabs>

      {/* 내 정보 */}
      {tab === 0 && (
        <Card sx={{ maxWidth: 500 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth label="이메일" value={user?.email || ''} disabled />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="부서" value={user?.departmentName || ''} disabled />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="역할" value={roleLabel(user?.role)} disabled />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="이름" value={infoForm.name} onChange={e => setInfoForm(f => ({ ...f, name: e.target.value }))} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="직급" value={infoForm.position} onChange={e => setInfoForm(f => ({ ...f, position: e.target.value }))} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="전화번호" placeholder="010-0000-0000" value={infoForm.phone} onChange={e => setInfoForm(f => ({ ...f, phone: e.target.value }))} />
              </Grid>
              <Grid size={12}>
                <Button variant="contained" onClick={handleInfoSave} disabled={infoLoading} fullWidth>저장</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 비밀번호 변경 */}
      {tab === 1 && (
        <Card sx={{ maxWidth: 400 }}>
          <CardContent>
            <Grid container spacing={2}>
              {pwError && (
                <Grid size={12}>
                  <Alert severity="error">{pwError}</Alert>
                </Grid>
              )}
              <Grid size={12}>
                <TextField fullWidth label="현재 비밀번호" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="새 비밀번호" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} helperText="8자 이상, 소문자/숫자/특수문자 포함" />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth label="새 비밀번호 확인" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </Grid>
              <Grid size={12}>
                <Button variant="contained" onClick={handlePasswordChange} fullWidth>변경</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 예약 내역 */}
      {tab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>회의실 예약</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell align="center">날짜</TableCell>
                  <TableCell align="center">회의실</TableCell>
                  <TableCell align="center">시간</TableCell>
                  <TableCell align="center">회의제목</TableCell>
                  <TableCell align="center">상태</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roomReservations.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>예약 내역 없음</TableCell></TableRow>
                ) : roomReservations.map(r => (
                  <TableRow key={r.reservationId} hover>
                    <TableCell align="center">{r.reservationDate}</TableCell>
                    <TableCell align="center">{r.room?.roomName}</TableCell>
                    <TableCell align="center">{r.startTime}~{r.endTime}</TableCell>
                    <TableCell align="center">{r.meetingTitle}</TableCell>
                    <TableCell align="center">
                      <Chip label={statusLabel(r.status)} size="small" color={statusColor(r.status)} />
                    </TableCell>
                    <TableCell align="center">
                      {r.status === 'CONFIRMED' && (
                        <Button size="small" color="error" onClick={() => handleCancelRoomRes(r.reservationId)}>취소</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom>차량 예약</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell align="center">날짜</TableCell>
                  <TableCell align="center">차량</TableCell>
                  <TableCell align="center">시간</TableCell>
                  <TableCell align="center">목적</TableCell>
                  <TableCell align="center">행선지</TableCell>
                  <TableCell align="center">상태</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicleReservations.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>예약 내역 없음</TableCell></TableRow>
                ) : vehicleReservations.map(r => (
                  <TableRow key={r.reservationId} hover>
                    <TableCell align="center">{r.reservationDate}</TableCell>
                    <TableCell align="center">{r.vehicle?.vehicleType} ({r.vehicle?.vehicleNumber})</TableCell>
                    <TableCell align="center">{r.startTime}~{r.endTime}</TableCell>
                    <TableCell align="center">{r.purpose}</TableCell>
                    <TableCell align="center">{r.destination}</TableCell>
                    <TableCell align="center">
                      <Chip label={statusLabel(r.status)} size="small" color={statusColor(r.status)} />
                    </TableCell>
                    <TableCell align="center">
                      {r.status === 'CONFIRMED' && (
                        <Button size="small" color="error" onClick={() => handleCancelVehicleRes(r.reservationId)}>취소</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 권한 신청 */}
      {tab === 3 && (
        <Box>
          {user?.role === 'USER' && (
            <Button variant="contained" onClick={() => setReqDialog(true)} sx={{ mb: 2 }}>권한 신청</Button>
          )}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell align="center">신청일</TableCell>
                  <TableCell align="center">신청 역할</TableCell>
                  <TableCell align="center">사유</TableCell>
                  <TableCell align="center">상태</TableCell>
                  <TableCell align="center">처리일</TableCell>
                  <TableCell align="center">처리 의견</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>신청 내역 없음</TableCell></TableRow>
                ) : myRequests.map(r => (
                  <TableRow key={r.requestId} hover>
                    <TableCell align="center">{r.createdAt?.split('T')[0]}</TableCell>
                    <TableCell align="center">{roleLabel(r.requestedRole)}</TableCell>
                    <TableCell align="center">{r.reason}</TableCell>
                    <TableCell align="center">
                      <Chip label={statusLabel(r.status)} size="small" color={statusColor(r.status)} />
                    </TableCell>
                    <TableCell align="center">{r.processedAt?.split('T')[0] || '-'}</TableCell>
                    <TableCell align="center">{r.adminComment || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 권한 신청 다이얼로그 */}
      <Dialog open={reqDialog} onClose={() => setReqDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>권한 신청</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>신청 역할</InputLabel>
                <Select label="신청 역할" value={reqForm.requestedRole} onChange={e => setReqForm(f => ({ ...f, requestedRole: e.target.value }))}>
                  <MenuItem value="ASSET_ADMIN">자산 관리자</MenuItem>
                  <MenuItem value="SYSTEM_ADMIN">시스템 관리자</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="신청 사유" multiline rows={3} value={reqForm.reason} onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReqDialog(false)}>취소</Button>
          <Button variant="contained" onClick={handlePermissionRequest}>신청</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
