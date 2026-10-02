const catalogService = require("../services/adminCatalogService");
const auditLogService = require("../services/auditLogService");

function getRequestInfo(req) {
    return {
        user_id: req.user?.id || null,
        ip_address: req.ip || req.socket?.remoteAddress || null,
        user_agent: req.get("User-Agent") || null
    };
}

function sendError(res, error) {
    return res.status(400).json({ success: false, message: error.message });
}

async function getTeachers(req, res) {
    try { return res.json({ success: true, data: await catalogService.getTeachers() }); }
    catch (error) { return sendError(res, error); }
}

async function getTeacherUserOptions(req, res) {
    try { return res.json({ success: true, data: await catalogService.getTeacherUserOptions() }); }
    catch (error) { return sendError(res, error); }
}

async function createTeacher(req, res) {
    try {
        const created = await catalogService.createTeacher(req.body);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "TEACHER_CREATED",
                module: "CATALOG",
                description: `Mwalimu ${req.body.first_name} ${req.body.last_name} ameundwa.`,
                record_id: created?.id || null,
                new_values: { first_name: req.body.first_name, last_name: req.body.last_name, status: req.body.status || "ACTIVE" }
            });
        } catch (auditError) {
            console.error("Teacher audit failed:", auditError.message);
        }
        return res.status(201).json({ success: true, data: created });
    } catch (error) { return sendError(res, error); }
}

async function getSubjects(req, res) {
    try { return res.json({ success: true, data: await catalogService.getSubjects() }); }
    catch (error) { return sendError(res, error); }
}

async function createSubject(req, res) {
    try {
        const created = await catalogService.createSubject(req.body);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "SUBJECT_CREATED",
                module: "CATALOG",
                description: `Somo ${req.body.subject_name} limeundwa.`,
                record_id: created?.id || null,
                new_values: { subject_name: req.body.subject_name, subject_code: req.body.subject_code, status: req.body.status || "ACTIVE" }
            });
        } catch (auditError) {
            console.error("Subject audit failed:", auditError.message);
        }
        return res.status(201).json({ success: true, data: created });
    } catch (error) { return sendError(res, error); }
}

async function getClasses(req, res) {
    try { return res.json({ success: true, data: await catalogService.getClasses() }); }
    catch (error) { return sendError(res, error); }
}

async function getClassOptions(req, res) {
    try { return res.json({ success: true, data: await catalogService.getClassOptions() }); }
    catch (error) { return sendError(res, error); }
}

async function createClass(req, res) {
    try {
        const created = await catalogService.createClass(req.body);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "CLASS_CREATED",
                module: "CATALOG",
                description: `Darasa ${req.body.class_name} limeundwa.`,
                record_id: created?.id || null,
                new_values: { class_name: req.body.class_name, form_id: req.body.form_id, academic_year_id: req.body.academic_year_id }
            });
        } catch (auditError) {
            console.error("Class audit failed:", auditError.message);
        }
        return res.status(201).json({ success: true, data: created });
    } catch (error) { return sendError(res, error); }
}

async function getAssignments(req, res) {
    try { return res.json({ success: true, data: await catalogService.getAssignments() }); }
    catch (error) { return sendError(res, error); }
}

async function getAssignmentOptions(req, res) {
    try { return res.json({ success: true, data: await catalogService.getAssignmentOptions() }); }
    catch (error) { return sendError(res, error); }
}

async function createAssignment(req, res) {
    try {
        const created = await catalogService.createAssignment(req.body);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "ASSIGNMENT_CREATED",
                module: "CATALOG",
                description: `Uwekaji wa somo wa darasa ${req.body.class_id} uliundwa.`,
                record_id: created?.id || null,
                new_values: { class_id: req.body.class_id, subject_id: req.body.subject_id, teacher_id: req.body.teacher_id }
            });
        } catch (auditError) {
            console.error("Assignment audit failed:", auditError.message);
        }
        return res.status(201).json({ success: true, data: created });
    } catch (error) { return sendError(res, error); }
}

async function getClassTeachers(req, res) {
    try { return res.json({ success: true, data: await catalogService.getClassTeachers() }); }
    catch (error) { return sendError(res, error); }
}

async function getClassTeacherOptions(req, res) {
    try { return res.json({ success: true, data: await catalogService.getClassTeacherOptions() }); }
    catch (error) { return sendError(res, error); }
}

async function createClassTeacher(req, res) {
    try {
        const created = await catalogService.createClassTeacher(req.body);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "CLASS_TEACHER_ASSIGNED",
                module: "CATALOG",
                description: `Mwalimu wa darasa ${req.body.class_id} amewekwa.`,
                record_id: created?.id || null,
                new_values: { class_id: req.body.class_id, teacher_id: req.body.teacher_id, academic_year_id: req.body.academic_year_id }
            });
        } catch (auditError) {
            console.error("Class teacher audit failed:", auditError.message);
        }
        return res.status(201).json({ success: true, data: created });
    } catch (error) { return sendError(res, error); }
}

async function getFormCoordinators(req, res) {
    try { return res.json({ success: true, data: await catalogService.getFormCoordinators() }); }
    catch (error) { return sendError(res, error); }
}

async function getFormCoordinatorOptions(req, res) {
    try { return res.json({ success: true, data: await catalogService.getFormCoordinatorOptions() }); }
    catch (error) { return sendError(res, error); }
}

async function createFormCoordinator(req, res) {
    try {
        const created = await catalogService.createFormCoordinator(req.body);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "FORM_COORDINATOR_ASSIGNED",
                module: "CATALOG",
                description: `Mratibu wa form ${req.body.form_id} amewekwa.`,
                record_id: created?.id || null,
                new_values: { form_id: req.body.form_id, teacher_id: req.body.teacher_id, academic_year_id: req.body.academic_year_id }
            });
        } catch (auditError) {
            console.error("Form coordinator audit failed:", auditError.message);
        }
        return res.status(201).json({ success: true, data: created });
    } catch (error) { return sendError(res, error); }
}

async function updateCatalogStatus(req, res) {
    try {
        const result = await catalogService.updateCatalogStatus(req.params.resource, req.params.id, req.body.status);
        try {
            await auditLogService.createAuditLog({
                ...getRequestInfo(req),
                action: "CATALOG_STATUS_UPDATED",
                module: "CATALOG",
                description: `Hali ya ${req.params.resource} ${req.params.id} imebadilishwa kuwa ${req.body.status}.`,
                record_id: Number(req.params.id),
                new_values: { resource: req.params.resource, status: req.body.status }
            });
        } catch (auditError) {
            console.error("Catalog status audit failed:", auditError.message);
        }
        return res.json({ success: true, data: result });
    } catch (error) { return sendError(res, error); }
}

module.exports = { getTeachers, getTeacherUserOptions, createTeacher, getSubjects, createSubject, getClasses, getClassOptions, createClass, getAssignments, getAssignmentOptions, createAssignment, getClassTeachers, getClassTeacherOptions, createClassTeacher, getFormCoordinators, getFormCoordinatorOptions, createFormCoordinator, updateCatalogStatus };
