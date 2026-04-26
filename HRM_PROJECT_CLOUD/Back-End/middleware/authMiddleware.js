const User = require('../models/User');

exports.protect = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Không có quyền truy cập, vui lòng đăng nhập!' });
  }
  next();
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này!' });
    }
    next();
  };
};