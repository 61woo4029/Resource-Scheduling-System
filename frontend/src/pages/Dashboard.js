import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import {
  Box, Grid, Card, CardContent, Typography, Button, List, ListItem,
  ListItemText, Divider, Chip,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { roomReservationApi, vehicleReservationApi, permissionApi } from '../services/api';

const getRoleName = (role) => {
  const names = { USER: '일반 사용자', ASSET_ADMIN: '자산 관리자', SYSTEM_ADMIN: '시스템 관리자' };
  return names[role] || role;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [roomReservations, setRoomReservations] = useState([]);
  const [vehicleReservations, setVehicleReservations] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    roomReservationApi.getMyReservations().then(r => setRoomReservations(r.data.data || [])).catch(() => {});
    vehicleReservationApi.getMyReservations().then(r => setVehicleReservations(r.data.data || [])).catch(() => {});
    if (user?.role === 'SYSTEM_ADMIN') {
      permissionApi.getPendingCount().then(r => setPendingCount(r.data.data?.count || 0)).catch(() => {});
    }
  }, [user]);

  const todayRoom = roomReservations.filter(r => r.reservationDate === today && r.status === 'CONFIRMED');
  const upcomingRoom = roomReservations.filter(r => r.reservationDate > today && r.status === 'CONFIRMED').slice(0, 3);
  const todayVehicle = vehicleReservations.filter(r => r.reservationDate === today && r.status === 'CONFIRMED');
  const upcomingVehicle = vehicleReservations.filter(r => r.reservationDate > today && r.status === 'CONFIRMED').slice(0, 3);

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        안녕하세요, {user?.name}님 ({getRoleName(user?.role)})
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* 오늘의 예약 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>오늘의 예약</Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>회의실</Typography>
              {todayRoom.length === 0 ? (
                <Typography variant="body2" color="text.secondary">오늘 예약 없음</Typography>
              ) : (
                <List dense>
                  {todayRoom.map(r => (
                    <ListItem key={r.reservationId} disablePadding>
                      <ListItemText
                        primary={`${r.room.roomName} ${r.startTime}~${r.endTime}`}
                        secondary={r.meetingTitle}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>법인차량</Typography>
              {todayVehicle.length === 0 ? (
                <Typography variant="body2" color="text.secondary">오늘 예약 없음</Typography>
              ) : (
                <List dense>
                  {todayVehicle.map(r => (
                    <ListItem key={r.reservationId} disablePadding>
                      <ListItemText
                        primary={`${r.vehicle.vehicleType} ${r.startTime}~${r.endTime}`}
                        secondary={r.purpose}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 다가오는 예약 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>다가오는 예약</Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>회의실</Typography>
              {upcomingRoom.length === 0 ? (
                <Typography variant="body2" color="text.secondary">예정된 예약 없음</Typography>
              ) : (
                <List dense>
                  {upcomingRoom.map(r => (
                    <ListItem key={r.reservationId} disablePadding>
                      <ListItemText
                        primary={`${r.reservationDate} ${r.room.roomName}`}
                        secondary={`${r.startTime}~${r.endTime} ${r.meetingTitle}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>법인차량</Typography>
              {upcomingVehicle.length === 0 ? (
                <Typography variant="body2" color="text.secondary">예정된 예약 없음</Typography>
              ) : (
                <List dense>
                  {upcomingVehicle.map(r => (
                    <ListItem key={r.reservationId} disablePadding>
                      <ListItemText
                        primary={`${r.reservationDate} ${r.vehicle.vehicleType}`}
                        secondary={`${r.startTime}~${r.endTime} ${r.purpose}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 빠른 예약 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>빠른 예약</Typography>
              <Button fullWidth variant="outlined" startIcon={<MeetingRoomIcon />}
                onClick={() => navigate('/meeting-rooms')} sx={{ mb: 1 }}>
                회의실 예약하기
              </Button>
              <Button fullWidth variant="outlined" startIcon={<DirectionsCarIcon />}
                onClick={() => navigate('/vehicles')}>
                법인차 예약하기
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 권한 신청 알림 (SYSTEM_ADMIN) */}
        {user?.role === 'SYSTEM_ADMIN' && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  권한 신청 알림
                </Typography>
                {pendingCount > 0 ? (
                  <>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      새로운 권한 신청이{' '}
                      <Chip label={`${pendingCount}건`} color="warning" size="small" />
                      있습니다.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/admin/permissions')}>
                      확인하기
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">대기중인 신청이 없습니다.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
