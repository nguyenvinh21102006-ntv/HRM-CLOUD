const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { login, logout, getCurrentUser } = require('../controllers/authController');
const { getUserSalary, calculateAndSaveSalary } = require('../controllers/salaryController');
const { getAllUsers, createUser, updateUser, deleteUser, updateProfile } = require('../controllers/userController');

const router = express.Router();

// Auth
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getCurrentUser);

// Salary
router.get('/salary/:userId', protect, getUserSalary);
router.post('/salary', protect, authorize('admin', 'director', 'department_head'), calculateAndSaveSalary);

// User management
router.get('/users', protect, authorize('admin', 'director', 'department_head'), getAllUsers);
router.post('/users', protect, authorize('admin', 'director', 'department_head'), createUser);
router.put('/users/:id', protect, authorize('admin', 'director', 'department_head'), updateUser);
router.delete('/users/:id', protect, authorize('admin', 'director', 'department_head'), deleteUser);
router.put('/profile/:id', protect, updateProfile);

module.exports = router;