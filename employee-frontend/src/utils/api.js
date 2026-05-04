import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ message: '网络错误' });
  }
);

export const authApi = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getUserInfo: () => api.get('/employee/user/info'),
  updateUserInfo: (data) => api.put('/employee/user/info', data),
  changePassword: (data) => api.post('/employee/user/change-password', data),
};

export const attendanceApi = {
  clockIn: () => api.post('/employee/attendance/clock-in'),
  clockOut: () => api.post('/employee/attendance/clock-out'),
  getToday: () => api.get('/employee/attendance/today'),
  getMyList: (params) => api.get('/employee/attendance/my', { params }),
};

export const drugApi = {
  getList: (params) => api.get('/employee/drugs', { params }),
  getById: (id) => api.get(`/employee/drugs/${id}`),
  getCategories: () => api.get('/employee/drug-categories'),
};

export const inventoryApi = {
  getMyList: (params) => api.get('/employee/inventory/my', { params }),
  create: (data) => api.post('/employee/inventory', data),
};

export const orderApi = {
  getMyList: (params) => api.get('/employee/orders/my', { params }),
  getById: (id) => api.get(`/employee/orders/${id}`),
  create: (data) => api.post('/employee/orders', data),
};

export const incomeExpenseApi = {
  getMyList: (params) => api.get('/employee/income-expense/my', { params }),
  create: (data) => api.post('/employee/income-expense', data),
};

export const newsApi = {
  getList: (params) => api.get('/employee/news', { params }),
  getById: (id) => api.get(`/employee/news/${id}`),
};

export const publicApi = {
  getBanners: () => api.get('/banners'),
  getDrugs: (params) => api.get('/drugs', { params }),
  getDrugCategories: () => api.get('/drug-categories'),
};

export default api;
