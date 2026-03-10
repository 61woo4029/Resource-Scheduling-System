import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  Box, Typography, Tabs, Tab, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Grid, Snackbar, Alert, Chip, Checkbox,
  FormGroup, FormControlLabel, Popover,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { meetingRoomApi, roomReservationApi } from '../services/api';

const TIME_SLOTS = [];
for (let h = 8; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const COLORS = [
  { value: '#dbeafe', label: '스카이블루' }, { value: '#fae8ff', label: '라벤더' },
  { value: '#d1fae5', label: '민트' }, { value: '#fee2e2', label: '코랄핑크' },
  { value: '#e0e7ff', label: '페리윙클' }, { value: '#cffafe', label: '아쿠아' },
  { value: '#fef3c7', label: '피치' }, { value: '#f3e8ff', label: '바이올렛' },
  { value: '#fce7f3', label: '핑크' }, { value: '#dcfce7', label: '라이트그린' },
];


const FACILITIES = ['TV', '블루투스 스피커&마이크', '화이트보드', '화상회의 장비', '노트북'];

const getColor = (id) => {
  const colors = JSON.parse(localStorage.getItem('reservationColors') || '{}');
  return colors[id] || COLORS[0].value;
};

const saveColor = (id, color) => {
  const colors = JSON.parse(localStorage.getItem('reservationColors') || '{}');
  colors[id] = color;
  localStorage.setItem('reservationColors', JSON.stringify(colors));
};

const getStatusName = (s) => ({ AVAILABLE: '사용가능', MAINTENANCE: '점검중', UNAVAILABLE: '사용불가' }[s] || s);

const emptyReservation = { roomId: '', reservationDate: '', startTime: '', endTime: '', meetingTitle: '', attendeeCount: '', notes: '', color: COLORS[0].value };
const emptyRoom = { roomName: '', location: '', capacity: '', facilities: [], hasOtherFacility: false, otherFacilityText: '', status: 'AVAILABLE' };

export default function MeetingRoomReservation() {
  const user = useSelector(s => s.auth.user);
  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [viewTab, setViewTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState({ ...emptyReservation });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReservation, setDetailReservation] = useState(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState({ ...emptyRoom });
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [datePickerAnchor, setDatePickerAnchor] = useState(null);
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [fieldErrors, setFieldErrors] = useState({ meetingTitle: false, attendeeCount: false });

  const showAlert = (msg, sev = 'success') => setAlert({ open: true, message: msg, severity: sev });

  const fetchRooms = useCallback(async () => {
    const res = await meetingRoomApi.getRooms();
    setRooms(res.data.data || []);
  }, []);

  const fetchReservations = useCallback(async () => {
    try {
      if (viewTab === 0) {
        const res = await roomReservationApi.getReservations({ viewType: 'daily', date: selectedDate.format('YYYY-MM-DD') });
        setReservations(res.data.data || []);
      } else {
        const roomIdx = viewTab - 1;
        if (rooms[roomIdx]) {
          const weekStart = selectedDate.startOf('week').add(1, 'day');
          const weekEnd = weekStart.add(4, 'day');
          const res = await roomReservationApi.getReservations({
            viewType: 'weekly', roomId: rooms[roomIdx].roomId,
            startDate: weekStart.format('YYYY-MM-DD'), endDate: weekEnd.format('YYYY-MM-DD'),
          });
          setReservations(res.data.data || []);
        }
      }
    } catch {}
  }, [viewTab, selectedDate, rooms]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);
  useEffect(() => { if (rooms.length > 0) fetchReservations(); }, [fetchReservations, rooms]);

  const getWeekDays = () => {
    const start = selectedDate.startOf('week').add(1, 'day');
    return ['월', '화', '수', '목', '금'].map((d, i) => {
      const day = start.add(i, 'day');
      return { date: day.format('YYYY-MM-DD'), dayName: d, dayNum: day.format('D'), isToday: day.isSame(dayjs(), 'day') };
    });
  };

  const getReservationForSlot = (roomId, time) =>
    reservations.find(r => r.room.roomId === roomId && r.startTime <= time && r.endTime > time);

  const getWeeklyReservation = (date, time) =>
    reservations.find(r => r.reservationDate === date && r.startTime <= time && r.endTime > time);

  const isReservationStart = (roomId, time, date = null) => {
    if (date) return reservations.some(r => r.reservationDate === date && r.room.roomId === roomId && r.startTime === time);
    return reservations.some(r => r.room.roomId === roomId && r.startTime === time);
  };

  const getRowSpan = (reservation) => {
    const si = TIME_SLOTS.indexOf(reservation.startTime);
    const ei = TIME_SLOTS.indexOf(reservation.endTime);
    return Math.max(1, ei - si);
  };

  const isMiddle = (roomId, time, date = null) => {
    return reservations.some(r => {
      const match = date ? r.reservationDate === date && r.room.roomId === roomId : r.room.roomId === roomId;
      return match && r.startTime < time && r.endTime > time;
    });
  };

  const isInDragRange = (roomId, time, date = null) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (date) {
      if (dragStart.date !== date) return false;
    } else {
      if (dragStart.roomId !== roomId) return false;
    }
    const si = TIME_SLOTS.indexOf(dragStart.time);
    const ei = TIME_SLOTS.indexOf(dragEnd.time);
    const ti = TIME_SLOTS.indexOf(time);
    const min = Math.min(si, ei), max = Math.max(si, ei);
    return ti >= min && ti <= max;
  };

  const handleDragStart = (roomId, time, date = null) => {
    setIsDragging(true);
    setDragStart({ roomId, time, date });
    setDragEnd({ roomId, time, date });
  };

  const handleDragOver = (roomId, time, date = null) => {
    if (!isDragging || !dragStart) return;
    if (viewTab === 0 && dragStart.roomId === roomId) setDragEnd({ roomId, time, date });
    else if (viewTab !== 0 && dragStart.date === date) setDragEnd({ roomId, time, date });
  };

  const handleDragEnd = () => {
    if (isDragging && dragStart && dragEnd) {
      const si = TIME_SLOTS.indexOf(dragStart.time);
      const ei = TIME_SLOTS.indexOf(dragEnd.time);
      const startTime = TIME_SLOTS[Math.min(si, ei)];
      const endIdx = Math.min(Math.max(si, ei) + 1, TIME_SLOTS.length - 1);
      const endTime = TIME_SLOTS[endIdx] || '20:00';
      const roomId = dragStart.roomId || (viewTab > 0 && rooms[viewTab - 1]?.roomId) || '';
      const date = dragStart.date || selectedDate.format('YYYY-MM-DD');
      setEditingReservation({ ...emptyReservation, roomId, reservationDate: date, startTime, endTime });
      setDialogOpen(true);
    }
    setIsDragging(false); setDragStart(null); setDragEnd(null);
  };

  const handleSlotClick = (roomId, time, date = null) => {
    const endIdx = Math.min(TIME_SLOTS.indexOf(time) + 2, TIME_SLOTS.length - 1);
    setEditingReservation({
      ...emptyReservation, roomId, reservationDate: date || selectedDate.format('YYYY-MM-DD'),
      startTime: time, endTime: TIME_SLOTS[endIdx] || '20:00',
    });
    setDialogOpen(true);
  };

  const handleReservationClick = (r) => { setDetailReservation(r); setDetailOpen(true); };

  const handleSaveReservation = async () => {
    const titleEmpty = !editingReservation.meetingTitle?.trim();
    const countEmpty = !editingReservation.attendeeCount || Number(editingReservation.attendeeCount) <= 0;
    setFieldErrors({ meetingTitle: titleEmpty, attendeeCount: countEmpty });

    if (titleEmpty || countEmpty) {
      const missing = [titleEmpty && '회의 제목', countEmpty && '참석 인원'].filter(Boolean).join(', ');
      showAlert(`${missing}을(를) 입력해주세요.`, 'warning');
      return;
    }

    try {
      const data = { ...editingReservation };
      if (data.reservationId) {
        await roomReservationApi.updateReservation(data.reservationId, data);
        showAlert('예약이 수정되었습니다.');
      } else {
        const res = await roomReservationApi.createReservation(data);
        if (data.color) saveColor(res.data.data?.reservationId, data.color);
        showAlert('예약이 완료되었습니다.');
      }
      setDialogOpen(false);
      fetchReservations();
    } catch (e) { showAlert(e.response?.data?.message || '저장 실패', 'error'); }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('예약을 취소하시겠습니까?')) return;
    try {
      await roomReservationApi.cancelReservation(id);
      showAlert('예약이 취소되었습니다.');
      setDetailOpen(false);
      fetchReservations();
    } catch (e) { showAlert(e.response?.data?.message || '취소 실패', 'error'); }
  };

  const handleSaveRoom = async () => {
    try {
      const facilitiesStr = [
        ...editingRoom.facilities,
        ...(editingRoom.hasOtherFacility && editingRoom.otherFacilityText ? [editingRoom.otherFacilityText] : []),
      ].join(', ');
      const data = { roomName: editingRoom.roomName, location: editingRoom.location, capacity: Number(editingRoom.capacity), facilities: facilitiesStr, status: editingRoom.status };
      if (editingRoomId) await meetingRoomApi.updateRoom(editingRoomId, data);
      else await meetingRoomApi.createRoom(data);
      showAlert(editingRoomId ? '수정되었습니다.' : '등록되었습니다.');
      setRoomDialogOpen(false);
      fetchRooms();
    } catch (e) { showAlert(e.response?.data?.message || '저장 실패', 'error'); }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try { await meetingRoomApi.deleteRoom(id); showAlert('삭제되었습니다.'); fetchRooms(); }
    catch (e) { showAlert('삭제 실패', 'error'); }
  };

  // Calendar popover for date selection
  const generateCalendarDays = () => {
    const start = calendarDate.startOf('month');
    const startDay = start.day();
    const daysInMonth = calendarDate.daysInMonth();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(calendarDate.date(d));
    return days;
  };

  return (
    <Box onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}>
      <Typography variant="h5" gutterBottom fontWeight="bold">회의실 예약</Typography>

      {/* 관리자: 회의실 목록 */}
      {isAdmin && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">회의실 목록</Typography>
            <Button size="small" variant="contained" startIcon={<AddIcon />}
              onClick={() => { setEditingRoom({ ...emptyRoom }); setEditingRoomId(null); setRoomDialogOpen(true); }}>
              회의실 등록
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  {['회의실명', '위치', '수용인원', '편의시설', '상태', '관리'].map(h => (
                    <TableCell key={h} align="center">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map(room => (
                  <TableRow key={room.roomId}>
                    <TableCell align="center">{room.roomName}</TableCell>
                    <TableCell align="center">{room.location}</TableCell>
                    <TableCell align="center">{room.capacity}명</TableCell>
                    <TableCell align="center">{room.facilities}</TableCell>
                    <TableCell align="center"><Chip label={getStatusName(room.status)} size="small" color={room.status === 'AVAILABLE' ? 'success' : 'warning'} /></TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => {
                        setEditingRoomId(room.roomId);
                        setEditingRoom({ roomName: room.roomName, location: room.location, capacity: room.capacity, facilities: (room.facilities || '').split(', ').filter(f => FACILITIES.includes(f)), hasOtherFacility: false, otherFacilityText: '', status: room.status });
                        setRoomDialogOpen(true);
                      }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteRoom(room.roomId)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Tabs value={viewTab} onChange={(_, v) => setViewTab(v)} sx={{ mb: 2 }}>
        <Tab label="일별" />
        {rooms.map(r => <Tab key={r.roomId} label={`주별 - ${r.roomName}`} />)}
      </Tabs>

      {/* 일별 보기 */}
      {viewTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <IconButton onClick={() => setSelectedDate(d => d.subtract(1, 'day'))}><ChevronLeftIcon /></IconButton>
            <Typography variant="h6" sx={{ cursor: 'pointer', userSelect: 'none', mx: 2 }}
              onClick={(e) => { setCalendarDate(selectedDate); setDatePickerAnchor(e.currentTarget); }}>
              {selectedDate.format('YYYY.MM.DD')}({['일','월','화','수','목','금','토'][selectedDate.day()]})
            </Typography>
            <IconButton onClick={() => setSelectedDate(d => d.add(1, 'day'))}><ChevronRightIcon /></IconButton>
          </Box>
          <TableContainer component={Paper}>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell align="center" width={70}>시간</TableCell>
                  {rooms.map(r => <TableCell key={r.roomId} align="center">{r.roomName}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {TIME_SLOTS.map(time => (
                  <TableRow key={time}>
                    <TableCell align="center" sx={{ fontSize: 12 }}>{time}</TableCell>
                    {rooms.map(room => {
                      if (isMiddle(room.roomId, time)) return null;
                      const reservation = getReservationForSlot(room.roomId, time);
                      if (reservation && isReservationStart(room.roomId, time)) {
                        const span = getRowSpan(reservation);
                        const color = getColor(reservation.reservationId);
                        return (
                          <TableCell key={room.roomId} align="center" rowSpan={span}
                            sx={{ bgcolor: color, cursor: 'pointer', verticalAlign: 'top', border: '1px solid #e0e0e0' }}
                            onClick={() => handleReservationClick(reservation)}>
                            <Typography variant="caption" display="block" fontWeight="bold">{reservation.meetingTitle}</Typography>
                            <Typography variant="caption" display="block">{reservation.user.name}</Typography>
                            <Typography variant="caption" display="block">{reservation.startTime}~{reservation.endTime}</Typography>
                          </TableCell>
                        );
                      }
                      if (!reservation) {
                        const inDrag = isInDragRange(room.roomId, time);
                        return (
                          <TableCell key={room.roomId} align="center"
                            sx={{ cursor: 'pointer', bgcolor: inDrag ? '#bbdefb' : 'transparent', '&:hover': { bgcolor: '#e3f2fd' } }}
                            onClick={() => handleSlotClick(room.roomId, time)}
                            onMouseDown={() => handleDragStart(room.roomId, time)}
                            onMouseEnter={() => handleDragOver(room.roomId, time)} />
                        );
                      }
                      return null;
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 주별 보기 */}
      {viewTab > 0 && rooms[viewTab - 1] && (
        <Box>
          {(() => {
            const weekDays = getWeekDays();
            return (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <IconButton onClick={() => setSelectedDate(d => d.subtract(7, 'day'))}><ChevronLeftIcon /></IconButton>
                  <Typography variant="h6" sx={{ mx: 2 }}>
                    {weekDays[0].date} ~ {weekDays[4].date}
                  </Typography>
                  <IconButton onClick={() => setSelectedDate(d => d.add(7, 'day'))}><ChevronRightIcon /></IconButton>
                </Box>
                <TableContainer component={Paper}>
                  <Table size="small" sx={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell align="center" width={70}>시간</TableCell>
                        {weekDays.map(d => (
                          <TableCell key={d.date} align="center" sx={{ bgcolor: d.isToday ? '#e3f2fd' : undefined }}>
                            {d.dayName}({d.dayNum})
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {TIME_SLOTS.map(time => (
                        <TableRow key={time}>
                          <TableCell align="center" sx={{ fontSize: 12 }}>{time}</TableCell>
                          {weekDays.map(d => {
                            const roomId = rooms[viewTab - 1].roomId;
                            if (isMiddle(roomId, time, d.date)) return null;
                            const reservation = getWeeklyReservation(d.date, time);
                            if (reservation && reservation.room.roomId === roomId && isReservationStart(roomId, time, d.date)) {
                              const span = getRowSpan(reservation);
                              const color = getColor(reservation.reservationId);
                              return (
                                <TableCell key={d.date} align="center" rowSpan={span}
                                  sx={{ bgcolor: color, cursor: 'pointer', verticalAlign: 'top', border: '1px solid #e0e0e0' }}
                                  onClick={() => handleReservationClick(reservation)}>
                                  <Typography variant="caption" display="block" fontWeight="bold">{reservation.meetingTitle}</Typography>
                                  <Typography variant="caption" display="block">{reservation.user.name}</Typography>
                                </TableCell>
                              );
                            }
                            const hasReservation = reservation && reservation.room.roomId === roomId;
                            if (!hasReservation) {
                              const inDrag = isInDragRange(roomId, time, d.date);
                              return (
                                <TableCell key={d.date} align="center"
                                  sx={{ cursor: 'pointer', bgcolor: inDrag ? '#bbdefb' : 'transparent', '&:hover': { bgcolor: '#e3f2fd' } }}
                                  onClick={() => handleSlotClick(roomId, time, d.date)}
                                  onMouseDown={() => handleDragStart(roomId, time, d.date)}
                                  onMouseEnter={() => handleDragOver(roomId, time, d.date)} />
                              );
                            }
                            return null;
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            );
          })()}
        </Box>
      )}

      {/* 날짜 선택 팝업 */}
      <Popover open={Boolean(datePickerAnchor)} anchorEl={datePickerAnchor} onClose={() => setDatePickerAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Box sx={{ p: 2, width: 280 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <IconButton size="small" onClick={() => setCalendarDate(d => d.subtract(1, 'month'))}><ChevronLeftIcon /></IconButton>
            <Typography fontWeight="bold">{calendarDate.format('YYYY년 MM월')}</Typography>
            <IconButton size="small" onClick={() => setCalendarDate(d => d.add(1, 'month'))}><ChevronRightIcon /></IconButton>
          </Box>
          <Grid container columns={7}>
            {['일','월','화','수','목','금','토'].map(d => (
              <Grid size={1} key={d}><Typography variant="caption" align="center" display="block" fontWeight="bold">{d}</Typography></Grid>
            ))}
            {generateCalendarDays().map((d, i) => (
              <Grid size={1} key={i}>
                {d && (
                  <Box sx={{ textAlign: 'center', cursor: 'pointer', p: 0.5, borderRadius: 1,
                    bgcolor: d.isSame(selectedDate, 'day') ? '#1976d2' : 'transparent',
                    color: d.isSame(selectedDate, 'day') ? 'white' : 'inherit',
                    '&:hover': { bgcolor: d.isSame(selectedDate, 'day') ? '#1565c0' : '#f5f5f5' } }}
                    onClick={() => { setSelectedDate(d); setDatePickerAnchor(null); }}>
                    <Typography variant="caption">{d.date()}</Typography>
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>

      {/* 예약 다이얼로그 */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setFieldErrors({ meetingTitle: false, attendeeCount: false }); }} maxWidth="sm" fullWidth>
        <DialogTitle>회의실 예약</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>회의실</InputLabel>
                <Select label="회의실" value={editingReservation.roomId || ''}
                  onChange={e => setEditingReservation(r => ({ ...r, roomId: e.target.value }))}>
                  {rooms.map(r => <MenuItem key={r.roomId} value={r.roomId}>{r.roomName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="예약일" type="date" InputLabelProps={{ shrink: true }}
                value={editingReservation.reservationDate || ''}
                onChange={e => setEditingReservation(r => ({ ...r, reservationDate: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>시작 시간</InputLabel>
                <Select label="시작 시간" value={editingReservation.startTime || ''}
                  onChange={e => setEditingReservation(r => ({ ...r, startTime: e.target.value }))}>
                  {TIME_SLOTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>종료 시간</InputLabel>
                <Select label="종료 시간" value={editingReservation.endTime || ''}
                  onChange={e => setEditingReservation(r => ({ ...r, endTime: e.target.value }))}>
                  {TIME_SLOTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="회의 제목 *" value={editingReservation.meetingTitle || ''}
                onChange={e => { setEditingReservation(r => ({ ...r, meetingTitle: e.target.value })); setFieldErrors(f => ({ ...f, meetingTitle: false })); }}
                error={fieldErrors.meetingTitle}
                helperText={fieldErrors.meetingTitle ? '회의 제목을 입력해주세요.' : ''} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="참석 인원 *" type="number" value={editingReservation.attendeeCount || ''}
                onChange={e => { setEditingReservation(r => ({ ...r, attendeeCount: e.target.value })); setFieldErrors(f => ({ ...f, attendeeCount: false })); }}
                inputProps={{ min: 1 }}
                error={fieldErrors.attendeeCount}
                helperText={fieldErrors.attendeeCount ? '참석 인원을 입력해주세요.' : ''} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="메모" multiline rows={2} value={editingReservation.notes || ''}
                onChange={e => setEditingReservation(r => ({ ...r, notes: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" gutterBottom>표시 색상</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {COLORS.map(c => (
                  <Box key={c.value} onClick={() => setEditingReservation(r => ({ ...r, color: c.value }))}
                    sx={{ width: 24, height: 24, bgcolor: c.value, borderRadius: '50%', cursor: 'pointer',
                      border: editingReservation.color === c.value ? '2px solid #1976d2' : '1px solid #ccc' }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setFieldErrors({ meetingTitle: false, attendeeCount: false }); }}>취소</Button>
          <Button variant="contained" onClick={handleSaveReservation}>예약</Button>
        </DialogActions>
      </Dialog>

      {/* 예약 상세 다이얼로그 */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)}>
        <DialogTitle>예약 상세</DialogTitle>
        <DialogContent>
          {detailReservation && (
            <Box>
              <Typography><b>회의실:</b> {detailReservation.room.roomName}</Typography>
              <Typography><b>일자:</b> {detailReservation.reservationDate}</Typography>
              <Typography><b>시간:</b> {detailReservation.startTime} ~ {detailReservation.endTime}</Typography>
              <Typography><b>제목:</b> {detailReservation.meetingTitle}</Typography>
              <Typography><b>예약자:</b> {detailReservation.user.name}</Typography>
              {detailReservation.attendeeCount && <Typography><b>참석인원:</b> {detailReservation.attendeeCount}명</Typography>}
              {detailReservation.notes && <Typography><b>메모:</b> {detailReservation.notes}</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {detailReservation?.user.userId === user?.userId && (
            <>
              <Button color="error" onClick={() => handleCancelReservation(detailReservation.reservationId)}>취소</Button>
              <Button onClick={() => {
                setEditingReservation({ ...detailReservation, roomId: detailReservation.room.roomId, reservationId: detailReservation.reservationId });
                setDetailOpen(false); setDialogOpen(true);
              }}>수정</Button>
            </>
          )}
          <Button onClick={() => setDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 회의실 등록/수정 다이얼로그 */}
      <Dialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)}>
        <DialogTitle>{editingRoomId ? '회의실 수정' : '회의실 등록'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField fullWidth size="small" label="회의실명*" value={editingRoom.roomName}
                onChange={e => setEditingRoom(r => ({ ...r, roomName: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="위치" value={editingRoom.location}
                onChange={e => setEditingRoom(r => ({ ...r, location: e.target.value }))} />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth size="small" label="수용 인원*" type="number" value={editingRoom.capacity}
                onChange={e => setEditingRoom(r => ({ ...r, capacity: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <Typography variant="caption">편의시설</Typography>
              <FormGroup row>
                {FACILITIES.map(f => (
                  <FormControlLabel key={f} control={
                    <Checkbox size="small" checked={editingRoom.facilities.includes(f)}
                      onChange={e => setEditingRoom(r => ({ ...r, facilities: e.target.checked ? [...r.facilities, f] : r.facilities.filter(x => x !== f) }))} />
                  } label={<Typography variant="caption">{f}</Typography>} />
                ))}
                <FormControlLabel control={
                  <Checkbox size="small" checked={editingRoom.hasOtherFacility}
                    onChange={e => setEditingRoom(r => ({ ...r, hasOtherFacility: e.target.checked }))} />
                } label={<Typography variant="caption">기타</Typography>} />
              </FormGroup>
              {editingRoom.hasOtherFacility && (
                <TextField fullWidth size="small" placeholder="기타 시설 입력" value={editingRoom.otherFacilityText}
                  onChange={e => setEditingRoom(r => ({ ...r, otherFacilityText: e.target.value }))} />
              )}
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>상태</InputLabel>
                <Select label="상태" value={editingRoom.status}
                  onChange={e => setEditingRoom(r => ({ ...r, status: e.target.value }))}>
                  <MenuItem value="AVAILABLE">사용가능</MenuItem>
                  <MenuItem value="MAINTENANCE">점검중</MenuItem>
                  <MenuItem value="UNAVAILABLE">사용불가</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSaveRoom}>저장</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={3000} onClose={() => setAlert(a => ({ ...a, open: false }))}>
        <Alert severity={alert.severity}>{alert.message}</Alert>
      </Snackbar>
    </Box>
  );
}
