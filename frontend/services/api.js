import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to add Bearer token if user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vellanki_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Intercept responses for global 401 handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  forgotPasswordSendOtp: (data) => api.post('/auth/forgot-password/send-otp', data),
  forgotPasswordReset: (data) => api.post('/auth/forgot-password/reset', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  verifyPhone: (data) => api.post('/auth/verify-phone', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  changePhone: (data) => api.post('/auth/change-phone', data),
  changeEmail: (data) => api.post('/auth/change-email', data),
};

export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (idOrSlug) => api.get(`/products/${idOrSlug}`),
  createProduct: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  adjustStock: (data) => api.post('/products/adjust-stock', data),
  deleteImage: (imageId) => api.delete(`/products/images/${imageId}`),
};

export const categoriesAPI = {
  getCategories: (params) => api.get('/categories', { params }),
  getCategory: (idOrSlug) => api.get(`/categories/${idOrSlug}`),
  createCategory: (formData) => api.post('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateCategory: (id, formData) => api.put(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart/add', data),
  updateCartItem: (id, data) => api.put(`/cart/items/${id}`, data),
  removeFromCart: (id) => api.delete(`/cart/items/${id}`),
  clearCart: () => api.delete('/cart/clear'),
};

export const addressAPI = {
  getAddresses: () => api.get('/addresses'),
  createAddress: (data) => api.post('/addresses', data),
  updateAddress: (id, data) => api.put(`/addresses/${id}`, data),
  setDefault: (id) => api.put(`/addresses/${id}/default`),
  deleteAddress: (id) => api.delete(`/addresses/${id}`),
};

export const ordersAPI = {
  placeOrder: (data) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getOrderDetails: (idOrNumber) => api.get(`/orders/${idOrNumber}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
  getAllOrdersAdmin: (params) => api.get('/admin/orders', { params }),
  updateOrderStatusAdmin: (id, data) => api.put(`/admin/orders/${id}/status`, data),
};

export const paymentAPI = {
  getConfig: () => api.get('/payment/config'),
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
};

export const analyticsAPI = {
  getDashboardSummary: () => api.get('/admin/dashboard-summary'),
  getSalesAnalytics: (params) => api.get('/admin/analytics', { params }),
  getCustomers: (params) => api.get('/admin/customers', { params }),
  updateCustomerStatus: (id, data) => api.put(`/admin/customers/${id}/status`, data),
};

export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (productId) => api.post('/wishlist/toggle', { productId }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
  submitContact: (data) => api.post('/contact/submit', data),
};

export default api;
