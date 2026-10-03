const studentService = require("../services/studentService");

async function getStudents(req, res) {
    try {
        const students = await studentService.listStudents();

        return res.status(200).json({
            success: true,
            message: "Wanafunzi wamepatikana",
            data: students
        });
    } catch (error) {
        console.error("Get students error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Imeshindikana kupata wanafunzi"
        });
    }
}

async function getStudentById(req, res) {
    try {
        const { id } = req.params;
        const student = await studentService.getStudentById(id);

        return res.status(200).json({
            success: true,
            message: "Mwanafunzi amepatikana",
            data: student
        });
    } catch (error) {
        console.error("Get student error:", error.message);

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}

async function createStudent(req, res) {
    try {
        const student = await studentService.createStudent(req.body);

        return res.status(201).json({
            success: true,
            message: "Mwanafunzi amehifadhiwa",
            data: student
        });
    } catch (error) {
        console.error("Create student error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function updateStudent(req, res) {
    try {
        const student = await studentService.updateStudent(req.params.id, req.body);
        return res.status(200).json({ success: true, message: "Taarifa za mwanafunzi zimebadilishwa.", data: student });
    } catch (error) {
        console.error("Update student error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}

async function updateStudentStatus(req, res) {
    try {
        const student = await studentService.updateStudentStatus(req.params.id, req.body.status);
        return res.status(200).json({ success: true, message: "Hali ya mwanafunzi imebadilishwa.", data: student });
    } catch (error) {
        console.error("Update student status error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}

async function getClassOptions(req, res) {
    try {
        const classes = await studentService.getClassOptions(
            req.query.academic_year,
            req.query.form_number
        );

        return res.status(200).json({
            success: true,
            message: "Darasa limepatikana",
            data: classes
        });
    } catch (error) {
        console.error("Get class options error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Imeshindikana kupata darasa"
        });
    }
}

async function getClassSubjectOptions(req, res) {
    try {
        const result = await studentService.getClassSubjectOptions(
            req.params.classId,
            req.query.academic_stream,
            req.query.islamic_studies,
            req.query.science_subjects
        );
        return res.status(200).json({
            success: true,
            message: "Masomo ya mwanafunzi yamepatikana.",
            data: result
        });
    } catch (error) {
        console.error("Get student subject options error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    updateStudentStatus,
    getClassOptions,
    getClassSubjectOptions
};
