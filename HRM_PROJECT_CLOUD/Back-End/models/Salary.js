const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  totalSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  commission: { type: Number, default: 0 }, // chỉ cho nhân viên kinh doanh
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Salary', salarySchema);