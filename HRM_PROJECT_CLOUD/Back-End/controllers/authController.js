const User = require('../models/User');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đún' });
        }
        
        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không' });
        }
        
        req.session.user = {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            jobType: user.jobType,
            coefficient: user.coefficient,
            seniorityYears: user.seniorityYears
        };
        
        res.status(200).json({ 
            message: 'Đăng nhập thành công', 
            redirectUrl: '/home.html',
            user: req.session.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'Lỗi đăng xuất' });
        res.clearCookie('hrm_session_id');
        res.status(200).json({ message: 'Đăng xuất thành công' });
    });
};

exports.getCurrentUser = (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Chưa đăng nhập' });
    }
};