const teacherDashboardService = require("../services/teacherDashboardService");

async function getDashboard(req, res) {
    try {
        const dashboard = await teacherDashboardService.getDashboard(req.user.id);

        return res.status(200).json({
            success: true,
            message: "Teacher dashboard data zimepatikana",
            data: dashboard
        });
    } catch (error) {
        console.error("Teacher dashboard error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Imeshindikana kupata teacher dashboard"
        });
    }
}

module.exports = {
    getDashboard
};
