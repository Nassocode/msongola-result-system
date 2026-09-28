const academicMasterModel =
    require("../models/academicMasterModel");


/* =========================================================
   GET ACADEMIC MASTER DASHBOARD
   ========================================================= */

async function getDashboardStatistics() {

    const dashboard =
        await academicMasterModel
            .getDashboardStatistics();


    return dashboard;
}


module.exports = {
    getDashboardStatistics
};