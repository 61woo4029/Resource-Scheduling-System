import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Divider, Menu, MenuItem,
  Badge, Avatar, useMediaQuery, useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import ComputerIcon from '@mui/icons-material/Computer';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import ViewListIcon from '@mui/icons-material/ViewList';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout } from '../store/authSlice';
import { permissionApi } from '../services/api';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: '대시보드', icon: <DashboardIcon />, path: '/dashboard' },
  { text: '마이페이지', icon: <PersonIcon />, path: '/mypage' },
  { text: '자산 관리', icon: <ComputerIcon />, path: '/assets' },
  { text: '회의실 예약', icon: <MeetingRoomIcon />, path: '/meeting-rooms' },
  { text: '법인차량 예약', icon: <DirectionsCarIcon />, path: '/vehicles' },
];

const adminMenuItems = [
  { text: '사용자 관리', icon: <PeopleIcon />, path: '/admin/users' },
  { text: '부서 관리', icon: <BusinessIcon />, path: '/admin/departments' },
  { text: '권한 관리', icon: <SecurityIcon />, path: '/admin/permissions' },
  { text: '메뉴 관리', icon: <ViewListIcon />, path: '/admin/menus' },
];

const getRoleName = (role) => {
  const names = { USER: '일반 사용자', ASSET_ADMIN: '자산 관리자', SYSTEM_ADMIN: '시스템 관리자' };
  return names[role] || role;
};

const getRoleColor = (role) => {
  const colors = { USER: '#4ECDC4', ASSET_ADMIN: '#FFB347', SYSTEM_ADMIN: '#FF6584' };
  return colors[role] || '#6C63FF';
};

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useSelector((state) => state.auth.user);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.role === 'SYSTEM_ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchPendingCount = async () => {
    try {
      const res = await permissionApi.getPendingCount();
      setPendingCount(res.data.data?.count || 0);
    } catch {}
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    dispatch(logout());
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Area */}
      <Box sx={{
        p: 3, pb: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: '-20px', right: '-20px',
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-30px', left: '-10px',
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          width: 44, height: 44, borderRadius: '14px', mb: 1.5,
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          position: 'relative', zIndex: 1,
        }}>
          🏢
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff', position: 'relative', zIndex: 1, lineHeight: 1.2 }}>
          자원관리 시스템
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', position: 'relative', zIndex: 1 }}>
          Resource Management
        </Typography>
      </Box>

      {/* User Info */}
      <Box sx={{
        mx: 2, mt: 2, mb: 1, p: 2,
        background: 'rgba(108, 99, 255, 0.06)',
        borderRadius: '16px',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Avatar sx={{
          width: 38, height: 38, fontSize: 15, fontWeight: 700,
          background: 'linear-gradient(135deg, #6C63FF, #9B59B6)',
          boxShadow: '0 4px 12px rgba(108, 99, 255, 0.35)',
        }}>
          {user?.name?.charAt(0)}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight={700} noWrap>{user?.name}</Typography>
          <Typography variant="caption" noWrap sx={{
            color: getRoleColor(user?.role),
            fontWeight: 600,
          }}>
            {getRoleName(user?.role)}
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAdmin && (
        <>
          <Box sx={{ px: 3, py: 0.5 }}>
            <Typography variant="caption" sx={{
              color: 'text.disabled', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: '0.7rem',
            }}>
              관리자
            </Typography>
          </Box>
          <List sx={{ px: 1 }}>
            {adminMenuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    {item.path === '/admin/permissions' && pendingCount > 0
                      ? <Badge badgeContent={pendingCount} color="error">{item.icon}</Badge>
                      : item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Logout */}
      <Divider sx={{ mx: 2, borderColor: 'rgba(108,99,255,0.1)' }} />
      <List sx={{ px: 1, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: '#FF6584' }}>
            <ListItemIcon sx={{ minWidth: 38, color: '#FF6584' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="로그아웃"
              primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600, color: '#FF6584' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F0F2FF' }}>
      {/* AppBar (mobile only) */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 800 }}>
              자원관리 시스템
            </Typography>
            {isAdmin && (
              <IconButton color="inherit" onClick={() => navigate('/admin/permissions')}>
                <Badge badgeContent={pendingCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            )}
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700 }}>
                {user?.name?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuItem disabled>
                <Typography variant="body2">{user?.name} ({getRoleName(user?.role)})</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { navigate('/mypage'); setAnchorEl(null); }}>마이페이지</MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: '#FF6584' }}>로그아웃</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 2, md: 3 },
        mt: isMobile ? 8 : 0,
        minHeight: '100vh',
        background: '#F0F2FF',
      }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
