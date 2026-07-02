const express = require('express');
const router = express.Router();
const {
  getAttendance, markBulkAttendance, getMonthlyAttendance, getAttendanceReport,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getAttendance);
router.post('/bulk', requireRole('admin'), markBulkAttendance);
router.get('/report', getAttendanceReport);
router.get('/monthly/:staffId', getMonthlyAttendance);

module.exports = router;
