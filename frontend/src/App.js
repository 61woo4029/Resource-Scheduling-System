import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssetManagement from './pages/AssetManagement';
import MeetingRoomReservation from './pages/MeetingRoomReservation';
import VehicleReservation from './pages/VehicleReservation';
import MyPage from './pages/MyPage';
import UserManagement from './pages/UserManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import PermissionManagement from './pages/PermissionManagement';
import MenuManagement from './pages/MenuManagement';

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/mypage" element={<ErrorBoundary><MyPage /></ErrorBoundary>} />
          <Route path="/assets" element={<ErrorBoundary><AssetManagement /></ErrorBoundary>} />
          <Route path="/meeting-rooms" element={<ErrorBoundary><MeetingRoomReservation /></ErrorBoundary>} />
          <Route path="/vehicles" element={<ErrorBoundary><VehicleReservation /></ErrorBoundary>} />
          <Route path="/admin/users" element={<ErrorBoundary><UserManagement /></ErrorBoundary>} />
          <Route path="/admin/departments" element={<ErrorBoundary><DepartmentManagement /></ErrorBoundary>} />
          <Route path="/admin/permissions" element={<ErrorBoundary><PermissionManagement /></ErrorBoundary>} />
          <Route path="/admin/menus" element={<ErrorBoundary><MenuManagement /></ErrorBoundary>} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
