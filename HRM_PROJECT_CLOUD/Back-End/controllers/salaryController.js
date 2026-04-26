const User = require('../models/User');
const Salary = require('../models/Salary');

// Hàm tính lương theo công thức đặc tả
const calculateSalary = (user, bonus = 0, revenue = 0) => {
  const base = user.baseSalary;
  const seniorityBonus = base * (user.seniorityYears * 0.03);
  let salary = base + seniorityBonus;

  if (user.role === 'director') {
    salary = base + (user.coefficient * base) + seniorityBonus;
  } else if (user.role === 'department_head') {
    salary = base + (user.coefficient * base) + seniorityBonus + bonus;
  } else if (user.role === 'team_leader') {
    salary = base + (user.coefficient * base) + seniorityBonus + bonus;
  } else if (user.jobType === 'van_phong') {
    salary = base + (user.coefficient * base) + seniorityBonus + bonus;
  } else if (user.jobType === 'kinh_doanh') {
    const commission = revenue * 0.05;
    salary = base + commission + (user.coefficient * base) + seniorityBonus + bonus;
  }
  return Math.round(salary);
};

exports.getUserSalary = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    
    const { bonus = 0, revenue = 0 } = req.query;
    const salary = calculateSalary(user, parseFloat(bonus), parseFloat(revenue));
    
    res.json({ userId: user._id, fullName: user.fullName, salary });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tính lương' });
  }
};

exports.calculateAndSaveSalary = async (req, res) => {
  try {
    const { userId, month, year, bonus, revenue } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const total = calculateSalary(user, bonus, revenue);
    const salaryDoc = await Salary.create({
      userId, month, year, totalSalary: total, bonus, commission: revenue * 0.05
    });
    res.status(201).json(salaryDoc);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lưu bảng lương' });
  }
};