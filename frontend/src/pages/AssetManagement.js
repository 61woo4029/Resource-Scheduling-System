import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Tabs, Tab, Button, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Snackbar, Alert, TablePagination, Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { assetApi } from '../services/api';

const categories = [
  { value: 'DESKTOP', label: '데스크탑' },
  { value: 'LAPTOP', label: '노트북' },
  { value: 'SERVER', label: '서버' },
  { value: 'MONITOR', label: '모니터' },
];

const statusOptions = ['사용', '미사용', '폐기'];

const emptyForm = {
  assetNumber: '', category: '', userName: '', status: '미사용',
  purchaseMonth: '', manufacturer: '', modelName: '', serialNumber: '',
  os: '', cpu: '', ram: '', ssd: '', hdd: '', notes: '',
};

export default function AssetManagement() {
  const user = useSelector(s => s.auth.user);
  const isAdmin = user?.role === 'ASSET_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const [tab, setTab] = useState(0);
  const [assets, setAssets] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchNumber, setSearchNumber] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const currentCategory = categories[tab].value;

  useEffect(() => { fetchAssets(); }, [tab, page, rowsPerPage]);

  const fetchAssets = async () => {
    try {
      const res = await assetApi.getAssets({
        category: currentCategory, page, size: rowsPerPage,
        asset_number: searchNumber || undefined, user_name: searchUser || undefined,
        status: searchStatus || undefined,
      });
      setAssets(res.data.data?.items || []);
      setTotal(res.data.data?.pagination?.totalItems || 0);
    } catch {}
  };

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  const handleSearch = () => { setPage(0); fetchAssets(); };

  const handleOpenDialog = (asset = null) => {
    setEditingAsset(asset);
    setForm(asset ? { ...asset } : { ...emptyForm, category: currentCategory });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingAsset) {
        await assetApi.updateAsset(editingAsset.assetId, form);
        showAlert('자산이 수정되었습니다.');
      } else {
        await assetApi.createAsset({ ...form, category: currentCategory });
        showAlert('자산이 등록되었습니다.');
      }
      setDialogOpen(false);
      fetchAssets();
    } catch (e) {
      showAlert(e.response?.data?.message || '저장 실패', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await assetApi.deleteAsset(id);
      showAlert('삭제되었습니다.');
      fetchAssets();
    } catch (e) {
      showAlert(e.response?.data?.message || '삭제 실패', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`${selectedAssets.length}개를 삭제하시겠습니까?`)) return;
    try {
      await assetApi.deleteAssets(selectedAssets);
      setSelectedAssets([]);
      showAlert('삭제되었습니다.');
      fetchAssets();
    } catch (e) {
      showAlert('삭제 실패', 'error');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    try {
      const res = await assetApi.uploadAssets(uploadFile, currentCategory);
      setUploadResult(res.data.data);
      showAlert('업로드 완료');
      fetchAssets();
    } catch (e) {
      showAlert('업로드 실패', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await assetApi.downloadTemplate(currentCategory);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `template_${currentCategory}.xlsx`; a.click();
    } catch {}
  };

  const handleExport = async () => {
    try {
      const res = await assetApi.exportAssets(currentCategory);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `assets_${currentCategory}.xlsx`; a.click();
    } catch {}
  };

  const isMonitor = currentCategory === 'MONITOR';

  const toggleSelect = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">자산 관리</Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); setSelectedAssets([]); }} sx={{ mb: 2 }}>
        {categories.map(c => <Tab key={c.value} label={c.label} />)}
      </Tabs>

      {isAdmin && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>자산 등록</Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setUploadDialogOpen(true)}>일괄 업로드</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTemplate}>템플릿</Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>엑셀 다운로드</Button>
          {selectedAssets.length > 0 && (
            <Button variant="outlined" color="error" onClick={handleDeleteSelected}>
              선택 삭제 ({selectedAssets.length})
            </Button>
          )}
        </Box>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField size="small" label="자산관리번호" value={searchNumber} onChange={e => setSearchNumber(e.target.value)} />
        <TextField size="small" label="사용자명" value={searchUser} onChange={e => setSearchUser(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>상태</InputLabel>
          <Select label="상태" value={searchStatus} onChange={e => setSearchStatus(e.target.value)}>
            <MenuItem value="">전체</MenuItem>
            {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSearch}>검색</Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              {isAdmin && <TableCell align="center" sx={{ width: 50, whiteSpace: 'nowrap' }}><Checkbox size="small" /></TableCell>}
              <TableCell align="center" sx={{ width: 60, whiteSpace: 'nowrap' }}>NO.</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>자산관리번호</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>사용자명</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>제조사</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>모델명</TableCell>
              <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>S/N</TableCell>
              {!isMonitor && <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>OS</TableCell>}
              {!isMonitor && <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>CPU</TableCell>}
              {!isMonitor && <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>RAM</TableCell>}
              <TableCell align="center" sx={{ width: 80, whiteSpace: 'nowrap' }}>상태</TableCell>
              {isAdmin && <TableCell align="center" sx={{ width: 90, whiteSpace: 'nowrap' }}>관리</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset, idx) => (
              <TableRow key={asset.assetId} hover>
                {isAdmin && (
                  <TableCell align="center">
                    <Checkbox size="small" checked={selectedAssets.includes(asset.assetId)}
                      onChange={() => toggleSelect(asset.assetId)} />
                  </TableCell>
                )}
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{page * rowsPerPage + idx + 1}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.assetNumber}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.userName}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.manufacturer}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.modelName}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.serialNumber}</TableCell>
                {!isMonitor && <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.os}</TableCell>}
                {!isMonitor && <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.cpu}</TableCell>}
                {!isMonitor && <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>{asset.ram}</TableCell>}
                <TableCell align="center">
                  <Chip label={asset.status} size="small"
                    color={asset.status === '사용' ? 'success' : asset.status === '폐기' ? 'error' : 'default'} />
                </TableCell>
                {isAdmin && (
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleOpenDialog(asset)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(asset.assetId)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {assets.length === 0 && (
              <TableRow><TableCell colSpan={12} align="center" sx={{ py: 3 }}>데이터 없음</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div" count={total} page={page} rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="페이지당 행:"
      />

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingAsset ? '자산 수정' : '자산 등록'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              ['assetNumber', '자산관리번호*'],
              ['userName', '사용자명*'],
              ['purchaseMonth', '구입년월 (YYYY-MM)'],
              ['manufacturer', '제조사'],
              ['modelName', '모델명'],
              ['serialNumber', 'S/N'],
            ].map(([key, label]) => (
              <Grid size={6} key={key}>
                <TextField fullWidth size="small" label={label} value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </Grid>
            ))}
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>상태</InputLabel>
                <Select label="상태" value={form.status || '미사용'}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {!isMonitor && ['os', 'cpu', 'ram', 'ssd', 'hdd'].map(key => (
              <Grid size={6} key={key}>
                <TextField fullWidth size="small" label={key.toUpperCase()} value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </Grid>
            ))}
            <Grid size={12}>
              <TextField fullWidth size="small" label="기타사항" multiline rows={2} value={form.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* 업로드 다이얼로그 */}
      <Dialog open={uploadDialogOpen} onClose={() => { setUploadDialogOpen(false); setUploadResult(null); setUploadFile(null); }}>
        <DialogTitle>엑셀 업로드</DialogTitle>
        <DialogContent>
          <input type="file" accept=".xlsx,.xls" onChange={e => setUploadFile(e.target.files[0])} style={{ marginTop: 8 }} />
          {uploadResult && (
            <Box sx={{ mt: 2 }}>
              <Typography>전체: {uploadResult.total}, 성공: {uploadResult.success}, 실패: {uploadResult.failed}</Typography>
              {uploadResult.errors?.map((e, i) => (
                <Typography key={i} variant="body2" color="error">행 {e.row}: {e.reason}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialogOpen(false); setUploadResult(null); setUploadFile(null); }}>닫기</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!uploadFile}>업로드</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
