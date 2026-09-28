const academicMasterService =
    require("../services/academicMasterService");


/* =========================================================
   GET ACADEMIC MASTER DASHBOARD
   ========================================================= */

async function getDashboard(req, res) {

    try {

        const dashboard =
            await academicMasterService
                .getDashboardStatistics();


        return res.status(200).json({

            success: true,

            message:
                "Academic Master dashboard data zimepatikana",

            data: dashboard

        });

    } catch (error) {

        console.error(
            "Academic Master dashboard error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Imeshindikana kupata taarifa za Academic Master dashboard"

        });

    }

}


module.exports = {

    getDashboard

};