const service = require("../services/academicOperationsService");

function handleError(res, error) {
    console.error("Academic operations error:", error.message);
    const status = error.code?.startsWith("ER_") ? 500 : 400;
    return res.status(status).json({ success: false, message: error.message });
}

function endpoint(method, dataKey = "data") {
    return async (req, res) => {
        try {
            const result = await method(req);
            return res.status(req.method === "POST" ? 201 : 200).json({ success: true, data: result, message: req.method === "POST" ? "Taarifa imehifadhiwa." : undefined });
        } catch (error) {
            return handleError(res, error);
        }
    };
}

const getExaminations = endpoint(() => service.getExaminations());
const getExaminationOptions = endpoint(() => service.getExaminationOptions());
const createExamination = endpoint((req) => service.createExamination(req.body));
const updateExaminationStatus = endpoint((req) => service.updateExaminationStatus(req.params.id, req.body.status));
const getAssignments = endpoint(() => service.getAssignments());
const getClassTeachers = endpoint(() => service.getClassTeachers());
const getClassTeacherOptions = endpoint(() => service.getClassTeacherOptions());
const createClassTeacher = endpoint((req) => service.createClassTeacher(req.body));
const getSubmissions = endpoint(() => service.getSubmissions());
const reviewSubmission = endpoint((req) => service.reviewSubmission(req.params.id, req.user.id, req.body));
const getResults = endpoint(() => service.getResults());
const getReports = endpoint(() => service.getReports());
const getReportOptions = endpoint(() => service.getReportOptions());
const getReportDetails = endpoint((req) => service.getReportDetails(req.query));
const getAcademicMasterProfile = endpoint((req) => service.getAcademicMasterProfile(req.user.id));
const changeOwnPassword = endpoint((req) => service.changeOwnPassword(req.user.id, req.body));

module.exports = { getExaminations, getExaminationOptions, createExamination, updateExaminationStatus, getAssignments, getClassTeachers, getClassTeacherOptions, createClassTeacher, getSubmissions, reviewSubmission, getResults, getReports, getReportOptions, getReportDetails, getAcademicMasterProfile, changeOwnPassword };
