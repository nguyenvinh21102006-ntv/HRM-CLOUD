const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true 
    },
    fullName: { 
        type: String, 
        required: true 
    },
    role: {
        type: String,
        enum: ['employee', 'team_leader', 'department_head', 'director', 'admin'],
        default: 'employee'
    },
    jobType: { 
        type: String, 
        enum: ['van_phong', 'kinh_doanh'], 
        default: 'van_phong' 
    },
    coefficient: { 
        type: Number, 
        default: 2.2 
    },
    seniorityYears: { 
        type: Number, 
        default: 0 
    },
    baseSalary: { 
        type: Number, 
        default: 4500000 
    },
    avatar: { 
        type: String, 
        default: '' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true  // Tự động thêm createdAt và updatedAt
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// So sánh mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Xóa index cũ nếu có (chạy 1 lần)
userSchema.on('index', function(error) {
    if (error) console.log('Index error:', error);
});

module.exports = mongoose.model('User', userSchema);