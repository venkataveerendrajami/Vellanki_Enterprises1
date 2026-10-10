const express = require('express');
const router = express.Router();

const { verifyToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const authController = require('../controllers/authController');
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const addressController = require('../controllers/addressController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const analyticsController = require('../controllers/analyticsController');
const settingsController = require('../controllers/settingsController');
const wishlistController = require('../controllers/wishlistController');

// ==========================================
// 1. AUTH ROUTES
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/admin-login', authController.adminLogin);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtpAndLogin);
router.post('/auth/forgot-password/send-otp', (req, res) => {
  req.body.purpose = 'forgot_password';
  return authController.sendOtp(req, res);
});
router.post('/auth/forgot-password/reset', authController.forgotPasswordReset);
router.get('/auth/profile', verifyToken, authController.getProfile);
router.put('/auth/profile', verifyToken, authController.updateProfile);
router.post('/auth/change-password', verifyToken, authController.changePassword);
router.post('/auth/verify-phone', verifyToken, authController.verifyPhone);
router.post('/auth/verify-email', verifyToken, authController.verifyEmail);
router.post('/auth/change-phone', verifyToken, authController.changePhone);
router.post('/auth/change-email', verifyToken, authController.changeEmail);

// ==========================================
// 2. CATEGORY ROUTES
// ==========================================
router.get('/categories', categoryController.getCategories);
router.get('/categories/:idOrSlug', categoryController.getCategory);
router.post('/categories', verifyToken, requireAdmin, upload.single('image'), categoryController.createCategory);
router.put('/categories/:id', verifyToken, requireAdmin, upload.single('image'), categoryController.updateCategory);
router.delete('/categories/:id', verifyToken, requireAdmin, categoryController.deleteCategory);

// ==========================================
// 3. PRODUCT ROUTES
// ==========================================
router.get('/products', productController.getProducts);
router.get('/products/:idOrSlug', productController.getProduct);
router.post('/products', verifyToken, requireAdmin, upload.array('images', 8), productController.createProduct);
router.put('/products/:id', verifyToken, requireAdmin, upload.array('images', 8), productController.updateProduct);
router.delete('/products/:id', verifyToken, requireAdmin, productController.deleteProduct);
router.post('/products/adjust-stock', verifyToken, requireAdmin, productController.adjustStock);
router.delete('/products/images/:imageId', verifyToken, requireAdmin, productController.deleteProductImage);

// ==========================================
// 4. CART ROUTES
// ==========================================
router.get('/cart', verifyToken, cartController.getCart);
router.post('/cart/add', verifyToken, cartController.addToCart);
router.put('/cart/items/:id', verifyToken, cartController.updateCartItem);
router.delete('/cart/items/:id', verifyToken, cartController.removeFromCart);
router.delete('/cart/clear', verifyToken, cartController.clearCart);

// ==========================================
// 5. ADDRESS ROUTES
// ==========================================
router.get('/addresses', verifyToken, addressController.getAddresses);
router.post('/addresses', verifyToken, addressController.createAddress);
router.put('/addresses/:id', verifyToken, addressController.updateAddress);
router.put('/addresses/:id/default', verifyToken, addressController.setDefaultAddress);
router.delete('/addresses/:id', verifyToken, addressController.deleteAddress);

// ==========================================
// 6. ORDER ROUTES
// ==========================================
router.post('/orders', verifyToken, orderController.placeOrder);
router.get('/orders/my-orders', verifyToken, orderController.getMyOrders);
router.get('/orders/:idOrNumber', verifyToken, orderController.getOrderDetails);
router.post('/orders/:id/cancel', verifyToken, orderController.cancelOrder);

// ==========================================
// 7. PAYMENT ROUTES (Razorpay)
// ==========================================
router.get('/payment/config', paymentController.getPaymentConfig);
router.post('/payment/create-order', verifyToken, paymentController.createRazorpayOrder);
router.post('/payment/verify', verifyToken, paymentController.verifyPayment);

// ==========================================
// 8. ADMIN MANAGEMENT & ANALYTICS ROUTES
// ==========================================
router.get('/admin/dashboard-summary', verifyToken, requireAdmin, analyticsController.getDashboardSummary);
router.get('/admin/analytics', verifyToken, requireAdmin, analyticsController.getSalesAnalytics);
router.get('/admin/orders', verifyToken, requireAdmin, orderController.getAllOrdersAdmin);
router.put('/admin/orders/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatusAdmin);
router.get('/admin/customers', verifyToken, requireAdmin, analyticsController.getCustomers);
router.put('/admin/customers/:id/status', verifyToken, requireAdmin, analyticsController.updateCustomerStatus);

// ==========================================
// 9. WISHLIST ROUTES
// ==========================================
router.get('/wishlist', verifyToken, wishlistController.getWishlist);
router.post('/wishlist/toggle', verifyToken, wishlistController.toggleWishlist);
router.delete('/wishlist/:productId', verifyToken, wishlistController.removeFromWishlist);

// ==========================================
// 10. SETTINGS & CONTACT ROUTES
// ==========================================
router.get('/settings', settingsController.getSettings);
router.put('/settings', verifyToken, requireAdmin, settingsController.updateSettings);
router.post('/contact/submit', settingsController.submitContactMessage);

module.exports = router;
