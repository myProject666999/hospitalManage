import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(new Error(error.response.data.message || '请求失败'));
    }
    return Promise.reject(new Error('网络错误'));
  }
);

export const authApi = {
  adminLogin: (data) => api.post('/login', { ...data, login_type: 'admin' }),
  changePassword: (data) => api.post('/admin/user/change-password', data),
  getAdminInfo: () => api.get('/admin/user/info'),
};

export const statsApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getGenderStats: () => api.get('/admin/stats/gender'),
  getDrugCategoryStats: () => api.get('/admin/stats/drug-category'),
  getDrugStockStats: () => api.get('/admin/stats/drug-stock'),
  getSalesStats: () => api.get('/admin/stats/sales'),
  getMonthlySalesStats: () => api.get('/admin/stats/monthly-sales'),
  getIncomeExpenseStats: () => api.get('/admin/stats/income-expense'),
};

export const userApi = {
  getList: (params) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  delete: (id) => api.delete(`/admin/users/${id}`),
};

export const drugApi = {
  getList: (params) => api.get('/admin/drugs', { params }),
  getById: (id) => api.get(`/admin/drugs/${id}`),
  create: (data) => api.post('/admin/drugs', data),
  update: (id, data) => api.put(`/admin/drugs/${id}`, data),
  delete: (id) => api.delete(`/admin/drugs/${id}`),
  getCategories: () => api.get('/admin/drug-categories'),
  createCategory: (data) => api.post('/admin/drug-categories', data),
  updateCategory: (id, data) => api.put(`/admin/drug-categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/drug-categories/${id}`),
};

export const inventoryApi = {
  getList: (params) => api.get('/admin/inventory', { params }),
  create: (data) => api.post('/admin/inventory', data),
};

export const orderApi = {
  getList: (params) => api.get('/admin/orders', { params }),
  getById: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};

export const attendanceApi = {
  getList: (params) => api.get('/admin/attendance', { params }),
  update: (id, data) => api.put(`/admin/attendance/${id}`, data),
};

export const incomeExpenseApi = {
  getList: (params) => api.get('/admin/income-expense', { params }),
  create: (data) => api.post('/admin/income-expense', data),
  getStats: () => api.get('/admin/income-expense/stats'),
  delete: (id) => api.delete(`/admin/income-expense/${id}`),
};

export const adminApi = {
  getList: (params) => api.get('/admin/admins', { params }),
  getById: (id) => api.get(`/admin/admins/${id}`),
  create: (data) => api.post('/admin/admins', data),
  update: (id, data) => api.put(`/admin/admins/${id}`, data),
  delete: (id) => api.delete(`/admin/admins/${id}`),
};

export const bannerApi = {
  getList: () => api.get('/admin/banners'),
  create: (data) => api.post('/admin/banners', data),
  update: (id, data) => api.put(`/admin/banners/${id}`, data),
  delete: (id) => api.delete(`/admin/banners/${id}`),
};

export const newsApi = {
  getList: (params) => api.get('/admin/news', { params }),
  getById: (id) => api.get(`/admin/news/${id}`),
  create: (data) => api.post('/admin/news', data),
  update: (id, data) => api.put(`/admin/news/${id}`, data),
  delete: (id) => api.delete(`/admin/news/${id}`),
};

export const logApi = {
  getList: (params) => api.get('/admin/logs', { params }),
  getById: (id) => api.get(`/admin/logs/${id}`),
  delete: (id) => api.delete(`/admin/logs/${id}`),
  clear: () => api.post('/admin/logs/clear'),
};

export default api;
