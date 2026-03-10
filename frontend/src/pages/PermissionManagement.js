import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, TablePagination,
} from '@mui/material';
import { permissionApi } from '../services/api';

const statusLabel = (s) => ({ PENDING: '대기중', APPROVED: '승인', REJECTED: '거절' }[s] || s);
const statusColor = (s) => ({ APPROVED: 'success', REJECTED: 'error', PENDING: 'warning' }[s] || 'default');
const roleLabel = (r) => ({ USER: '일반 사용자', ASSET_ADMIN: '자산 관리자', SYSTEM_ADMIN: '시스템 관리자' }[r] || r);

export default function PermissionManagement() {
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [actionDialog, setActionDialog] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const statusTabs = ['PENDING', 'APPROVED', 'REJECTED'];

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  useEffect(() => { fetchRequests(); }, [tab, page, rowsPerPage]);

  const fetchRequests = async () => {
    try {
      const res = await permissionApi.getRequests({
        status: statusTabs[tab],
        page,
        size: rowsPerPage,
      });
      setRequests(res.data.data?.items || []);
      setTotal(res.data.data?.pagination?.totalItems || 0);
    } catch {}
  };

  const handleAction = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setAdminComment('');
    setActionDialog(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (actionType === 'approve') {
        await permissionApi.approveRequest(selectedReq.requestId, { adminComment });
        showAlert('승인되었습니다.');
      } else {
        await permissionApi.rejectRequest(selectedReq.requestId, { adminComment });
        showAlert('거절되었습니다.');
      }
      setActionDialog(false);
      fetchRequests();
    } catch (e) {
      showAlert(e.response?.data?.message || '처리 실패', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">권한 신청 관리</Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="대기중" />
        <Tab label="승인됨" />
        <Tab label="거절됨" />
      </Tabs>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell align="center">신청일</TableCell>
              <TableCell align="center">신청자</TableCell>
              <TableCell align="center">부서</TableCell>
              <TableCell align="center">현재 역할</TableCell>
              <TableCell align="center">신청 역할</TableCell>
              <TableCell align="center">사유</TableCell>
              <TableCell align="center">상태</TableCell>
              {tab === 0 && <TableCell align="center">처리</TableCell>}
              {tab !== 0 && <TableCell align="center">처리일</TableCell>}
              {tab !== 0 && <TableCell align="center">처리 의견</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map(r => (
              <TableRow key={r.requestId} hover>
                <TableCell align="center">{r.createdAt?.split('T')[0]}</TableCell>
                <TableCell align="center">{r.userName}</TableCell>
                <TableCell align="center">{r.departmentName}</TableCell>
                <TableCell align="center">{roleLabel(r.currentRole)}</TableCell>
                <TableCell align="center">{roleLabel(r.requestedRole)}</TableCell>
                <TableCell align="center" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.reason}
                </TableCell>
                <TableCell align="center">
                  <Chip label={statusLabel(r.status)} size="small" color={statusColor(r.status)} />
                </TableCell>
                {tab === 0 && (
                  <TableCell align="center">
                    <Button size="small" variant="contained" color="success" onClick={() => handleAction(r, 'approve')} sx={{ mr: 0.5 }}>승인</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleAction(r, 'reject')}>거절</Button>
                  </TableCell>
                )}
                {tab !== 0 && <TableCell align="center">{r.processedAt?.split('T')[0] || '-'}</TableCell>}
                {tab !== 0 && <TableCell align="center">{r.adminComment || '-'}</TableCell>}
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={tab === 0 ? 8 : 9} align="center" sx={{ py: 3 }}>
                  {tab === 0 ? '대기중인 신청이 없습니다.' : '데이터 없음'}
                </TableCell>
              </TableRow>
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

      {/* 처리 다이얼로그 */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{actionType === 'approve' ? '권한 승인' : '권한 거절'}</DialogTitle>
        <DialogContent>
          {selectedReq && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2"><strong>신청자:</strong> {selectedReq.userName}</Typography>
              <Typography variant="body2"><strong>신청 역할:</strong> {roleLabel(selectedReq.requestedRole)}</Typography>
              <Typography variant="body2"><strong>사유:</strong> {selectedReq.reason}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="처리 의견 (선택)"
            multiline rows={3}
            value={adminComment}
            onChange={e => setAdminComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>취소</Button>
          <Button variant="contained" color={actionType === 'approve' ? 'success' : 'error'} onClick={handleConfirmAction}>
            {actionType === 'approve' ? '승인' : '거절'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
