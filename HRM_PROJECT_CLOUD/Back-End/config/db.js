const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import model
const User = require('../models/User');

const DEFAULT_ADMIN = {
    email: 'admin@hrm.com',
    password: 'Admin@123456',
    fullName: 'Quản trị viên hệ thống',
    role: 'admin',
    jobType: 'van_phong',
    coefficient: 4.0,
    seniorityYears: 0,
    baseSalary: 4500000
};

const SAMPLE_USERS = [
    { email: 'director@hrm.com', password: 'Director@123', fullName: 'Nguyễn Văn Giám Đốc', role: 'director', jobType: 'van_phong', coefficient: 4.0, seniorityYears: 5 },
    { email: 'depthead@hrm.com', password: 'DeptHead@123', fullName: 'Trần Thị Trưởng Phòng', role: 'department_head', jobType: 'van_phong', coefficient: 2.8, seniorityYears: 3 },
    { email: 'teamleader@hrm.com', password: 'TeamLeader@123', fullName: 'Lê Văn Trưởng Nhóm', role: 'team_leader', jobType: 'kinh_doanh', coefficient: 2.5, seniorityYears: 2 },
    { email: 'employee1@hrm.com', password: 'Employee@123', fullName: 'Phạm Thị Nhân Viên VP', role: 'employee', jobType: 'van_phong', coefficient: 2.2, seniorityYears: 1 },
    { email: 'employee2@hrm.com', password: 'Employee@123', fullName: 'Hoàng Văn Kinh Doanh', role: 'employee', jobType: 'kinh_doanh', coefficient: 2.0, seniorityYears: 0 }
];

async function createDefaultAdmin() {
    try {
        const existingAdmin = await User.findOne({ role: 'admin' });
        
        if (!existingAdmin) {
            console.log('🔐 Creating default admin...');
            const admin = new User(DEFAULT_ADMIN);
            await admin.save();
            console.log('✅ Admin created:', DEFAULT_ADMIN.email);
        } else {
            console.log('✅ Admin already exists:', existingAdmin.email);
        }
    } catch (error) {
        if (error.code === 11000) {
            console.log('⚠️ Admin already exists (duplicate key)');
        } else {
            console.error('❌ Error creating admin:', error.message);
        }
    }
}

async function createSampleUsers() {
    try {
        for (const userData of SAMPLE_USERS) {
            const existing = await User.findOne({ email: userData.email });
            if (!existing) {
                const user = new User(userData);
                await user.save();
                console.log(`✅ Created sample user: ${userData.email} (${userData.role})`);
            }
        }
    } catch (error) {
        if (error.code !== 11000) {
            console.error('❌ Error creating sample user:', error.message);
        }
    }
}

async function listAllUsers() {
    try {
        const users = await User.find().select('email role fullName').lean();
        console.log('\n📋 Available accounts:');
        console.log('=' .repeat(50));
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} | ${user.role} | ${user.fullName}`);
        });
        console.log('=' .repeat(50));
        console.log(`Total: ${users.length} accounts\n`);
    } catch (error) {
        console.error('Error listing users:', error.message);
    }
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });
        
        console.log('✅ MongoDB connected');
        console.log(`📁 Database: ${mongoose.connection.name}`);
        
        // Tạo admin và sample users
        await createDefaultAdmin();
        await createSampleUsers();
        
        // Hiển thị danh sách tài khoản
        await listAllUsers();
        
        return mongoose.connection;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;