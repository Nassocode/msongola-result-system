
"use strict";

const reportService = require("../services/reportServices");

async function getReportOptions(req, res) {
    try {
        const data = await reportService.getReportOptions();

        return res.status(200).json({
            success: true,
            message: "Report options loaded successfully.",
            data
        });

    } catch (error) {
        console.error("getReportOptions error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Imeshindikana kupakia taarifa za ripoti."
        });
    }
}


async function getReportDetails(req, res) {
    try {

        const {
            academic_year_id,
            examination_id,
            form_id,
            class_id,
            student_id,
            subject_id,
            report_type
        } = req.query;


        if (!examination_id) {
            return res.status(400).json({
                success: false,
                message: "examination_id inahitajika."
            });
        }


        if (!class_id) {
            return res.status(400).json({
                success: false,
                message: "class_id inahitajika."
            });
        }


        const filters = {
            academic_year_id: academic_year_id || null,
            examination_id: examination_id || null,
            form_id: form_id || null,
            class_id: class_id || null,
            student_id: student_id || null,
            subject_id: subject_id || null,
            report_type: report_type || "class"
        };


        const data = await reportService.generateReport(filters);


        return res.status(200).json({
            success: true,
            message: "Report generated successfully.",
            data
        });

    } catch (error) {

        console.error("getReportDetails error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Imeshindikana kutengeneza ripoti."
        });
    }
}


async function reportHealth(req, res) {

    return res.status(200).json({
        success: true,
        module: "reports",
        status: "online"
    });

}


module.exports = {
    getReportOptions,
    getReportDetails,
    reportHealth
};