const promotionService = require("../services/studentPromotionService");

async function activateAcademicYear(req, res) {
    try {
        const data = await promotionService.activateAcademicYear(req.body.academic_year_id);
        return res.status(200).json({
            success: true,
            message: `Academic year ${data.year_label} sasa ndiyo mwaka unaoendelea.`,
            data
        });
    } catch (error) {
        console.error("Activate academic year error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}

async function createAcademicYear(req, res) {
    try {
        const data = await promotionService.createAcademicYear(req.body);
        return res.status(201).json({
            success: true,
            message: `Academic year ${data.year_label} imeongezwa. Sasa tengeneza madarasa yake kabla ya promotion.`,
            data
        });
    } catch (error) {
        console.error("Create promotion academic year error:", error.message);
        return res.status(400).json({ success: false, message: error.code === "ER_DUP_ENTRY"
            ? "Academic year hii tayari ipo."
            : error.message });
    }
}

async function getOptions(req, res) {
    try {
        const data = await promotionService.getOptions();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Get student promotion options error:", error.message);
        return res.status(500).json({ success: false, message: "Imeshindikana kupata taarifa za promotion." });
    }
}

async function getPreview(req, res) {
    try {
        const data = await promotionService.getPreview(req.body.source_class_id, req.body.target_class_id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Preview student promotion error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}

async function promote(req, res) {
    try {
        const data = await promotionService.promote(req.body.source_class_id, req.body.target_class_id);
        return res.status(200).json({
            success: true,
            message: `Wanafunzi ${data.promoted_count} wamehamishiwa mwaka mpya bila kutengeneza rekodi mpya.`,
            data
        });
    } catch (error) {
        console.error("Promote students error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = { activateAcademicYear, createAcademicYear, getOptions, getPreview, promote };
