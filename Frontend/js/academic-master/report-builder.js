"use strict";

/*

* MSONGOLA RESULT SYSTEM
* Academic Master - Report Builder
*
* Responsibilities:
* * Protect Academic Master page
* * Load report options
* * Handle report type
* * Handle dependent filters
* * Generate report
* * Render approved results
* * Calculate summary
* * Print / PDF
* * Export Excel
    */

(function () {

const state = {
    reportType: "class",
    options: {
        academic_years: [],
        examinations: [],
        forms: [],
        classes: [],
        students: [],
        subjects: []
    },
    report: null,
    loading: false
};


const $ = (id) => document.getElementById(id);


/* =====================================================
   DOM
===================================================== */

const reportTypeContainer = $("reportType");

const reportYear = $("reportYear");
const reportExam = $("reportExam");
const reportForm = $("reportForm");
const reportClass = $("reportClass");
const reportStudent = $("reportStudent");
const reportSubject = $("reportSubject");

const studentFilterGroup = $("studentFilterGroup");
const subjectFilterGroup = $("subjectFilterGroup");

const generateReportBtn = $("generateReport");
const resetReportFiltersBtn = $("resetReportFilters");

const reportEmpty = $("reportEmpty");
const officialReport = $("officialReport");

const reportRows = $("reportRows");

const summaryStudents = $("summaryStudents");
const summaryAverage = $("summaryAverage");
const summaryPoints = $("summaryPoints");
const summaryApproved = $("summaryApproved");

const exportExcel = $("exportExcel");
const exportPdf = $("exportPdf");
const printReport = $("printReport");

const exportExcelBottom = $("exportExcelBottom");
const exportPdfBottom = $("exportPdfBottom");
const printReportBottom = $("printReportBottom");

const reportNarrative = $("reportNarrative");


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", init);


async function init() {

    if (window.MsongolaAuth) {
        try {
            await MsongolaAuth.protectPage({
                roles: ["ACADEMIC_MASTER"]
            });
        } catch (error) {
            console.error("Page protection error:", error);
        }
    }

    bindEvents();
    updateReportTypeUI();
    setInitialDate();

    await loadReportOptions();
}


/* =====================================================
   EVENTS
===================================================== */

function bindEvents() {

    if (reportTypeContainer) {

        reportTypeContainer.addEventListener("click", function (event) {

            const card = event.target.closest("[data-report-type]");

            if (!card) {
                return;
            }

            state.reportType = card.dataset.reportType || "class";

            updateReportTypeUI();

        });
    }


    reportYear?.addEventListener("change", handleYearChange);

    reportExam?.addEventListener("change", handleExamChange);

    reportForm?.addEventListener("change", handleFormChange);

    reportClass?.addEventListener("change", handleClassChange);


    generateReportBtn?.addEventListener(
        "click",
        generateReport
    );


    resetReportFiltersBtn?.addEventListener(
        "click",
        resetFilters
    );


    printReport?.addEventListener(
        "click",
        printOfficialReport
    );


    printReportBottom?.addEventListener(
        "click",
        printOfficialReport
    );


    exportExcel?.addEventListener(
        "click",
        exportReportExcel
    );


    exportExcelBottom?.addEventListener(
        "click",
        exportReportExcel
    );


    exportPdf?.addEventListener(
        "click",
        exportReportPdf
    );


    exportPdfBottom?.addEventListener(
        "click",
        exportReportPdf
    );


    reportNarrative?.addEventListener(
        "input",
        function () {

            if (state.report) {
                state.report.narrative =
                    reportNarrative.value.trim();
            }

        }
    );
}


/* =====================================================
   REPORT TYPE UI
===================================================== */

function updateReportTypeUI() {

    const cards =
        reportTypeContainer?.querySelectorAll(
            "[data-report-type]"
        ) || [];


    cards.forEach((card) => {

        card.classList.toggle(
            "active",
            card.dataset.reportType === state.reportType
        );

    });


    const needsStudent =
        state.reportType === "student";


    const needsSubject =
        state.reportType === "subject";


    if (studentFilterGroup) {
        studentFilterGroup.hidden = !needsStudent;
    }


    if (subjectFilterGroup) {
        subjectFilterGroup.hidden = !needsSubject;
    }


    if (!needsStudent && reportStudent) {
        reportStudent.value = "";
    }


    if (!needsSubject && reportSubject) {
        reportSubject.value = "";
    }
}


/* =====================================================
   OPTIONS
===================================================== */

async function loadReportOptions() {

    setLoading(true);

    try {

        const response =
            await MsongolaAPI.get(
                "/academic-master/operations/reports/options"
            );


        const data =
            extractResponseData(response);


        state.options = normalizeOptions(data);


        populateSelect(
            reportYear,
            state.options.academic_years,
            "Chagua Academic Year"
        );


        populateSelect(
            reportExam,
            state.options.examinations,
            "Chagua Examination"
        );


        populateSelect(
            reportForm,
            state.options.forms,
            "Chagua Form"
        );


        populateSelect(
            reportClass,
            state.options.classes,
            "Chagua Darasa"
        );


        populateSelect(
            reportStudent,
            state.options.students,
            "Chagua Mwanafunzi"
        );


        populateSelect(
            reportSubject,
            state.options.subjects,
            "Chagua Somo"
        );


        resetDependentFilters();


    } catch (error) {

        console.error(
            "Report options error:",
            error
        );


        showReportError(
            error.message ||
            "Imeshindikana kupakia taarifa za ripoti."
        );

    } finally {

        setLoading(false);
    }
}


function normalizeOptions(data) {

    const source = data || {};


    return {
        academic_years:
            source.academic_years ||
            source.academicYears ||
            source.years ||
            [],

        examinations:
            source.examinations ||
            source.exams ||
            [],

        forms:
            source.forms ||
            [],

        classes:
            source.classes ||
            [],

        students:
            source.students ||
            [],

        subjects:
            source.subjects ||
            []
    };
}


function buildOptionLabel(item) {
    if (!item || typeof item !== "object") {
        return "";
    }

    const fullName = [
        item.first_name,
        item.middle_name,
        item.last_name
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (fullName) {
        return fullName;
    }

    if (item.student_name) {
        return item.student_name;
    }

    if (item.subject_code && item.subject_name) {
        return `${item.subject_code} - ${item.subject_name}`;
    }

    if (item.subject_name) {
        return item.subject_name;
    }

    if (item.exam_name) {
        return item.exam_name;
    }

    if (item.class_name) {
        return item.class_name;
    }

    if (item.form_name) {
        return item.form_name;
    }

    if (item.year_label) {
        return item.year_label;
    }

    if (item.name) {
        return item.name;
    }

    if (item.title) {
        return item.title;
    }

    if (item.label) {
        return item.label;
    }

    if (item.year_name) {
        return item.year_name;
    }

    if (item.year) {
        return item.year;
    }

    if (item.academic_year) {
        return item.academic_year;
    }

    return "";
}

function populateSelect(
    select,
    items,
    placeholder
) {

    if (!select) {
        return;
    }


    select.innerHTML = "";


    const firstOption =
        document.createElement("option");


    firstOption.value = "";

    firstOption.textContent =
        placeholder;


    select.appendChild(firstOption);


    (items || []).forEach((item) => {

        const option =
            document.createElement("option");


        const id =
            item.id ??
            item.value ??
            item.academic_year_id ??
            item.examination_id ??
            item.form_id ??
            item.class_id ??
            item.student_id ??
            item.subject_id;


        const label =
            buildOptionLabel(item) ||
            String(id ?? "");


        option.value = id ?? "";

        option.textContent = label;


        Object.entries(item).forEach(
            ([key, value]) => {

                if (
                    value !== null &&
                    value !== undefined
                ) {
                    option.dataset[key] =
                        String(value);
                }

            }
        );


        select.appendChild(option);

    });
}


/* =====================================================
   DEPENDENT FILTERS
===================================================== */

function handleYearChange() {

    const yearId =
        reportYear?.value || "";


    filterOptionsByYear(
        reportExam,
        state.options.examinations,
        yearId,
        "academic_year_id",
        "Chagua Examination"
    );


    filterOptionsByYear(
        reportForm,
        state.options.forms,
        yearId,
        "academic_year_id",
        "Chagua Form"
    );


    filterOptionsByYear(
        reportClass,
        state.options.classes,
        yearId,
        "academic_year_id",
        "Chagua Darasa"
    );


    filterOptionsByYear(
        reportStudent,
        state.options.students,
        yearId,
        "academic_year_id",
        "Chagua Mwanafunzi"
    );


    filterOptionsByYear(
        reportSubject,
        state.options.subjects,
        yearId,
        "academic_year_id",
        "Chagua Somo"
    );
}


function handleExamChange() {

    const examId =
        reportExam?.value || "";


    if (!examId) {
        return;
    }


    filterOptionsByRelation(
        reportClass,
        state.options.classes,
        examId,
        [
            "examination_id",
            "exam_id"
        ],
        "Chagua Darasa"
    );
}


function handleFormChange() {

    const formId =
        reportForm?.value || "";


    if (!formId) {
        return;
    }


    filterOptionsByRelation(
        reportClass,
        state.options.classes,
        formId,
        [
            "form_id"
        ],
        "Chagua Darasa"
    );


    filterOptionsByRelation(
        reportStudent,
        state.options.students,
        formId,
        [
            "form_id"
        ],
        "Chagua Mwanafunzi"
    );
}


function handleClassChange() {

    const classId =
        reportClass?.value || "";


    if (!classId) {
        return;
    }


    filterOptionsByRelation(
        reportStudent,
        state.options.students,
        classId,
        [
            "class_id"
        ],
        "Chagua Mwanafunzi"
    );
}


function filterOptionsByYear(
    select,
    items,
    value,
    relationKey,
    placeholder
) {

    if (!select) {
        return;
    }


    if (!value) {

        populateSelect(
            select,
            items,
            placeholder
        );

        return;
    }


    const filtered =
        (items || []).filter(
            item =>
                String(
                    item[relationKey]
                ) === String(value)
        );


    /*
     * If the backend did not attach the relation,
     * keep the complete list instead of showing
     * an empty dropdown.
     */

    populateSelect(
        select,
        filtered.length ? filtered : items,
        placeholder
    );
}


function filterOptionsByRelation(
    select,
    items,
    value,
    relationKeys,
    placeholder
) {

    if (!select) {
        return;
    }


    if (!value) {

        populateSelect(
            select,
            items,
            placeholder
        );

        return;
    }


    const filtered =
        (items || []).filter(
            item =>
                relationKeys.some(
                    key =>
                        String(item[key]) ===
                        String(value)
                )
        );


    populateSelect(
        select,
        filtered.length ? filtered : items,
        placeholder
    );
}


function resetDependentFilters() {

    if (reportStudent) {
        reportStudent.value = "";
    }

    if (reportSubject) {
        reportSubject.value = "";
    }
}


/* =====================================================
   GENERATE REPORT
===================================================== */

async function generateReport() {

    if (!validateFilters()) {
        return;
    }


    setLoading(true);


    try {

        const params =
            new URLSearchParams();


        addParam(
            params,
            "academic_year_id",
            reportYear?.value
        );


        addParam(
            params,
            "examination_id",
            reportExam?.value
        );


        addParam(
            params,
            "form_id",
            reportForm?.value
        );


        if (state.reportType !== "student") {
            addParam(
                params,
                "class_id",
                reportClass?.value
            );
        } else if (reportClass?.value) {
            addParam(
                params,
                "class_id",
                reportClass?.value
            );
        }


        addParam(
            params,
            "student_id",
            reportStudent?.value
        );


        addParam(
            params,
            "subject_id",
            reportSubject?.value
        );


        addParam(
            params,
            "report_type",
            state.reportType
        );


        const endpoint =
            "/academic-master/operations/reports/details?" +
            params.toString();


        const response =
            await MsongolaAPI.get(endpoint);


        const data =
            extractResponseData(response);


        state.report =
            normalizeReport(data);


        renderReport(
            state.report
        );


    } catch (error) {

        console.error(
            "Generate report error:",
            error
        );


        showReportError(
            error.message ||
            "Imeshindikana kutengeneza ripoti."
        );

    } finally {

        setLoading(false);
    }
}


function validateFilters() {

    if (!reportExam?.value) {

        showReportError(
            "Tafadhali chagua Examination."
        );

        reportExam?.focus();

        return false;
    }


    if (state.reportType === "student") {

        if (!reportStudent?.value) {

            showReportError(
                "Tafadhali chagua Mwanafunzi kwa ripoti ya mwanafunzi."
            );

            reportStudent?.focus();

            return false;
        }

        return true;
    }


    if (!reportClass?.value) {

        showReportError(
            "Tafadhali chagua Darasa."
        );

        reportClass?.focus();

        return false;
    }


    if (
        state.reportType === "subject" &&
        reportSubject &&
        !reportSubject.value
    ) {

        showReportError(
            "Tafadhali chagua Somo kwa ripoti ya somo moja."
        );

        reportSubject?.focus();

        return false;
    }


    return true;
}


function addParam(
    params,
    key,
    value
) {

    if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
    ) {

        params.set(
            key,
            value
        );
    }
}


/* =====================================================
   NORMALIZE REPORT
===================================================== */

function normalizeReport(data) {

    const source =
        data?.report ||
        data?.result ||
        data ||
        {};


    const rows =
        source.rows ||
        source.results ||
        source.students ||
        source.data ||
        [];


    return {

        school:
            source.school ||
            source.school_information ||
            {},

        examination:
            source.examination ||
            {},

        academicYear:
            source.academic_year ||
            source.academicYear ||
            {},

        form:
            source.form ||
            {},

        class:
            source.class ||
            source.class_information ||
            {},

        classTeacher:
            source.class_teacher ||
            source.classTeacher ||
            {},

        academicMaster:
            source.academic_master ||
            source.academicMaster ||
            {},

        headOfSchool:
            source.head_of_school ||
            source.headOfSchool ||
            {},

        students:
            rows,

        rows:
            rows,

        narrative:
            source.narrative ||
            "",

        totals:
            source.totals ||
            {},

        generatedAt:
            source.generated_at ||
            new Date().toISOString()
    };
}


/* =====================================================
   RENDER
===================================================== */

function renderReport(report) {

    if (!report) {
        return;
    }


    if (reportEmpty) {
        reportEmpty.hidden = true;
    }


    if (officialReport) {
        officialReport.hidden = false;
    }


    renderSchoolInformation(report);

    renderReportMeta(report);

    renderStudents(report);

    renderSummary(report);

    if (reportNarrative) {
        reportNarrative.value =
            report.narrative || "";
    }
}


function renderSchoolInformation(report) {

    const school =
        report.school || {};


    setText(
        "reportSchoolName",
        school.name ||
        school.school_name ||
        "MSONGOLA SECONDARY SCHOOL"
    );


    setText(
        "reportSchoolAddress",
        school.address ||
        school.po_box ||
        school.pobox ||
        "P.O BOX 104727"
    );


    setText(
        "reportMotto",
        school.motto ||
        "EDUCATION IS LIGHT"
    );


    const logo =
        school.logo ||
        school.logo_url ||
        school.logo_path;


    const logoContainer =
        $("reportSchoolLogo");


    if (
        logoContainer &&
        logo
    ) {

        logoContainer.innerHTML = "";

        const image =
            document.createElement("img");

        image.src = logo;

        image.alt =
            "School Logo";

        logoContainer.appendChild(image);
    }
}


function renderReportMeta(report) {

    const examination =
        report.examination || {};


    const academicYear =
        report.academicYear || {};


    const form =
        report.form || {};


    const classInfo =
        report.class || {};


    const classTeacher =
        report.classTeacher || {};


    const academicMaster =
        report.academicMaster || {};


    const head =
        report.headOfSchool || {};


    setText(
        "reportExamName",
        examination.name ||
        examination.title ||
        examination.examination_name ||
        "-"
    );


    setText(
        "reportYearName",
        academicYear.name ||
        academicYear.year ||
        academicYear.year_name ||
        "-"
    );


    setText(
        "reportFormName",
        form.name ||
        form.form_name ||
        "-"
    );


    setText(
        "reportClassName",
        classInfo.name ||
        classInfo.class_name ||
        "-"
    );


    const academicMasterName =
        academicMaster.name ||
        academicMaster.full_name ||
        academicMaster.fullName ||
        "Mwalimu KIIZA";


    const headName =
        head.name ||
        head.full_name ||
        head.fullName ||
        "NASSORO SHEKULAMBA";


    const classTeacherName =
        classTeacher.name ||
        classTeacher.full_name ||
        classTeacher.fullName ||
        "-";


    setText(
        "reportAcademicMaster",
        academicMasterName
    );


    setText(
        "signatureAcademic",
        academicMasterName
    );


    setText(
        "reportHead",
        headName
    );


    setText(
        "signatureHead",
        headName
    );


    setText(
        "reportClassTeacher",
        classTeacherName
    );


    setText(
        "signatureClassTeacher",
        classTeacherName
    );
}


/* =====================================================
   STUDENTS / RESULTS
===================================================== */

function renderStudents(report) {

    if (!reportRows) {
        return;
    }


    reportRows.innerHTML = "";


    const students =
        Array.isArray(report.students)
            ? report.students
            : [];


    if (!students.length) {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td colspan="10" style="text-align:center;padding:28px;">
                Hakuna approved results zilizopatikana.
            </td>
        `;


        reportRows.appendChild(row);

        return;
    }


    students.forEach(
        (student, index) => {

            const row =
                document.createElement("tr");


            const subjects =
                normalizeStudentSubjects(
                    student
                );


            const subjectHtml =
                subjects.length
                    ? subjects.map(
                        subject => `
                            <span class="subject-mark">
                                ${escapeHtml(
                                    subject.name
                                )}
                                :
                                ${escapeHtml(
                                    formatNumber(
                                        subject.marks
                                    )
                                )}
                                (${escapeHtml(
                                    subject.grade || "-"
                                )})
                            </span>
                        `
                    ).join("")
                    : "-";


            const status =
                normalizeStatus(
                    student.status
                );


            row.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    ${escapeHtml(
                        student.admission_number ||
                        student.admissionNo ||
                        student.admission ||
                        "-"
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHtml(
                            student.name ||
                            student.student_name ||
                            student.full_name ||
                            "-"
                        )}
                    </strong>
                </td>

                <td>
                    ${subjectHtml}
                </td>

                <td>
                    ${escapeHtml(
                        formatNumber(
                            student.total_marks ??
                            student.totalMarks ??
                            0
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        formatNumber(
                            student.average ??
                            student.average_marks ??
                            0,
                            2
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        formatNumber(
                            student.total_points ??
                            student.totalPoints ??
                            student.points ??
                            0
                        )
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        student.division ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        student.position ||
                        student.class_position ||
                        "-"
                    )}
                </td>

                <td>
                    <span class="result-status">
                        ${escapeHtml(status)}
                    </span>
                </td>
            `;


            reportRows.appendChild(row);

        }
    );
}


function normalizeStudentSubjects(student) {

    const subjects =
        student.subjects ||
        student.results ||
        student.marks ||
        [];


    if (
        Array.isArray(subjects)
    ) {

        return subjects.map(
            item => ({
                name:
                    item.subject_name ||
                    item.subject ||
                    item.name ||
                    "-",

                marks:
                    item.marks ??
                    item.mark ??
                    item.score ??
                    0,

                grade:
                    item.grade ||
                    "-"
            })
        );
    }


    if (
        subjects &&
        typeof subjects === "object"
    ) {

        return Object.entries(
            subjects
        ).map(
            ([name, value]) => {

                if (
                    typeof value === "object"
                ) {

                    return {
                        name:
                            value.subject_name ||
                            name,

                        marks:
                            value.marks ??
                            value.mark ??
                            0,

                        grade:
                            value.grade ||
                            "-"
                    };
                }


                return {
                    name,
                    marks: value,
                    grade: "-"
                };
            }
        );
    }


    return [];
}


function normalizeStatus(status) {

    const value =
        String(
            status ||
            "APPROVED"
        ).toUpperCase();


    if (
        value === "APPROVED" ||
        value === "FINAL"
    ) {

        return "APPROVED";
    }


    return value;
}


/* =====================================================
   SUMMARY
===================================================== */

function renderSummary(report) {

    const students =
        Array.isArray(report.students)
            ? report.students
            : [];


    const totalStudents =
        students.length;


    const approvedCount =
        students.filter(
            student =>
                normalizeStatus(
                    student.status
                ) === "APPROVED"
        ).length;


    let totalAverage = 0;

    let totalPoints = 0;


    students.forEach(
        student => {

            totalAverage += Number(
                student.average ??
                student.average_marks ??
                0
            );


            totalPoints += Number(
                student.total_points ??
                student.totalPoints ??
                student.points ??
                0
            );
        }
    );


    const average =
        totalStudents
            ? totalAverage / totalStudents
            : 0;


    setText(
        "summaryStudents",
        totalStudents
    );


    setText(
        "summaryAverage",
        formatNumber(
            average,
            2
        )
    );


    setText(
        "summaryPoints",
        formatNumber(
            totalPoints
        )
    );


    setText(
        "summaryApproved",
        approvedCount
    );


    /*
     * If backend supplies totals,
     * prefer those values.
     */

    if (
        report.totals &&
        typeof report.totals === "object"
    ) {

        if (
            report.totals.students !== undefined
        ) {

            setText(
                "summaryStudents",
                report.totals.students
            );
        }


        if (
            report.totals.average !== undefined
        ) {

            setText(
                "summaryAverage",
                formatNumber(
                    report.totals.average,
                    2
                )
            );
        }


        if (
            report.totals.points !== undefined
        ) {

            setText(
                "summaryPoints",
                report.totals.points
            );
        }


        if (
            report.totals.approved !== undefined
        ) {

            setText(
                "summaryApproved",
                report.totals.approved
            );
        }
    }
}


/* =====================================================
   PRINT / PDF
===================================================== */

function printOfficialReport() {

    if (!state.report) {

        showReportError(
            "Tengeneza ripoti kwanza kabla ya kuchapisha."
        );

        return;
    }


    window.print();
}


function exportReportPdf() {

    if (!state.report) {

        showReportError(
            "Tengeneza ripoti kwanza kabla ya ku-export PDF."
        );

        return;
    }


    /*
     * Browser print dialog provides:
     * Save as PDF
     *
     * The CSS @media print is already configured
     * for A4 report output.
     */

    window.print();
}


/* =====================================================
   EXCEL
===================================================== */

async function exportReportExcel() {

    if (!state.report) {

        showReportError(
            "Tengeneza ripoti kwanza kabla ya ku-export Excel."
        );

        return;
    }


    const students =
        Array.isArray(
            state.report.students
        )
            ? state.report.students
            : [];


    if (!students.length) {

        showReportError(
            "Hakuna data ya ku-export."
        );

        return;
    }


    try {

        await ensureSheetJS();


        const rows = [];


        students.forEach(
            student => {

                const subjects =
                    normalizeStudentSubjects(
                        student
                    );


                if (!subjects.length) {

                    rows.push({
                        "Student Name":
                            student.name ||
                            student.student_name ||
                            "",

                        "Admission Number":
                            student.admission_number ||
                            student.admissionNo ||
                            "",

                        "Form":
                            student.form_name ||
                            "",

                        "Class":
                            student.class_name ||
                            "",

                        "Total Marks":
                            student.total_marks ??
                            0,

                        "Average":
                            student.average ??
                            0,

                        "Total Points":
                            student.total_points ??
                            0,

                        "Division":
                            student.division ||
                            "",

                        "Position":
                            student.position ||
                            "",

                        "Status":
                            normalizeStatus(
                                student.status
                            )
                    });


                    return;
                }


                subjects.forEach(
                    subject => {

                        rows.push({

                            "Student Name":
                                student.name ||
                                student.student_name ||
                                "",

                            "Admission Number":
                                student.admission_number ||
                                student.admissionNo ||
                                "",

                            "Form":
                                student.form_name ||
                                "",

                            "Class":
                                student.class_name ||
                                "",

                            "Subject":
                                subject.name,

                            "Marks":
                                subject.marks,

                            "Grade":
                                subject.grade,

                            "Total Marks":
                                student.total_marks ??
                                0,

                            "Average":
                                student.average ??
                                0,

                            "Total Points":
                                student.total_points ??
                                0,

                            "Division":
                                student.division ||
                                "",

                            "Position":
                                student.position ||
                                "",

                            "Status":
                                normalizeStatus(
                                    student.status
                                )
                        });

                    }
                );

            }
        );


        const workbook =
            XLSX.utils.book_new();


        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );


        worksheet["!cols"] = [
            { wch: 28 },
            { wch: 18 },
            { wch: 10 },
            { wch: 12 },
            { wch: 24 },
            { wch: 10 },
            { wch: 10 },
            { wch: 14 },
            { wch: 12 },
            { wch: 14 },
            { wch: 12 },
            { wch: 12 },
            { wch: 14 }
        ];


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Results"
        );


        const filename =
            buildFileName(
                "msongola-report",
                "xlsx"
            );


        XLSX.writeFile(
            workbook,
            filename
        );


    } catch (error) {

        console.error(
            "Excel export error:",
            error
        );


        showReportError(
            "Imeshindikana ku-export Excel."
        );
    }
}


function ensureSheetJS() {

    if (
        window.XLSX
    ) {

        return Promise.resolve();
    }


    return new Promise(
        (resolve, reject) => {

            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";


            script.onload =
                () => resolve();


            script.onerror =
                () =>
                    reject(
                        new Error(
                            "SheetJS failed to load."
                        )
                    );


            document.head.appendChild(
                script
            );
        }
    );
}


/* =====================================================
   RESET
===================================================== */

function resetFilters() {

    if (reportYear) {
        reportYear.value = "";
    }

    if (reportExam) {
        reportExam.value = "";
    }

    if (reportForm) {
        reportForm.value = "";
    }

    if (reportClass) {
        reportClass.value = "";
    }

    if (reportStudent) {
        reportStudent.value = "";
    }

    if (reportSubject) {
        reportSubject.value = "";
    }


    state.report = null;


    if (reportEmpty) {
        reportEmpty.hidden = false;
    }


    if (officialReport) {
        officialReport.hidden = true;
    }


    resetSummary();


    updateReportTypeUI();


    removeReportAlert();
}


function resetSummary() {

    setText(
        "summaryStudents",
        "0"
    );

    setText(
        "summaryAverage",
        "0.00"
    );

    setText(
        "summaryPoints",
        "0"
    );

    setText(
        "summaryApproved",
        "0"
    );
}


/* =====================================================
   UI HELPERS
===================================================== */

function setLoading(
    loading
) {

    state.loading = loading;


    if (generateReportBtn) {

        generateReportBtn.disabled =
            loading;


        generateReportBtn.innerHTML =
            loading
                ? `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Inatengeneza...
                `
                : `
                    <i class="fa-solid fa-file-circle-check"></i>
                    Tengeneza Ripoti
                `;
    }


    if (reportTypeContainer) {

        reportTypeContainer.style.pointerEvents =
            loading
                ? "none"
                : "";
    }
}


function showReportError(
    message
) {

    removeReportAlert();


    const alert =
        document.createElement("div");


    alert.className =
        "report-alert";


    alert.id =
        "reportErrorAlert";


    alert.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>${escapeHtml(message)}</span>
    `;


    const firstPanel =
        document.querySelector(
            ".reports-page .report-type-panel"
        );


    if (firstPanel) {

        firstPanel.parentNode.insertBefore(
            alert,
            firstPanel
        );

    } else {

        document.body.prepend(
            alert
        );
    }


    window.setTimeout(
        removeReportAlert,
        6000
    );
}


function removeReportAlert() {

    const alert =
        $("reportErrorAlert");


    if (alert) {
        alert.remove();
    }
}


function setText(
    id,
    value
) {

    const element =
        $(id);


    if (element) {
        element.textContent =
            value ?? "-";
    }
}


function formatNumber(
    value,
    decimals = 0
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return decimals
            ? "0.00"
            : "0";
    }


    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits:
                decimals,

            maximumFractionDigits:
                decimals
        }
    );
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function extractResponseData(
    response
) {

    if (
        response &&
        response.data !== undefined
    ) {

        return response.data;
    }


    return response || {};
}


function buildFileName(
    prefix,
    extension
) {

    const date =
        new Date()
            .toISOString()
            .slice(0, 10);


    return `${prefix}-${date}.${extension}`;
}


function setInitialDate() {

    const currentYear =
        $("currentYear");


    if (currentYear) {

        currentYear.textContent =
            new Date().getFullYear();
    }
}

})();
