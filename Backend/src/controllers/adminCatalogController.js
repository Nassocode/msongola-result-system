const catalogService = require("../services/adminCatalogService");

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
    try { return res.status(201).json({ success: true, data: await catalogService.createTeacher(req.body) }); }
    catch (error) { return sendError(res, error); }
}

async function getSubjects(req, res) {
    try { return res.json({ success: true, data: await catalogService.getSubjects() }); }
    catch (error) { return sendError(res, error); }
}

async function createSubject(req, res) {
    try { return res.status(201).json({ success: true, data: await catalogService.createSubject(req.body) }); }
    catch (error) { return sendError(res, error); }
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
    try { return res.status(201).json({ success: true, data: await catalogService.createClass(req.body) }); }
    catch (error) { return sendError(res, error); }
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
    try { return res.status(201).json({ success: true, data: await catalogService.createAssignment(req.body) }); }
    catch (error) { return sendError(res, error); }
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
    try { return res.status(201).json({ success: true, data: await catalogService.createClassTeacher(req.body) }); }
    catch (error) { return sendError(res, error); }
}
module.exports = { getTeachers, getTeacherUserOptions, createTeacher, getSubjects, createSubject, getClasses, getClassOptions, createClass, getAssignments, getAssignmentOptions, createAssignment, getClassTeachers, getClassTeacherOptions, createClassTeacher, getFormCoordinators, getFormCoordinatorOptions, createFormCoordinator, updateCatalogStatus };

async function getClassTeachers(req, res) {
    try { return res.json({ success: true, data: await catalogService.getClassTeachers() }); }
    catch (error) { return sendError(res, error); }
}
async function getClassTeacherOptions(req, res) {
    try { return res.json({ success: true, data: await catalogService.getClassTeacherOptions() }); }
    catch (error) { return sendError(res, error); }
}
async function createClassTeacher(req, res) {
    try { return res.status(201).json({ success: true, data: await catalogService.createClassTeacher(req.body) }); }
    catch (error) { return sendError(res, error); }
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
    try { return res.status(201).json({ success: true, data: await catalogService.createFormCoordinator(req.body) }); }
    catch (error) { return sendError(res, error); }
}

async function updateCatalogStatus(req, res) {
    try { return res.json({ success: true, data: await catalogService.updateCatalogStatus(req.params.resource, req.params.id, req.body.status) }); }
    catch (error) { return sendError(res, error); }
}

module.exports = { getTeachers, getTeacherUserOptions, createTeacher, getSubjects, createSubject, getClasses, getClassOptions, createClass, getAssignments, getAssignmentOptions, createAssignment, getClassTeachers, getClassTeacherOptions, createClassTeacher, getFormCoordinators, getFormCoordinatorOptions, createFormCoordinator, updateCatalogStatus };
