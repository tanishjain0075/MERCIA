const Bill = require('../models/Bill');
const Inventory = require('../models/Inventory');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Attendance = require('../models/Attendance');

// ─────────────────────────────────────────────
// @desc    Get live dashboard KPI stats
// @route   GET /api/dashboard/stats
// @access  Private
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Run all DB queries in parallel for speed
    const [
      monthlyBills,
      totalBills,
      lowStockItems,
      outOfStockItems,
      totalInventory,
      totalStaff,
      activeStaff,
      totalCustomers,
      todayAttendance,
    ] = await Promise.all([
      // Revenue this month (only Paid bills)
      Bill.aggregate([
        { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth }, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Bill.countDocuments(),
      Inventory.countDocuments({ status: 'low-stock' }),
      Inventory.countDocuments({ status: 'out-of-stock' }),
      Inventory.countDocuments(),
      Staff.countDocuments(),
      Staff.countDocuments({ status: 'active' }),
      Customer.countDocuments(),
      // Today's attendance
      Attendance.aggregate([
        {
          $match: {
            date: {
              $gte: new Date(now.toDateString()),
              $lte: new Date(now.toDateString() + ' 23:59:59'),
            },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const monthRevenue = monthlyBills[0]?.total || 0;
    const monthBillCount = monthlyBills[0]?.count || 0;

    // Inventory health items (low/out of stock)
    const criticalItems = await Inventory.find(
      { status: { $in: ['low-stock', 'out-of-stock'] } },
      'name sku stockQty minStockLevel status'
    ).limit(5);

    // Recent bills
    const recentBills = await Bill.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('billNumber customerName grandTotal paymentStatus createdAt');

    // Today attendance summary
    const attendanceSummary = {};
    todayAttendance.forEach((a) => { attendanceSummary[a._id] = a.count; });

    const teamAvailability =
      totalStaff > 0
        ? Math.round(((attendanceSummary['Present'] || 0) / activeStaff) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          ordersProcessed: totalBills,
          monthRevenue: monthRevenue.toFixed(2),
          monthBillCount,
          lowStockAlerts: lowStockItems + outOfStockItems,
          teamAvailability,
          totalInventory,
          totalStaff,
          totalCustomers,
        },
        inventoryHealth: criticalItems,
        recentBills,
        attendanceSummary,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
