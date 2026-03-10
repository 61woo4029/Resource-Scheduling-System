import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Tabs, Tab, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Chip, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert,
  Popover,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import { vehicleApi, vehicleReservationApi } from '../services/api';

dayjs.locale('ko');

const TIME_SLOTS = [];
for (let h = 8; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const COLORS = [
  '#BBDEFB', '#C8E6C9', '#FFE0B2', '#F8BBD0', '#E1BEE7',
  '#B2DFDB', '#FFF9C4', '#FFCCBC', '#D1C4E9', '#B3E5FC',
];

function getColor(vehicleId) {
  const saved = localStorage.getItem(`vehicleColor_${vehicleId}`);
  if (saved) return saved;
  const color = COLORS[vehicleId % COLORS.length];
  localStorage.setItem(`vehicleColor_${vehicleId}`, color);
  return color;
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// "HH:mm:ss" 또는 "HH:mm" → "HH:mm" 정규화
function normalizeTime(t) {
  if (!t) return t;
  const parts = t.split(':');
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

export default function VehicleReservation() {
  const user = useSelector(s => s.auth.user);
  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  const [tab, setTab] = useState(0); // 0: 일, 1: 주
  const [adminTab, setAdminTab] = useState(0); // admin: 0=예약관리, 1=차량관리
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // 예약 다이얼로그
  const [resDialog, setResDialog] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [resForm, setResForm] = useState({ vehicleId: '', reservationDate: '', startTime: '', endTime: '', purpose: '', destination: '', driverName: '' });

  // 차량 관리 다이얼로그
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: '', vehicleType: '', capacity: '', fuelType: '', notes: '' });

  // 드래그 선택
  const [selecting, setSelecting] = useState(null);
  const [hoverSlot, setHoverSlot] = useState(null);

  // 캘린더 팝오버
  const [calAnchor, setCalAnchor] = useState(null);
  const [calMonth, setCalMonth] = useState(dayjs());

  const showAlert = (message, severity = 'success') => setAlert({ open: true, message, severity });

  useEffect(() => { fetchVehicles(); }, []);
  useEffect(() => { fetchReservations(); }, [selectedDate, tab]);

  const fetchVehicles = async () => {
    try {
      const res = await vehicleApi.getVehicles();
      setVehicles(res.data.data || []);
    } catch {}
  };

  const fetchReservations = async () => {
    try {
      let params = {};
      if (tab === 0) {
        params = { date: selectedDate.format('YYYY-MM-DD') };
      } else {
        const weekStart = selectedDate.startOf('week');
        params = { startDate: weekStart.format('YYYY-MM-DD'), endDate: weekStart.add(6, 'day').format('YYYY-MM-DD') };
      }
      const res = await vehicleReservationApi.getReservations(params);
      const data = (res.data.data || []).map(r => ({
        ...r,
        startTime: normalizeTime(r.startTime),
        endTime: normalizeTime(r.endTime),
      }));
      setReservations(data);
    } catch (e) {
      showAlert('예약 정보를 불러오는 데 실패했습니다.', 'error');
    }
  };

  const openResDialog = (vehicleId, date, startTime, endTime) => {
    setEditingRes(null);
    setResForm({ vehicleId: vehicleId || '', reservationDate: date || selectedDate.format('YYYY-MM-DD'), startTime: startTime || '', endTime: endTime || '', purpose: '', destination: '', driverName: user?.name || '' });
    setResDialog(true);
  };

  const openEditResDialog = (res) => {
    setEditingRes(res);
    setResForm({ vehicleId: res.vehicleId, reservationDate: res.reservationDate, startTime: res.startTime, endTime: res.endTime, purpose: res.purpose, destination: res.destination, driverName: res.driverName });
    setResDialog(true);
  };

  const handleSaveRes = async () => {
    const required = [
      { field: resForm.vehicleId, label: '차량' },
      { field: resForm.startTime, label: '시작 시간' },
      { field: resForm.endTime, label: '종료 시간' },
      { field: resForm.purpose, label: '목적' },
      { field: resForm.destination, label: '행선지' },
    ];
    const missing = required.filter(r => !r.field).map(r => r.label);
    if (missing.length > 0) {
      showAlert(`다음 항목을 입력해주세요: ${missing.join(', ')}`, 'warning');
      return;
    }
    try {
      if (editingRes) {
        await vehicleReservationApi.updateReservation(editingRes.reservationId, resForm);
        showAlert('예약이 수정되었습니다.');
      } else {
        await vehicleReservationApi.createReservation(resForm);
        showAlert('예약이 완료되었습니다.');
      }
      setResDialog(false);
      fetchReservations();
    } catch (e) {
      showAlert(e.response?.data?.message || '저장 실패', 'error');
    }
  };

  const handleDeleteRes = async (id) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await vehicleReservationApi.deleteReservation(id);
      showAlert('예약이 취소되었습니다.');
      fetchReservations();
    } catch (e) {
      showAlert(e.response?.data?.message || '취소 실패', 'error');
    }
  };

  // 차량 관리
  const openVehicleDialog = (vehicle = null) => {
    setEditingVehicle(vehicle);
    setVehicleForm(vehicle ? { vehicleNumber: vehicle.vehicleNumber, vehicleType: vehicle.vehicleType, capacity: vehicle.capacity, fuelType: vehicle.fuelType, notes: vehicle.notes || '' } : { vehicleNumber: '', vehicleType: '', capacity: '', fuelType: '', notes: '' });
    setVehicleDialog(true);
  };

  const handleSaveVehicle = async () => {
    try {
      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle.vehicleId, vehicleForm);
        showAlert('차량이 수정되었습니다.');
      } else {
        await vehicleApi.createVehicle(vehicleForm);
        showAlert('차량이 등록되었습니다.');
      }
      setVehicleDialog(false);
      fetchVehicles();
    } catch (e) {
      showAlert(e.response?.data?.message || '저장 실패', 'error');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('차량을 삭제하시겠습니까?')) return;
    try {
      await vehicleApi.deleteVehicle(id);
      showAlert('차량이 삭제되었습니다.');
      fetchVehicles();
    } catch (e) {
      showAlert(e.response?.data?.message || '삭제 실패', 'error');
    }
  };

  // 일별 뷰 - 차량별 예약
  const getDayReservationsForVehicle = (vehicleId) => {
    return reservations.filter(r => r.vehicleId === vehicleId && r.reservationDate === selectedDate.format('YYYY-MM-DD') && r.status === 'CONFIRMED');
  };

  const getWeekReservationsForVehicle = (vehicleId, dayDate) => {
    return reservations.filter(r => r.vehicleId === vehicleId && r.reservationDate === dayDate && r.status === 'CONFIRMED');
  };

  // 셀이 예약되어 있는지 확인
  const getReservationAtSlot = (vehicleId, date, timeSlot) => {
    return reservations.find(r => {
      if (r.vehicleId !== vehicleId || r.reservationDate !== date || r.status !== 'CONFIRMED') return false;
      const slotMin = timeToMinutes(timeSlot);
      const startMin = timeToMinutes(r.startTime);
      const endMin = timeToMinutes(r.endTime);
      return slotMin >= startMin && slotMin < endMin;
    });
  };

  const isFirstSlotOfReservation = (vehicleId, date, timeSlot) => {
    const res = getReservationAtSlot(vehicleId, date, timeSlot);
    if (!res) return false;
    return res.startTime === timeSlot;
  };

  const getReservationRowSpan = (res) => {
    const startMin = timeToMinutes(res.startTime);
    const endMin = timeToMinutes(res.endTime);
    return Math.round((endMin - startMin) / 30);
  };

  const isSlotInSelecting = (vehicleId, timeSlot) => {
    if (!selecting || selecting.vehicleId !== vehicleId) return false;
    const slotMin = timeToMinutes(timeSlot);
    const startMin = timeToMinutes(selecting.startTime);
    const endMin = hoverSlot ? Math.max(timeToMinutes(hoverSlot) + 30, startMin + 30) : startMin + 30;
    return slotMin >= startMin && slotMin < endMin;
  };

  // 주별 뷰 - 요일 계산
  const weekDates = Array.from({ length: 7 }, (_, i) => selectedDate.startOf('week').add(i, 'day'));

  // 캘린더 렌더
  const renderCalendar = () => {
    const firstDay = calMonth.startOf('month');
    const lastDay = calMonth.endOf('month');
    const startOffset = firstDay.day();
    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= lastDay.date(); d++) days.push(calMonth.date(d));
    return (
      <Box sx={{ p: 1, width: 240 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton size="small" onClick={() => setCalMonth(m => m.subtract(1, 'month'))}><ChevronLeftIcon /></IconButton>
          <Typography variant="body2" fontWeight="bold">{calMonth.format('YYYY년 MM월')}</Typography>
          <IconButton size="small" onClick={() => setCalMonth(m => m.add(1, 'month'))}><ChevronRightIcon /></IconButton>
        </Box>
        <Grid container columns={7}>
          {WEEKDAYS.map(d => <Grid size={1} key={d}><Typography variant="caption" align="center" display="block" color={d === '일' ? 'error.main' : d === '토' ? 'primary.main' : 'text.primary'}>{d}</Typography></Grid>)}
          {days.map((d, i) => (
            <Grid size={1} key={i}>
              {d ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box onClick={() => { setSelectedDate(d); setCalAnchor(null); }} sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', bgcolor: d.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD') ? 'primary.main' : 'transparent', color: d.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD') ? 'white' : d.day() === 0 ? 'error.main' : d.day() === 6 ? 'primary.main' : 'text.primary', '&:hover': { bgcolor: d.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD') ? 'primary.main' : 'action.hover' } }}>
                    <Typography variant="caption">{d.date()}</Typography>
                  </Box>
                </Box>
              ) : null}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderDayView = () => (
    <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
      <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell width={80} align="center" sx={{ bgcolor: '#f5f5f5', fontSize: '0.85rem', fontWeight: 'bold' }}>시간</TableCell>
            {vehicles.map(v => (
              <TableCell key={v.vehicleId} align="center" sx={{ bgcolor: '#f5f5f5' }}>
                <Typography variant="body2" fontWeight="bold">{v.vehicleType}</Typography>
                <Typography variant="body2" color="text.secondary">{v.vehicleNumber}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {TIME_SLOTS.map(slot => (
            <TableRow key={slot} sx={{ height: 32 }}>
              <TableCell align="center" sx={{ fontSize: '0.7rem', py: 0, borderRight: '1px solid #e0e0e0' }}>
                {slot.endsWith(':00') ? slot : ''}
              </TableCell>
              {vehicles.map(v => {
                const res = getReservationAtSlot(v.vehicleId, selectedDate.format('YYYY-MM-DD'), slot);
                if (res && !isFirstSlotOfReservation(v.vehicleId, selectedDate.format('YYYY-MM-DD'), slot)) return null;
                const rowSpan = res ? getReservationRowSpan(res) : 1;
                const isSelecting = isSlotInSelecting(v.vehicleId, slot);
                const isMyRes = res && res.userId === user?.userId;
                const canManage = isAdmin || isMyRes;
                return (
                  <TableCell
                    key={v.vehicleId}
                    rowSpan={res ? rowSpan : 1}
                    align="center"
                    sx={{
                      p: 0, cursor: 'pointer', fontSize: '0.7rem',
                      bgcolor: res ? getColor(v.vehicleId) : isSelecting ? '#E3F2FD' : 'transparent',
                      border: '1px solid #e0e0e0',
                      userSelect: 'none',
                    }}
                    onMouseDown={() => {
                      if (!res) setSelecting({ vehicleId: v.vehicleId, startTime: slot, date: selectedDate.format('YYYY-MM-DD') });
                    }}
                    onMouseEnter={() => {
                      if (selecting && selecting.vehicleId === v.vehicleId) setHoverSlot(slot);
                    }}
                    onMouseUp={() => {
                      if (selecting && selecting.vehicleId === v.vehicleId) {
                        const endMin = hoverSlot ? Math.max(timeToMinutes(hoverSlot) + 30, timeToMinutes(selecting.startTime) + 30) : timeToMinutes(selecting.startTime) + 30;
                        const endH = Math.floor(endMin / 60);
                        const endM = endMin % 60;
                        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                        openResDialog(v.vehicleId, selecting.date, selecting.startTime, endTime);
                        setSelecting(null); setHoverSlot(null);
                      }
                    }}
                    onClick={() => {
                      if (res && canManage) openEditResDialog(res);
                    }}
                  >
                    {res ? (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" fontWeight="bold" display="block">{res.driverName}</Typography>
                        <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>{res.startTime}~{res.endTime}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{res.purpose}</Typography>
                        {canManage && (
                          <IconButton size="small" onClick={e => { e.stopPropagation(); handleDeleteRes(res.reservationId); }} sx={{ p: 0 }}>
                            <DeleteIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        )}
                      </Box>
                    ) : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderWeekView = () => (
    <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto' }}>
      <Table size="small" stickyHeader sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell width={80} align="center" sx={{ bgcolor: '#f5f5f5', fontSize: '0.85rem', fontWeight: 'bold' }}>시간</TableCell>
            {weekDates.map(d => (
              <TableCell key={d.format('YYYY-MM-DD')} align="center" sx={{ bgcolor: d.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD') ? '#E3F2FD' : '#f5f5f5' }}>
                <Typography variant="body2" fontWeight="bold" color={d.day() === 0 ? 'error' : d.day() === 6 ? 'primary' : 'text.primary'}>
                  {WEEKDAYS[d.day()]} {d.format('MM/DD')}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {TIME_SLOTS.map(slot => (
            <TableRow key={slot} sx={{ height: 32 }}>
              <TableCell align="center" sx={{ fontSize: '0.7rem', py: 0, borderRight: '1px solid #e0e0e0' }}>
                {slot.endsWith(':00') ? slot : ''}
              </TableCell>
              {weekDates.map(d => {
                const dateStr = d.format('YYYY-MM-DD');
                const dayRess = reservations.filter(r => r.reservationDate === dateStr && r.status === 'CONFIRMED');
                const res = dayRess.find(r => {
                  const slotMin = timeToMinutes(slot);
                  return slotMin >= timeToMinutes(r.startTime) && slotMin < timeToMinutes(r.endTime);
                });
                if (res && res.startTime !== slot) return null;
                const rowSpan = res ? getReservationRowSpan(res) : 1;
                const vehicle = vehicles.find(v => v.vehicleId === res?.vehicleId);
                const isMyRes = res && res.userId === user?.userId;
                const canManage = isAdmin || isMyRes;
                return (
                  <TableCell
                    key={dateStr}
                    rowSpan={res ? rowSpan : 1}
                    align="center"
                    sx={{ p: 0, cursor: 'pointer', fontSize: '0.7rem', bgcolor: res ? getColor(res.vehicleId) : 'transparent', border: '1px solid #e0e0e0', userSelect: 'none' }}
                    onClick={() => { if (!res) openResDialog('', dateStr, slot, ''); else if (canManage) openEditResDialog(res); }}
                  >
                    {res ? (
                      <Box sx={{ p: 0.5 }}>
                        <Typography variant="caption" fontWeight="bold" display="block">{vehicle?.vehicleType}</Typography>
                        <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>{res.driverName} {res.startTime}~{res.endTime}</Typography>
                      </Box>
                    ) : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box onMouseUp={() => { setSelecting(null); setHoverSlot(null); }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">법인차량 예약</Typography>

      {isAdmin && (
        <Tabs value={adminTab} onChange={(_, v) => setAdminTab(v)} sx={{ mb: 2 }}>
          <Tab label="예약 현황" />
          <Tab label="차량 관리" />
        </Tabs>
      )}

      {/* 차량 관리 탭 */}
      {isAdmin && adminTab === 1 ? (
        <Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openVehicleDialog()} sx={{ mb: 2 }}>차량 등록</Button>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell align="center">차량번호</TableCell>
                  <TableCell align="center">차종</TableCell>
                  <TableCell align="center">정원</TableCell>
                  <TableCell align="center">연료</TableCell>
                  <TableCell align="center">비고</TableCell>
                  <TableCell align="center">관리</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.map(v => (
                  <TableRow key={v.vehicleId} hover>
                    <TableCell align="center">{v.vehicleNumber}</TableCell>
                    <TableCell align="center">{v.vehicleType}</TableCell>
                    <TableCell align="center">{v.capacity}인</TableCell>
                    <TableCell align="center">{v.fuelType}</TableCell>
                    <TableCell align="center">{v.notes}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openVehicleDialog(v)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteVehicle(v.vehicleId)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {vehicles.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>등록된 차량 없음</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        /* 예약 현황 */
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <IconButton onClick={() => setSelectedDate(d => tab === 0 ? d.subtract(1, 'day') : d.subtract(1, 'week'))}><ChevronLeftIcon /></IconButton>
            <Button variant="outlined" startIcon={<CalendarTodayIcon />} onClick={e => { setCalMonth(selectedDate); setCalAnchor(e.currentTarget); }} size="small">
              {tab === 0 ? selectedDate.format('YYYY년 MM월 DD일') : `${selectedDate.startOf('week').format('MM/DD')} ~ ${selectedDate.endOf('week').format('MM/DD')}`}
            </Button>
            <IconButton onClick={() => setSelectedDate(d => tab === 0 ? d.add(1, 'day') : d.add(1, 'week'))}><ChevronRightIcon /></IconButton>
            <Button size="small" onClick={() => setSelectedDate(dayjs())}>오늘</Button>
          </Box>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="일별" />
            <Tab label="주별" />
          </Tabs>

          <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">차량별 색상:</Typography>
            {vehicles.map(v => (
              <Chip key={v.vehicleId} label={`${v.vehicleType} (${v.vehicleNumber})`} size="small" sx={{ bgcolor: getColor(v.vehicleId) }} />
            ))}
          </Box>

          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openResDialog()} sx={{ mb: 2 }}>예약하기</Button>

          {tab === 0 ? renderDayView() : renderWeekView()}
        </Box>
      )}

      {/* 캘린더 팝오버 */}
      <Popover open={Boolean(calAnchor)} anchorEl={calAnchor} onClose={() => setCalAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {renderCalendar()}
      </Popover>

      {/* 예약 다이얼로그 */}
      <Dialog open={resDialog} onClose={() => setResDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRes ? '예약 수정' : '차량 예약'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>차량</InputLabel>
                <Select label="차량" value={resForm.vehicleId} onChange={e => setResForm(f => ({ ...f, vehicleId: e.target.value }))}>
                  {vehicles.map(v => <MenuItem key={v.vehicleId} value={v.vehicleId}>{v.vehicleType} ({v.vehicleNumber})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="예약일" type="date" InputLabelProps={{ shrink: true }} value={resForm.reservationDate} onChange={e => setResForm(f => ({ ...f, reservationDate: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="시작 시간" type="time" InputLabelProps={{ shrink: true }} inputProps={{ step: 1800 }} value={resForm.startTime} onChange={e => setResForm(f => ({ ...f, startTime: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="종료 시간" type="time" InputLabelProps={{ shrink: true }} inputProps={{ step: 1800 }} value={resForm.endTime} onChange={e => setResForm(f => ({ ...f, endTime: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="운전자" value={resForm.driverName} onChange={e => setResForm(f => ({ ...f, driverName: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="목적" value={resForm.purpose} onChange={e => setResForm(f => ({ ...f, purpose: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="행선지" value={resForm.destination} onChange={e => setResForm(f => ({ ...f, destination: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResDialog(false)}>취소</Button>
          {editingRes && <Button color="error" onClick={() => { handleDeleteRes(editingRes.reservationId); setResDialog(false); }}>예약취소</Button>}
          <Button variant="contained" onClick={handleSaveRes}>저장</Button>
        </DialogActions>
      </Dialog>

      {/* 차량 등록/수정 다이얼로그 */}
      <Dialog open={vehicleDialog} onClose={() => setVehicleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVehicle ? '차량 수정' : '차량 등록'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[['vehicleNumber', '차량번호*'], ['vehicleType', '차종*'], ['capacity', '정원'], ['fuelType', '연료']].map(([key, label]) => (
              <Grid size={6} key={key}>
                <TextField fullWidth size="small" label={label} value={vehicleForm[key]} onChange={e => setVehicleForm(f => ({ ...f, [key]: e.target.value }))} />
              </Grid>
            ))}
            <Grid size={12}>
              <TextField fullWidth size="small" label="비고" multiline rows={2} value={vehicleForm.notes} onChange={e => setVehicleForm(f => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVehicleDialog(false)}>취소</Button>
          <Button variant="contained" onClick={handleSaveVehicle}>저장</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
