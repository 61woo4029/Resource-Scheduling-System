import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Select, MenuItem,
  FormControl, InputLabel, Snackbar, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { departmentApi } from '../services/api';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [form, setForm] = useState({ departmentName: '', parentId: '', sortOrder: '' });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.getDepartments();
      setDepartments(res.data.data || []);
    } catch {}
  };

  const handleOpenDialog = (dept = null) => {
    setEditingDept(dept);
    setForm(dept ? { departmentName: dept.departmentName, parentId: dept.parentId || '', sortOrder: dept.sortOrder || '' } : { departmentName: '', parentId: '', sortOrder: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        departmentName: form.departmentName,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : null,
      };
      if (editingDept) {
        await departmentApi.updateDepartment(editingDept.departmentId, payload);
        showAlert('부서가 수정되었습니다.');
      } else {
        await departmentApi.createDepartment(payload);
        showAlert('부서가 등록되었습니다.');
      }
      setDialogOpen(false);
      fetchDepartments();
    } catch (e) {
      showAlert(e.response?.data?.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('부서를 삭제하시겠습니까?\n소속 사용자가 있으면 삭제가 제한될 수 있습니다.')) return;
    try {
      await departmentApi.deleteDepartment(id);
      showAlert('부서가 삭제되었습니다.');
      fetchDepartments();
    } catch (e) {
      showAlert(e.response?.data?.message || '삭제 실패', 'error');
    }
  };

  // 계층 구조 정렬
  const buildTree = (depts) => {
    const result = [];
    const map = {};
    depts.forEach(d => { map[d.departmentId] = { ...d, children: [] }; });
    depts.forEach(d => {
      if (d.parentId && map[d.parentId]) {
        map[d.parentId].children.push(map[d.departmentId]);
      } else {
        result.push(map[d.departmentId]);
      }
    });
    return result;
  };

  const flattenTree = (tree, level = 0) => {
    const result = [];
    tree.forEach(node => {
      result.push({ ...node, level });
      if (node.children?.length) {
        result.push(...flattenTree(node.children, level + 1));
      }
    });
    return result;
  };

  const flatDepts = flattenTree(buildTree(departments));
  const topLevelDepts = departments.filter(d => !d.parentId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">부서 관리</Typography>

      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        부서 등록
      </Button>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell align="center">부서명</TableCell>
              <TableCell align="center">상위 부서</TableCell>
              <TableCell align="center">정렬순서</TableCell>
              <TableCell align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flatDepts.map(dept => (
              <TableRow key={dept.departmentId} hover>
                <TableCell sx={{ pl: 2 + dept.level * 3 }}>
                  {dept.level > 0 && '└ '}{dept.departmentName}
                </TableCell>
                <TableCell align="center">
                  {departments.find(d => d.departmentId === dept.parentId)?.departmentName || '-'}
                </TableCell>
                <TableCell align="center">{dept.sortOrder || '-'}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(dept)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(dept.departmentId)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {departments.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>데이터 없음</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDept ? '부서 수정' : '부서 등록'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField fullWidth size="small" label="부서명*" value={form.departmentName} onChange={e => setForm(f => ({ ...f, departmentName: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>상위 부서</InputLabel>
                <Select label="상위 부서" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <MenuItem value="">없음 (최상위)</MenuItem>
                  {topLevelDepts.filter(d => !editingDept || d.departmentId !== editingDept.departmentId).map(d => (
                    <MenuItem key={d.departmentId} value={d.departmentId}>{d.departmentName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="정렬순서" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave}>저장</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
