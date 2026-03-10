import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel, Checkbox,
  FormControlLabel, Snackbar, Alert, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { menuApi } from '../services/api';

const roleOptions = ['USER', 'ASSET_ADMIN', 'SYSTEM_ADMIN'];
const roleLabel = (r) => ({ USER: '일반', ASSET_ADMIN: '자산관리자', SYSTEM_ADMIN: '시스템관리자' }[r] || r);

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [form, setForm] = useState({ menuName: '', menuPath: '', icon: '', parentId: '', sortOrder: '', roles: ['USER', 'ASSET_ADMIN', 'SYSTEM_ADMIN'], isVisible: true });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      const res = await menuApi.getMenus();
      setMenus(res.data.data || []);
    } catch {}
  };

  const handleOpenDialog = (menu = null) => {
    setEditingMenu(menu);
    setForm(menu ? {
      menuName: menu.menuName,
      menuPath: menu.menuPath || '',
      icon: menu.icon || '',
      parentId: menu.parentId || '',
      sortOrder: menu.sortOrder || '',
      roles: menu.roles || ['USER', 'ASSET_ADMIN', 'SYSTEM_ADMIN'],
      isVisible: menu.isVisible !== false,
    } : {
      menuName: '', menuPath: '', icon: '', parentId: '', sortOrder: '',
      roles: ['USER', 'ASSET_ADMIN', 'SYSTEM_ADMIN'], isVisible: true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        parentId: form.parentId || null,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : null,
      };
      if (editingMenu) {
        await menuApi.updateMenu(editingMenu.menuId, payload);
        showAlert('메뉴가 수정되었습니다.');
      } else {
        await menuApi.createMenu(payload);
        showAlert('메뉴가 등록되었습니다.');
      }
      setDialogOpen(false);
      fetchMenus();
    } catch (e) {
      showAlert(e.response?.data?.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('메뉴를 삭제하시겠습니까?')) return;
    try {
      await menuApi.deleteMenu(id);
      showAlert('메뉴가 삭제되었습니다.');
      fetchMenus();
    } catch (e) {
      showAlert(e.response?.data?.message || '삭제 실패', 'error');
    }
  };

  const toggleRole = (role) => {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }));
  };

  // 계층 구조 정렬
  const buildTree = (items) => {
    const result = [];
    const map = {};
    items.forEach(m => { map[m.menuId] = { ...m, children: [] }; });
    items.forEach(m => {
      if (m.parentId && map[m.parentId]) {
        map[m.parentId].children.push(map[m.menuId]);
      } else {
        result.push(map[m.menuId]);
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

  const flatMenus = flattenTree(buildTree(menus));
  const parentMenus = menus.filter(m => !m.parentId);

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">메뉴 관리</Typography>

      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} sx={{ mb: 2 }}>
        메뉴 등록
      </Button>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell align="center">메뉴명</TableCell>
              <TableCell align="center">경로</TableCell>
              <TableCell align="center">아이콘</TableCell>
              <TableCell align="center">접근 역할</TableCell>
              <TableCell align="center">정렬</TableCell>
              <TableCell align="center">표시여부</TableCell>
              <TableCell align="center">관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flatMenus.map(menu => (
              <TableRow key={menu.menuId} hover>
                <TableCell sx={{ pl: 2 + menu.level * 3 }}>
                  {menu.level > 0 && '└ '}{menu.menuName}
                </TableCell>
                <TableCell align="center">{menu.menuPath || '-'}</TableCell>
                <TableCell align="center">{menu.icon || '-'}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {(menu.roles || []).map(r => (
                      <Chip key={r} label={roleLabel(r)} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell align="center">{menu.sortOrder || '-'}</TableCell>
                <TableCell align="center">
                  <Chip label={menu.isVisible !== false ? '표시' : '숨김'} size="small" color={menu.isVisible !== false ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => handleOpenDialog(menu)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(menu.menuId)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {menus.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3 }}>데이터 없음</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMenu ? '메뉴 수정' : '메뉴 등록'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={6}>
              <TextField fullWidth size="small" label="메뉴명*" value={form.menuName} onChange={e => setForm(f => ({ ...f, menuName: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="경로 (예: /dashboard)" value={form.menuPath} onChange={e => setForm(f => ({ ...f, menuPath: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="아이콘" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="정렬순서" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>상위 메뉴</InputLabel>
                <Select label="상위 메뉴" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <MenuItem value="">없음 (최상위)</MenuItem>
                  {parentMenus.filter(m => !editingMenu || m.menuId !== editingMenu.menuId).map(m => (
                    <MenuItem key={m.menuId} value={m.menuId}>{m.menuName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" gutterBottom>접근 가능 역할</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {roleOptions.map(r => (
                  <FormControlLabel
                    key={r}
                    control={<Checkbox size="small" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />}
                    label={roleLabel(r)}
                  />
                ))}
              </Box>
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={<Checkbox checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} />}
                label="메뉴 표시"
              />
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
