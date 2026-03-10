import axios from 'axios';
import { store } from '../store';
import { logout, updateTokens } from '../store/authSlice';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - auto token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (e) {
          store.dispatch(logout());
          window.location.href = '/login';
        }
      } else {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  changePassword: (data) => api.put('/auth/password/change', data),
};

// User API
export const userApi = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  getCurrentUser: () => api.get('/users/me'),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }),
  resetPassword: (id, data) => api.post(`/users/${id}/password/reset`, data),
};

// Department API
export const departmentApi = {
  getDepartments: () => api.get('/departments'),
  getAllDepartments: () => api.get('/departments/all'),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
};

// Permission Request API
export const permissionApi = {
  createRequest: (data) => api.post('/permission-requests', data),
  getRequests: (params) => api.get('/permission-requests', { params }),
  getMyRequests: () => api.get('/permission-requests/my'),
  getPendingCount: () => api.get('/permission-requests/pending/count'),
  approveRequest: (id, data) => api.put(`/permission-requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.put(`/permission-requests/${id}/reject`, data),
};

// Asset API
export const assetApi = {
  getAssets: (params) => api.get('/assets', { params }),
  getAsset: (id) => api.get(`/assets/${id}`),
  createAsset: (data) => api.post('/assets', data),
  updateAsset: (id, data) => api.put(`/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/assets/${id}`),
  deleteAssets: (ids) => api.delete('/assets/batch', { data: { ids } }),
  uploadAssets: (file, category) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    return api.post('/assets/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadTemplate: (category) => api.get(`/assets/template/${category}`, { responseType: 'blob' }),
  exportAssets: (category) => api.get('/assets/export', { params: { category }, responseType: 'blob' }),
};

// Meeting Room API
export const meetingRoomApi = {
  getRooms: () => api.get('/meeting-rooms'),
  createRoom: (data) => api.post('/meeting-rooms', data),
  updateRoom: (id, data) => api.put(`/meeting-rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/meeting-rooms/${id}`),
};

// Room Reservation API
export const roomReservationApi = {
  getReservations: (params) => api.get('/room-reservations', { params }),
  getMyReservations: () => api.get('/room-reservations/my'),
  createReservation: (data) => api.post('/room-reservations', data),
  updateReservation: (id, data) => api.put(`/room-reservations/${id}`, data),
  cancelReservation: (id) => api.delete(`/room-reservations/${id}`),
};

// Vehicle API
export const vehicleApi = {
  getVehicles: () => api.get('/vehicles'),
  createVehicle: (data) => api.post('/vehicles', data),
  updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
};

// Vehicle Reservation API
export const vehicleReservationApi = {
  getReservations: (params) => api.get('/vehicle-reservations', { params }),
  getMyReservations: () => api.get('/vehicle-reservations/my'),
  createReservation: (data) => api.post('/vehicle-reservations', data),
  updateReservation: (id, data) => api.put(`/vehicle-reservations/${id}`, data),
  cancelReservation: (id) => api.delete(`/vehicle-reservations/${id}`),
  deleteReservation: (id) => api.delete(`/vehicle-reservations/${id}`),
};

// Menu API
export const menuApi = {
  getMenus: () => api.get('/menus'),
  getMenuTree: () => api.get('/menus/tree'),
  getMyMenus: () => api.get('/menus/my'),
  createMenu: (data) => api.post('/menus', data),
  updateMenu: (id, data) => api.put(`/menus/${id}`, data),
  deleteMenu: (id) => api.delete(`/menus/${id}`),
};

export default api;
