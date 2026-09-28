const teacherDashboardModel = require("../models/teacherDashboardModel");

async function getDashboard(userId) {
    return teacherDashboardModel.getTeacherDashboard(userId);
}

module.exports = {
    getDashboard
};
