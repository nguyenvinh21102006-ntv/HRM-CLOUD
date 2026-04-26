const User = require('../models/User');

// Admin/director/department_head có quyền CRUD tất cả user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách user' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, fullName, role, jobType, coefficient, seniorityYears } = req.body;
    const user = await User.create({ email, password, fullName, role, jobType, coefficient, seniorityYears });
    res.status(201).json({ message: 'Tạo user thành công', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Cập nhật thành công', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa user thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Nhân viên chỉ được sửa thông tin của chính mình
exports.updateProfile = async (req, res) => {
  try {
    if (req.session.user.id !== req.params.id && !['admin', 'director', 'department_head'].includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Bạn chỉ được sửa thông tin của chính mình' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Cập nhật profile thành công', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};