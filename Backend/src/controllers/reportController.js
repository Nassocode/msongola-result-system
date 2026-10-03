
"use strict";

const reportService = require("../services/reportServices");
const reportExportService = require("../services/reportExportService");

function reportErrorStatus(error) {
    if (error.code?.startsWith("ER_")) return 500;
    if (error.statusCode) return error.statusCode;
    if (error.message === "No approved results are available for the selected criteria.") return 422;
    return 400;
}

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

        return res.status(reportErrorStatus(error)).json({
            success: false,
            message: error.message || "Imeshindikana kupakia taarifa za ripoti."
        });
    }
}

async function getReportStudents(req, res) {
    try {
        const students = await reportService.getStudentsForClass(req.query);
        return res.status(200).json({ success: true, data: students });
    } catch (error) {
        return res.status(reportErrorStatus(error)).json({ success: false, message: error.message });
    }
}


async function getReportDetails(req, res) {
    try {
        const data = await reportService.generateReport(req.query, req.user?.username);

        return res.status(200).json({
            success: true,
            message: "Report generated successfully.",
            data
        });

    } catch (error) {
        console.error("getReportDetails error:", error);
        return res.status(reportErrorStatus(error)).json({
            success: false,
            message: error.message || "Imeshindikana kutengeneza ripoti."
        });
    }
}

async function exportReport(req, res, format) {
    try {
        const report = await reportService.generateReport(req.body || {}, req.user?.username);
        const buffer = format === "excel"
            ? await reportExportService.createExcelBuffer(report)
            : await reportExportService.createPdfBuffer(report);
        const extension = format === "excel" ? "xlsx" : "pdf";
        const mime = format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf";
        const filename = `msongola-${report.report_type}-report-${new Date().toISOString().slice(0, 10)}.${extension}`;

        return res.status(200)
            .type(mime)
            .set("Content-Disposition", `attachment; filename="${filename}"`)
            .set("Content-Length", String(buffer.length))
            .send(buffer);
    } catch (error) {
        console.error(`${format} report export error:`, error);
        return res.status(reportErrorStatus(error)).json({
            success: false,
            message: error.message || "Imeshindikana ku-export ripoti."
        });
    }
}

async function exportReportExcel(req, res) {
    return exportReport(req, res, "excel");
}

async function exportReportPdf(req, res) {
    return exportReport(req, res, "pdf");
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
    getReportStudents,
    exportReportExcel,
    exportReportPdf,
    reportHealth
};