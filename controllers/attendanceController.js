const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

// ─────────────────────────────────────────────
// @desc    Get attendance records (filter by date / staff / month)
// @route   GET /api/attendance
// @access  Private
// ─────────────────────────────────────────────
const getAttendance = async (req, res) => {
  try {
    const { date, staffId, month, year } = req.query;
    const query = {};

    if (staffId) query.staff = staffId;

    if (date) {
      // Exact date — match the full day range
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate('staff', 'name phone role department')
      .populate('markedBy', 'username')
      .sort({ date: -1 });

    res.json({ success: true, total: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Mark attendance for all staff on a given date (bulk)
// @route   POST /api/attendance/bulk
// @access  Private (Admin)
// Body: { date: "YYYY-MM-DD", records: [{ staffId, status, checkInTime, remarks }] }
// ─────────────────────────────────────────────
const markBulkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'date and records[] are required.' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Use bulkWrite with upsert to allow re-marking on the same day
    const operations = records.map((rec) => ({
      updateOne: {
        filter: { staff: rec.staffId, date: attendanceDate },
        update: {
          $set: {
            status: rec.status,
            checkInTime: rec.checkInTime || '',
            remarks: rec.remarks || '',
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    res.json({ success: true, message: `Attendance marked for ${records.length} staff on ${date}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get monthly attendance summary for a staff member
// @route   GET /api/attendance/monthly/:staffId
// @access  Private
// ─────────────────────────────────────────────
const getMonthlyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const m = month ? Number(month) : currentDate.getMonth() + 1;
    const y = year ? Number(year) : currentDate.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      staff: req.params.staffId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Summarize counts
    const summary = { Present: 0, Absent: 0, 'Half Day': 0, Leave: 0, Late: 0 };
    records.forEach((r) => { if (summary[r.status] !== undefined) summary[r.status]++; });

    res.json({ success: true, month: m, year: y, summary, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Attendance summary report across all staff for a month
// @route   GET /api/attendance/report
// @access  Private
// ─────────────────────────────────────────────
const getAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const m = month ? Number(month) : currentDate.getMonth() + 1;
    const y = year ? Number(year) : currentDate.getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const allStaff = await Staff.find({ status: 'active' }).select('name role department');

    const reportData = await Promise.all(
      allStaff.map(async (s) => {
        const records = await Attendance.find({
          staff: s._id,
          date: { $gte: start, $lte: end },
        });
        const summary = { Present: 0, Absent: 0, 'Half Day': 0, Leave: 0, Late: 0 };
        records.forEach((r) => { if (summary[r.status] !== undefined) summary[r.status]++; });
        return { staff: s, summary };
      })
    );

    res.json({ success: true, month: m, year: y, data: reportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAttendance, markBulkAttendance, getMonthlyAttendance, getAttendanceReport };
