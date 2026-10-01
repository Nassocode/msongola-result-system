"use strict";
/*
 * MSONGOLA RESULT SYSTEM
 * Academic Master - Report Builder
 *
 * Responsibilities:
 * Protect the Academic Master page, load report options, manage filters,
 * generate approved-results reports, and handle exports.
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
    loading: false,
    studentLoadSequence: 0,
    studentDetailSequence: 0
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
const reportSummary = $("reportSummary");
const reportRows = $("reportRows");
const reportTableHead = $("reportTableHead");
const reportStudentSearch = $("reportStudentSearch");
const reportResultCount = $("reportResultCount");
const classRosterPanel = $("classRosterPanel");
const classRosterTitle = $("classRosterTitle");
const classRosterCount = $("classRosterCount");
const classStudentRows = $("classStudentRows");
const classRosterEmpty = $("classRosterEmpty");
const classRosterSearch = $("classRosterSearch");
const classStudentDetailPane = $("classStudentDetailPane");
const summaryStudents = $("summaryStudents");
const summaryAverage = $("summaryAverage");
const summaryPoints = $("summaryPoints");
const summaryApproved = $("summaryApproved");
const exportExcel = $("exportExcel");
const exportPdf = $("exportPdf");
const printReport = $("printReport");
const reportNarrative = $("reportNarrative");


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    if (window.MsongolaAuth) {
        try {
            await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] });
        } catch (error) {
            console.error("Page protection error:", error);
        }
    }

    bindEvents();
    updateReportTypeUI();
    setInitialDate();
    await loadReportOptions();
    renderClassStudents();
    await applyStudentReportPreset();
}

async function applyStudentReportPreset() {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("student_id");

    if (params.get("report_type") !== "student" || !studentId) return;

    state.reportType = "student";
    updateReportTypeUI();
    if (reportYear) reportYear.value = params.get("academic_year_id") || "";
    handleYearChange();
    if (reportExam) reportExam.value = params.get("examination_id") || "";
    handleExamChange();
    if (reportForm) reportForm.value = params.get("form_id") || "";
    handleFormChange();
    if (reportClass) reportClass.value = params.get("class_id") || "";
    await populateSubjectsForClass(reportClass?.value || "");
    await populateStudentsForClass(reportClass?.value || "", studentId);
    renderClassStudents();
    await generateReport();
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
            clearGeneratedReport();

        });
    }


    reportYear?.addEventListener("change", handleYearChange);

    reportExam?.addEventListener("change", handleExamChange);

    reportForm?.addEventListener("change", handleFormChange);

    reportClass?.addEventListener("change", handleClassChange);

    [reportYear, reportExam, reportForm, reportClass, reportStudent, reportSubject].forEach((select) => {
        select?.addEventListener("change", clearGeneratedReport);
    });
    [reportYear, reportExam, reportForm, reportClass].forEach((select) => {
        select?.addEventListener("change", renderClassStudents);
    });


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


    exportExcel?.addEventListener(
        "click",
        exportReportExcel
    );


    exportPdf?.addEventListener(
        "click",
        exportReportPdf
    );


    reportStudentSearch?.addEventListener("input", filterReportRows);
    classRosterSearch?.addEventListener("input", renderClassStudents);
    classStudentRows?.addEventListener("click", handleClassStudentAction);
    classStudentDetailPane?.addEventListener("click", handleClassStudentDetailAction);
    $("generateClassReport")?.addEventListener("click", generateClassReport);
    $("viewClassStudents")?.addEventListener("click", () => {
        $("classRosterTableWrap")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });


    reportNarrative?.addEventListener(
        "input",
        function () {

            if (state.report && state.reportType !== "student") {
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
        card.setAttribute("aria-pressed", String(card.dataset.reportType === state.reportType));

    });


    const needsStudent =
        state.reportType === "student";

    if (reportNarrative) {
        reportNarrative.readOnly = needsStudent;
        reportNarrative.placeholder = needsStudent
            ? "Generated automatically from the student's class average."
            : "Andika maoni ya ripoti hapa...";
    }


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


        populateSelect(reportExam, [], "Chagua mwaka kwanza");
        populateSelect(reportForm, [], "Chagua examination kwanza");
        populateSelect(reportClass, [], "Chagua form kwanza");
        populateStudentsForClass("");
        populateSelect(reportSubject, [], "Chagua darasa kwanza");
        if (reportExam) reportExam.disabled = true;
        if (reportForm) reportForm.disabled = true;
        if (reportClass) reportClass.disabled = true;
        if (reportSubject) reportSubject.disabled = true;


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

    if (item.report_label) {
        return item.report_label;
    }

    if (item.class_name && item.form_name) {
        return `${item.form_name} ${item.class_name}${item.academic_year || item.year_label ? ` · ${item.academic_year || item.year_label}` : ""}`;
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
    const yearId = String(reportYear?.value || "");
    const examinations = state.options.examinations.filter((item) =>
        !yearId || String(item.academic_year_id) === yearId
    );

    populateSelect(reportExam, examinations, "Chagua Examination");
    populateSelect(reportForm, [], "Chagua examination kwanza");
    populateSelect(reportClass, [], "Chagua form kwanza");
    populateSelect(reportSubject, [], "Chagua darasa kwanza");
    if (reportExam) reportExam.disabled = !yearId || examinations.length === 0;
    if (reportForm) reportForm.disabled = true;
    if (reportClass) reportClass.disabled = true;
    if (reportSubject) reportSubject.disabled = true;
    void populateStudentsForClass("");
    renderClassStudents();
}


function handleExamChange() {
    const examId = String(reportExam?.value || "");
    const selectedExam = state.options.examinations.find(
        (exam) => String(exam.id) === String(examId)
    );
    if (selectedExam && reportYear && String(selectedExam.academic_year_id) !== String(reportYear.value)) {
        reportYear.value = String(selectedExam.academic_year_id);
    }
    populateSelect(reportForm, selectedExam ? state.options.forms : [], selectedExam ? "Chagua Form" : "Chagua examination kwanza");
    populateSelect(reportClass, [], "Chagua form kwanza");
    populateSelect(reportSubject, [], "Chagua darasa kwanza");
    if (reportForm) reportForm.disabled = !selectedExam;
    if (reportClass) reportClass.disabled = true;
    if (reportSubject) reportSubject.disabled = true;
    void populateStudentsForClass("");
    renderClassStudents();
}


function handleFormChange() {
    const formId = String(reportForm?.value || "");
    const selectedExam = state.options.examinations.find(
        (exam) => String(exam.id) === String(reportExam?.value || "")
    );
    const classYearId = selectedExam?.academic_year_id || reportYear?.value || "";
    const classes = state.options.classes.filter((classInfo) =>
        formId && classYearId
        && String(classInfo.form_id) === formId
        && String(classInfo.academic_year_id) === String(classYearId)
    );

    populateSelect(reportClass, classes, "Chagua Darasa");
    populateSelect(reportSubject, [], "Chagua darasa kwanza");
    if (reportClass) reportClass.disabled = !formId || classes.length === 0;
    if (reportSubject) reportSubject.disabled = true;
    void populateStudentsForClass("");
    renderClassStudents();
}


async function handleClassChange() {
    const classId = String(reportClass?.value || "");
    await populateStudentsForClass(classId);
    await populateSubjectsForClass(classId);
    renderClassStudents();
}


async function populateSubjectsForClass(classId) {
    const classInfo = state.options.classes.find((item) => String(item.id) === String(classId));
    const subjects = classInfo
        ? state.options.subjects.filter((subject) => String(subject.class_id) === String(classInfo.id))
        : [];
    populateSelect(reportSubject, subjects, classInfo ? "Chagua Somo" : "Chagua darasa kwanza");
    if (reportSubject) reportSubject.disabled = !classInfo || subjects.length === 0;
}


async function populateStudentsForClass(classId, selectedStudentId = "") {
    const requestId = ++state.studentLoadSequence;
    state.options.students = [];
    const classInfo = state.options.classes.find((item) => String(item.id) === String(classId));
    let students = [];

    if (classInfo) {
        if (reportStudent) {
            reportStudent.disabled = true;
            populateSelect(reportStudent, [], "Inapakia wanafunzi...");
        }
        const params = new URLSearchParams({
            class_id: String(classInfo.id),
            academic_year_id: String(classInfo.academic_year_id),
            form_id: String(classInfo.form_id)
        });
        try {
            const response = await MsongolaAPI.get(`/academic-master/operations/reports/students?${params}`);
            if (requestId !== state.studentLoadSequence) return;
            students = extractResponseData(response) || [];
            if (!Array.isArray(students)) students = [];
        } catch (error) {
            if (requestId !== state.studentLoadSequence) return;
            const hint = $("studentFilterHint");
            if (hint) hint.textContent = error.message || "Imeshindikana kupakia wanafunzi wa darasa.";
        }
    }

    if (requestId !== state.studentLoadSequence) return;
    state.options.students = students;
    const labeledStudents = students.map((student) => ({
        ...student,
        report_label: `${buildOptionLabel(student)}${student.admission_number ? ` (${student.admission_number})` : ""}`
    }));

    const placeholder = !classId
        ? "Chagua darasa kwanza"
        : labeledStudents.length
            ? "Chagua Mwanafunzi"
            : "Hakuna wanafunzi kwenye darasa hili";

    populateSelect(reportStudent, labeledStudents, placeholder);
    if (reportStudent) {
        reportStudent.disabled = !classInfo || labeledStudents.length === 0;
        if (selectedStudentId && labeledStudents.some((student) => String(student.id) === String(selectedStudentId))) {
            reportStudent.value = String(selectedStudentId);
        }
    }

    const hint = $("studentFilterHint");
    if (hint) {
        hint.textContent = !classId
            ? "Chagua darasa ili kuona wanafunzi wake."
            : labeledStudents.length
                ? `${labeledStudents.length} wanafunzi kwenye darasa hili.`
                : "Hakuna mwanafunzi active aliyepatikana kwenye darasa hili.";
    }
}


function renderClassStudents() {

    const classId = String(reportClass?.value || "");
    const classInfo = state.options.classes.find((item) => String(item.id) === classId);

    if (classRosterPanel) classRosterPanel.hidden = !classInfo;
    if (!classInfo || !classStudentRows) return;

    const students = state.options.students
        .filter((student) => String(student.class_id) === classId)
        .sort((left, right) => {
            const leftName = [left.last_name, left.first_name, left.middle_name].filter(Boolean).join(" ");
            const rightName = [right.last_name, right.first_name, right.middle_name].filter(Boolean).join(" ");
            return leftName.localeCompare(rightName);
        });
    const query = String(classRosterSearch?.value || "").trim().toLowerCase();
    const visibleStudents = students.filter((student) => {
        const name = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
        return `${name} ${student.admission_number || ""}`.toLowerCase().includes(query);
    });

    const className = [classInfo.form_name, classInfo.class_name].filter(Boolean).join(" ");
    if (classRosterTitle) classRosterTitle.textContent = `Students — ${className}`;
    if (classRosterCount) classRosterCount.textContent = query
        ? `${visibleStudents.length} of ${students.length} students`
        : `${students.length} students`;
    if (classRosterEmpty) {
        classRosterEmpty.hidden = visibleStudents.length > 0;
        const message = classRosterEmpty.querySelector("span");
        if (message) message.textContent = query
            ? "No students match your search."
            : "No active students found in this class.";
    }
    if (classRosterSearch) classRosterSearch.disabled = students.length === 0;
    classStudentRows.innerHTML = visibleStudents.map((student, index) => {
        const studentName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
        const sex = String(student.gender || "").toUpperCase() === "MALE" ? "M" : String(student.gender || "").toUpperCase() === "FEMALE" ? "F" : "-";
        const initials = studentName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
        return `<tr data-student-row="${student.id}"><td>${index + 1}</td><td><div class="roster-student-identity"><span class="roster-student-avatar" aria-hidden="true">${escapeHtml(initials || "ST")}</span><strong>${escapeHtml(studentName || "Student")}</strong></div></td><td>${escapeHtml(student.admission_number || "-")}</td><td><span class="roster-gender-tag">${sex}</span></td><td class="class-roster-actions"><button type="button" class="btn btn-secondary" data-student-results="${student.id}" aria-expanded="false" title="View approved results"><i class="fa-solid fa-chart-column" aria-hidden="true"></i><span>Results</span></button><button type="button" class="btn btn-outline" data-student-report="${student.id}" title="Generate student report"><i class="fa-solid fa-file-lines" aria-hidden="true"></i><span>Report</span></button></td></tr>`;
    }).join("");

    const selectedStudentId = classStudentDetailPane?.dataset.studentId;
    if (selectedStudentId && !visibleStudents.some((student) => String(student.id) === selectedStudentId)) {
        resetClassStudentDetails();
    } else if (selectedStudentId) {
        const selectedRow = classStudentRows.querySelector(`[data-student-row="${CSS.escape(selectedStudentId)}"]`);
        selectedRow?.classList.add("is-selected");
        selectedRow?.querySelector("[data-student-results]")?.setAttribute("aria-expanded", "true");
    }
}


async function handleClassStudentAction(event) {

    const viewButton = event.target.closest("[data-student-results]");
    const reportButton = event.target.closest("[data-student-report]");
    if (!viewButton && !reportButton) return;

    const studentId = (viewButton || reportButton).dataset.studentResults || (viewButton || reportButton).dataset.studentReport;
    if (reportButton) {
        await generateStudentReport(studentId);
        return;
    }

    const classId = String(reportClass?.value || "");
    const examinationId = String(reportExam?.value || "");
    if (!examinationId) {
        showReportError("Chagua examination ili kuona matokeo ya mwanafunzi.");
        reportExam?.focus();
        return;
    }

    if (classStudentDetailPane?.dataset.studentId === studentId) {
        resetClassStudentDetails();
        viewButton.setAttribute("aria-expanded", "false");
        return;
    }

    const requestId = ++state.studentDetailSequence;
    classStudentRows.querySelectorAll("[data-student-results]").forEach((button) => {
        button.disabled = true;
        button.setAttribute("aria-expanded", "false");
    });
    classStudentRows.querySelectorAll("[data-student-row]").forEach((row) => row.classList.remove("is-selected"));
    if (classStudentDetailPane) {
        classStudentDetailPane.dataset.studentId = studentId;
        classStudentDetailPane.innerHTML = '<div class="class-student-detail-loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Loading approved results...</span></div>';
    }
    const selectedRow = viewButton.closest("[data-student-row]");
    selectedRow?.classList.add("is-selected");
    viewButton.setAttribute("aria-expanded", "true");
    try {
        const params = new URLSearchParams({
            academic_year_id: String(reportYear?.value || ""),
            examination_id: examinationId,
            form_id: String(reportForm?.value || ""),
            class_id: classId,
            student_id: studentId,
            report_type: "student",
            preview_only: "true"
        });
        const response = await MsongolaAPI.get(`/academic-master/operations/reports/details?${params.toString()}`);
        if (requestId !== state.studentDetailSequence) return;
        if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia matokeo ya mwanafunzi.");
        const report = normalizeReport(extractResponseData(response));
        const student = report.students[0];
        if (!student) throw new Error("Matokeo yaliyoidhinishwa ya mwanafunzi huyu hayajapatikana.");

        const classInfo = state.options.classes.find((item) => String(item.id) === classId);
        const subjects = getReportSubjectColumns(report.students, classInfo?.form_id);
        const marks = normalizeStudentSubjects(student);
        const marksBySubject = new Map(marks.flatMap((mark) => [[String(mark.id), mark], [String(mark.name), mark]]));
        const rosterStudent = state.options.students.find((item) => String(item.id) === String(studentId)) || student;
        const studentName = studentNameForReport(student);
        const initials = studentName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
        const admissionNumber = student.admission_number || rosterStudent.admission_number || "-";
        const gender = ({ MALE: "Male", FEMALE: "Female" })[String(student.gender || rosterStudent.gender || "").toUpperCase()] || "-";
        const className = [classInfo?.form_name, classInfo?.class_name].filter(Boolean).join(" ") || "-";
        if (!classStudentDetailPane) return;
        classStudentDetailPane.innerHTML = `<div class="student-results-detail">
            <div class="student-detail-topline"><div><span>STUDENT PERFORMANCE</span><strong>Approved results</strong></div><button type="button" class="student-detail-close" data-close-student-details aria-label="Close student results"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
            <section class="student-detail-profile" aria-label="Student details">
                <div class="student-detail-avatar" aria-hidden="true">${escapeHtml(initials || "ST")}</div>
                <div class="student-detail-heading"><span>STUDENT DETAILS</span><h4>${escapeHtml(studentName)}</h4><small>Admission No. ${escapeHtml(admissionNumber)}</small></div>
                <dl class="student-detail-facts"><div><dt>Gender</dt><dd>${escapeHtml(gender)}</dd></div><div><dt>Form</dt><dd>${escapeHtml(classInfo?.form_name || "-")}</dd></div><div><dt>Class</dt><dd>${escapeHtml(className)}</dd></div></dl>
            </section>
            <section class="student-results-overview" aria-label="Academic summary">
                <div><span>Total marks</span><strong>${escapeHtml(formatNumber(student.total_marks))}</strong></div>
                <div><span>Average</span><strong>${escapeHtml(formatNumber(student.average_marks, 2))}</strong></div>
                <div><span>Division</span><strong>${escapeHtml(student.division || "-")}</strong></div>
                <div><span>Class position</span><strong>${escapeHtml(formatClassPosition(student))}</strong></div>
            </section>
            <section class="student-subject-breakdown" aria-label="Subject results">
                <div class="student-breakdown-heading"><div><span>ACADEMIC PERFORMANCE</span><h4>Subject breakdown</h4></div><small>${subjects.length} ${subjects.length === 1 ? "subject" : "subjects"}</small></div>
                <div class="table-responsive student-results-table-wrap"><table class="student-results-table"><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th><th>Remark</th></tr></thead><tbody>${subjects.map((subject) => {
            const mark = marksBySubject.get(String(subject.id)) || marksBySubject.get(String(subject.name));
            return `<tr><td><div class="student-subject-name">${subject.code ? `<span>${escapeHtml(subject.code)}</span>` : ""}<strong>${escapeHtml(subject.name)}</strong></div></td><td class="student-mark-value">${mark ? escapeHtml(formatNumber(mark.marks, 2)) : "-"}</td><td>${mark ? `<span class="student-grade-badge">${escapeHtml(mark.grade || "-")}</span>` : "-"}</td><td>${mark ? escapeHtml(mark.points ?? "-") : "-"}</td><td>${mark ? escapeHtml(subjectRemark(mark.grade)) : "No approved mark"}</td></tr>`;
        }).join("")}</tbody></table></div>
            </section>
        </div>`;
    } catch (error) {
        if (requestId === state.studentDetailSequence) {
            resetClassStudentDetails();
            showReportError(error.message || "Imeshindikana kupakia matokeo ya mwanafunzi.");
        }
    } finally {
        if (requestId === state.studentDetailSequence) {
            classStudentRows.querySelectorAll("[data-student-results]").forEach((button) => {
                button.disabled = false;
                button.setAttribute("aria-expanded", String(button.closest("[data-student-row]")?.classList.contains("is-selected")));
            });
        }
    }
}


function handleClassStudentDetailAction(event) {
    if (event.target.closest("[data-close-student-details]")) {
        resetClassStudentDetails();
    }
}


function resetClassStudentDetails() {
    state.studentDetailSequence += 1;
    classStudentRows?.querySelectorAll("[data-student-row]").forEach((row) => {
        row.classList.remove("is-selected");
        row.querySelector("[data-student-results]")?.setAttribute("aria-expanded", "false");
    });
    if (classStudentDetailPane) {
        delete classStudentDetailPane.dataset.studentId;
        classStudentDetailPane.innerHTML = '<div class="class-student-detail-empty"><span><i class="fa-solid fa-arrow-pointer" aria-hidden="true"></i></span><h4>Select a student</h4><p>Choose Results in the roster to inspect the student\'s profile and subject performance.</p></div>';
    }
}


async function generateStudentReport(studentId) {

    const classId = String(reportClass?.value || "");
    if (!classId || !reportExam?.value) {
        showReportError("Chagua examination na darasa kwanza.");
        reportExam?.focus();
        return;
    }

    state.reportType = "student";
    updateReportTypeUI();
    await populateStudentsForClass(classId, studentId);
    clearGeneratedReport();
    await generateReport();
    if (state.report) $("reportPreview")?.scrollIntoView({ behavior: "smooth", block: "start" });
}


async function generateClassReport() {

    if (!reportClass?.value) {
        showReportError("Chagua darasa kwanza.");
        reportClass?.focus();
        return;
    }

    state.reportType = "class";
    updateReportTypeUI();
    clearGeneratedReport();
    await generateReport();
    if (state.report) $("reportPreview")?.scrollIntoView({ behavior: "smooth", block: "start" });
}


function subjectRemark(grade) {
    return ({ A: "Excellent", B: "Very Good", C: "Good", D: "Satisfactory", F: "Needs Improvement" })[String(grade || "").toUpperCase()] || "-";
}

function studentNameForReport(student) {
    return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ")
        || student.full_name
        || student.student_name
        || "-";
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


    const relationAvailable =
        (items || []).some(
            (item) => item[relationKey] !== null && item[relationKey] !== undefined
        );

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
        relationAvailable ? filtered : items,
        placeholder
    );
}


function resetDependentFilters() {

    if (reportStudent) {
        reportStudent.value = "";
    }

    populateStudentsForClass("");

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

    clearGeneratedReport();
    setLoading(true);


    try {

        const params = new URLSearchParams(buildReportFilterPayload());


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


        state.report = null;
        setReportActionsEnabled(false);
        showReportError(
            error.message ||
            "Imeshindikana kutengeneza ripoti."
        );

    } finally {

        setLoading(false);
    }
}


function validateFilters() {

    const requiredFilters = [
        [reportYear, "Tafadhali chagua Academic Year."],
        [reportExam, "Tafadhali chagua Examination."],
        [reportForm, "Tafadhali chagua Form."],
        [reportClass, "Tafadhali chagua Darasa."]
    ];
    const missing = requiredFilters.find(([select]) => !select?.value);
    if (missing) {
        showReportError(missing[1]);
        missing[0]?.focus();
        return false;
    }

    const selectedExam = state.options.examinations.find((item) => String(item.id) === String(reportExam.value));
    const selectedClass = state.options.classes.find((item) => String(item.id) === String(reportClass.value));
    if (!selectedExam || String(selectedExam.academic_year_id) !== String(reportYear.value)) {
        showReportError("Examination haifanani na Academic Year uliyochagua.");
        reportExam.focus();
        return false;
    }
    if (!selectedClass || String(selectedClass.academic_year_id) !== String(reportYear.value) || String(selectedClass.form_id) !== String(reportForm.value)) {
        showReportError("Darasa halifanani na Academic Year au Form uliyochagua.");
        reportClass.focus();
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

        const selectedStudent = state.options.students.find(
            (student) => String(student.id) === String(reportStudent.value)
        );

        if (!selectedStudent || String(selectedStudent.class_id) !== String(reportClass.value)) {
            showReportError(
                "Mwanafunzi aliyechaguliwa hayupo kwenye darasa hilo."
            );

            reportStudent?.focus();

            return false;
        }

        return true;
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

        reportType:
            source.report_type || state.reportType,

        subjectPerformance:
            source.subject_performance || null,

        subjectSummary:
            source.subject_summary || [],

        narrative:
            source.narrative ||
            "",

        totals:
            source.summary || source.totals ||
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
        officialReport.classList.toggle("student-report-view", state.reportType === "student");
        officialReport.classList.toggle("class-report-view", state.reportType !== "student");
    }

    if (reportSummary) reportSummary.hidden = false;
    if (reportStudentSearch) {
        reportStudentSearch.disabled = false;
        reportStudentSearch.value = "";
        reportStudentSearch.hidden = state.reportType === "student";
    }
    setReportActionsEnabled(Array.isArray(report.students) && report.students.length > 0);


    renderSchoolInformation(report);

    renderReportMeta(report);

    renderStudents(report);

    renderSummary(report);
    renderAnalysis(report);

    if (reportNarrative) {
        const student = report.students?.[0];
        reportNarrative.value = state.reportType === "student"
            ? student?.overall_remark || ""
            : report.narrative || "";
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

    const contactDetails = [school.phone, school.email].filter(Boolean).join(" · ");
    const contactNode = $("reportSchoolContact");
    if (contactNode) {
        contactNode.textContent = contactDetails;
        contactNode.hidden = !contactDetails;
    }


}


function resolveSchoolLogoUrl(value) {

    const logoPath = String(value || "").trim();
    if (!logoPath) return "";
    if (/^(https?:|data:|blob:)/i.test(logoPath)) return logoPath;

    let relativePath = logoPath.replace(/\\/g, "/");
    const uploadsIndex = relativePath.toLowerCase().indexOf("uploads/");
    if (uploadsIndex >= 0) relativePath = relativePath.slice(uploadsIndex);
    relativePath = relativePath.replace(/^\/+/, "").replace(/^msongola-result-system\//i, "");

    return new URL(`../../../${relativePath}`, document.baseURI).href;
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

    const reportTitles = {
        student: "STUDENT ACADEMIC REPORT",
        class: "CLASS ACADEMIC REPORT",
        subject: "SUBJECT PERFORMANCE REPORT",
        summary: "RESULT SUMMARY REPORT"
    };
    setText("officialReportTitle", reportTitles[state.reportType] || "CLASS ACADEMIC REPORT");

    const studentInformation = $("studentReportInformation");
    if (studentInformation) studentInformation.hidden = state.reportType !== "student";


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
        examination.year_label ||
        classInfo.year_label ||
        "-"
    );


    setText(
        "reportFormName",
        form.name ||
        form.form_name ||
        classInfo.form_name ||
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
        report.school?.academic_master ||
        "Not configured";


    const headName =
        head.name ||
        head.full_name ||
        head.fullName ||
        report.school?.head_of_school ||
        "Not configured";


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
    setText("reportGeneratedDate", formatReportDate(report.generatedAt));

    const student = report.students?.[0] || {};
    const studentName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ")
        || student.full_name
        || student.student_name
        || "-";
    setText("reportStudentName", studentName);
    setText("reportAdmissionNumber", student.admission_number || "-");
    setText("reportStudentGender", ({ MALE: "Male", FEMALE: "Female" })[String(student.gender || "").toUpperCase()] || "-");
    setText("reportStudentForm", student.form_name || classInfo.form_name || "-");
    setText("reportStudentClass", student.class_name || classInfo.name || classInfo.class_name || "-");
    setText("reportStudentYear", examination.year_label || classInfo.year_label || "-");
    setText("reportStudentTerm", examination.term || "-");
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

    if (state.reportType === "student") {
        if (reportTableHead) reportTableHead.innerHTML = "<th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th>";
        if (reportResultCount) reportResultCount.textContent = "APPROVED subject results for the selected student";
        if (!students.length) {
            reportRows.innerHTML = '<tr><td colspan="4" class="report-empty-cell">No approved results are available for the selected criteria.</td></tr>';
            return;
        }
        const subjects = normalizeStudentSubjects(students[0]);
        reportRows.innerHTML = subjects.map((subject) => `
            <tr><td>${escapeHtml(subject.name)}</td><td>${escapeHtml(formatNumber(subject.marks, 2))}</td><td>${escapeHtml(subject.grade || "-")}</td><td>${escapeHtml(subject.points ?? "-")}</td></tr>
        `).join("");
        return;
    }

    if (state.reportType === "subject") {
        if (reportTableHead) reportTableHead.innerHTML = "<th>Student Name</th><th>Admission Number</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th>";
        const subjectRows = students.flatMap((student) => normalizeStudentSubjects(student).map((subject) => ({ student, subject })));
        if (reportResultCount) reportResultCount.textContent = `${students.length} approved students · ${subjectRows.length} approved subject results`;
        if (!students.length) {
            reportRows.innerHTML = '<tr><td colspan="6" class="report-empty-cell">No approved results are available for the selected criteria.</td></tr>';
            return;
        }
        reportRows.innerHTML = subjectRows.map(({ student, subject }) => `<tr><td>${escapeHtml(studentNameForReport(student))}</td><td>${escapeHtml(student.admission_number || "-")}</td><td>${escapeHtml(subject.name)}</td><td>${escapeHtml(formatNumber(subject.marks, 2))}</td><td>${escapeHtml(subject.grade || "-")}</td><td>${escapeHtml(subject.points ?? "-")}</td></tr>`).join("");
        filterReportRows();
        return;
    }

    const subjectColumns = getReportSubjectColumns(students, report.class?.form_id);
    if (reportStudentSearch) {
        reportStudentSearch.disabled = students.length === 0;
        reportStudentSearch.value = "";
    }
    const noMatches = $("reportNoMatches");
    if (noMatches) noMatches.hidden = true;
    if (reportResultCount) {
        reportResultCount.textContent = `${students.length} students · ${subjectColumns.length} subjects · Division uses best 7 subject points`;
    }
    if (reportTableHead) {
        reportTableHead.innerHTML = `
            <th>#</th>
            <th>Admission No.</th>
            <th>Mwanafunzi</th>
            ${subjectColumns.map((subject) => `<th class="subject-column">${escapeHtml(subject.code ? `${subject.code} · ${subject.name}` : subject.name)}</th>`).join("")}
            <th>Jumla</th>
            <th>Wastani</th>
            <th>Points (7 bora)</th>
            <th>Division</th>
            <th>Nafasi Darasani</th>
            <th>Status</th>
        `;
    }


    if (!students.length) {

        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td colspan="${subjectColumns.length + 9}" style="text-align:center;padding:28px;">
                Hakuna approved results zilizopatikana.
            </td>
        `;
        reportRows.appendChild(row);
        return;
    }

    filterReportRows();

    students.forEach(
        (student, index) => {

            const row =
                document.createElement("tr");


            const subjects =
                normalizeStudentSubjects(
                    student
                );
            const marksBySubject = new Map();
            subjects.forEach((subject) => {
                marksBySubject.set(String(subject.id), subject);
                marksBySubject.set(String(subject.name), subject);
            });
            const subjectCells = subjectColumns.map((subject) => {
                const mark = marksBySubject.get(String(subject.id)) || marksBySubject.get(String(subject.name));
                return mark
                    ? `<td class="mark-matrix-cell"><strong>${escapeHtml(formatNumber(mark.marks))}</strong><small>${escapeHtml(mark.grade || "-")} · ${escapeHtml(subjectRemark(mark.grade))}</small></td>`
                    : '<td class="mark-matrix-cell mark-missing">-</td>';
            }).join("");


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

                ${subjectCells}

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
                        formatClassPosition(student)
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


function getReportSubjectColumns(students, formId = null) {

    const subjectMap = new Map();

    const selectedFormId = formId || state.options.classes.find(
        (classInfo) => String(classInfo.id) === String(reportClass?.value || "")
    )?.form_id;
    const selectedClassId = String(reportClass?.value || "");

    state.options.subjects
        .filter((subject) => (!selectedFormId || String(subject.form_id) === String(selectedFormId))
            && (!selectedClassId || String(subject.class_id) === selectedClassId))
        .forEach((subject) => {
            const key = String(subject.id);
            subjectMap.set(key, {
                id: key,
                name: subject.subject_name,
                code: subject.subject_code || "",
                order: Number(subject.subject_order || 0)
            });
        });

    students.forEach((student) => {
        normalizeStudentSubjects(student).forEach((subject) => {
            const key = String(subject.id || subject.name);
            if (!subjectMap.has(key)) {
                subjectMap.set(key, {
                    id: key,
                    name: subject.name,
                    code: subject.code || "",
                    order: Number(subject.subject_order || 0)
                });
            }
        });
    });

    return [...subjectMap.values()].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));
}


function filterReportRows() {

    if (!reportRows) return;

    const query = String(reportStudentSearch?.value || "").trim().toLowerCase();
    const rows = [...reportRows.querySelectorAll("tr")];
    let visibleRows = 0;

    rows.forEach((row) => {
        const matches = !query || row.textContent.toLowerCase().includes(query);
        row.hidden = !matches;
        if (matches) visibleRows += 1;
    });

    if (reportResultCount && state.reportType === "subject") {
        reportResultCount.textContent = query
            ? `${visibleRows} of ${rows.length} approved subject results`
            : `${rows.length} approved subject results`;
    } else if (reportResultCount) {
        const subjectCount = reportTableHead?.querySelectorAll(".subject-column").length || 0;
        reportResultCount.textContent = query
            ? `${visibleRows} of ${rows.length} students · ${subjectCount} subjects`
            : `${rows.length} students · ${subjectCount} subjects · Division uses best 7 subject points`;
    }

    const noMatches = $("reportNoMatches");
    if (noMatches) noMatches.hidden = !query || visibleRows > 0;
}


function setReportActionsEnabled(enabled) {

    [exportExcel, exportPdf, printReport].forEach((button) => {
        if (button) {
            button.hidden = !enabled;
            button.disabled = !enabled;
        }
    });
}


function clearGeneratedReport() {

    state.report = null;
    if (officialReport) officialReport.hidden = true;
    if (reportSummary) reportSummary.hidden = true;
    if (reportEmpty) reportEmpty.hidden = false;
    if (reportStudentSearch) {
        reportStudentSearch.value = "";
        reportStudentSearch.disabled = true;
    }
    const analysisPanel = $("reportAnalysisPanel");
    if (analysisPanel) analysisPanel.hidden = true;
    setReportActionsEnabled(false);
    resetSummary();
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
                id:
                    item.subject_id ||
                    item.id ||
                    item.subject_code ||
                    item.subject_name ||
                    item.subject ||
                    item.name ||
                    "-",

                subject_order:
                    item.subject_order ??
                    0,

                name:
                    item.subject_name ||
                    item.subject ||
                    item.name ||
                    "-",

                code:
                    item.subject_code ||
                    "",

                marks:
                    item.marks ??
                    item.mark ??
                    item.score ??
                    0,

                grade:
                    item.grade ||
                    "-",

                points:
                    item.points ?? ""
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


function formatClassPosition(student) {

    const position = student.class_position || student.position;

    if (!position) {
        return "-";
    }

    return student.class_size
        ? `${position} / ${student.class_size}`
        : String(position);
}


function formatReportDate(value) {

    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
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

    const isStudentReport = state.reportType === "student";
    const divisionSummary = $("reportDivisionSummary");
    const positionSummary = $("reportPositionSummary");
    const classSizeSummary = $("reportClassSizeSummary");
    if (divisionSummary) divisionSummary.hidden = !isStudentReport;
    if (positionSummary) positionSummary.hidden = !isStudentReport;
    if (classSizeSummary) classSizeSummary.hidden = !isStudentReport;

    const rankedStudent = students[0];
    const classPosition = rankedStudent
        ? formatClassPosition(rankedStudent)
        : "-";

    setText("reportPosition", classPosition);
    setText("reportDivision", isStudentReport ? rankedStudent?.division || "-" : "-");
    setText("reportClassSize", isStudentReport ? rankedStudent?.class_size ?? "-" : "-");


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

    const totalMarks = students.reduce(
        (total, student) => total + Number(student.total_marks ?? student.totalMarks ?? 0),
        0
    );
    const summaryStudent = isStudentReport ? rankedStudent : null;

    setText("reportTotalMarks", formatNumber(summaryStudent?.total_marks ?? summaryStudent?.totalMarks ?? totalMarks));
    setText("reportAverage", formatNumber(summaryStudent?.average ?? summaryStudent?.average_marks ?? average, 2));
    setText("reportTotalPoints", formatNumber(summaryStudent?.total_points ?? summaryStudent?.totalPoints ?? totalPoints));


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
            report.totals.total_points !== undefined || report.totals.points !== undefined
        ) {

            setText(
                "summaryPoints",
                report.totals.total_points ?? report.totals.points
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


function renderAnalysis(report) {
    const panel = $("reportAnalysisPanel");
    const subjectDetails = $("subjectPerformanceDetails");
    const summaryDetails = $("resultSummaryDetails");
    const isSubjectReport = state.reportType === "subject";
    const isSummaryReport = state.reportType === "summary";

    if (subjectDetails) subjectDetails.hidden = !isSubjectReport;
    if (summaryDetails) summaryDetails.hidden = !isSummaryReport;
    if (panel) panel.hidden = !isSubjectReport && !isSummaryReport;

    if (isSubjectReport) {
        const rows = $("subjectPerformanceRows");
        const subjects = Array.isArray(report.subjectPerformance)
            ? report.subjectPerformance
            : report.subjectSummary || [];
        if (rows) {
            rows.innerHTML = subjects.map((subject) => {
                const distribution = Object.entries(subject.grade_distribution || {})
                    .map(([grade, count]) => `${grade}: ${count}`)
                    .join(", ");
                return `<tr><td>${escapeHtml(subject.subject_name)}</td><td>${escapeHtml(subject.students)}</td><td>${escapeHtml(formatNumber(subject.average_marks, 2))}</td><td>${escapeHtml(formatNumber(subject.highest_mark, 2))}</td><td>${escapeHtml(formatNumber(subject.lowest_mark, 2))}</td><td>${escapeHtml(distribution || "-")}</td></tr>`;
            }).join("");
        }
    }

    if (isSummaryReport) {
        const divisionCounts = report.totals?.division_counts || {};
        [["I", "divisionCountI"], ["II", "divisionCountII"], ["III", "divisionCountIII"], ["IV", "divisionCountIV"], ["0", "divisionCount0"]]
            .forEach(([division, elementId]) => setText(elementId, divisionCounts[division] || 0));
        const rows = $("subjectSummaryRows");
        if (rows) {
            rows.innerHTML = (report.subjectSummary || []).map((subject) => {
                const distribution = Object.entries(subject.grade_distribution || {})
                    .map(([grade, count]) => `${grade}: ${count}`)
                    .join(", ");
                return `<tr><td>${escapeHtml(subject.subject_name)}</td><td>${escapeHtml(subject.students)}</td><td>${escapeHtml(formatNumber(subject.average_marks, 2))}</td><td>${escapeHtml(formatNumber(subject.highest_mark, 2))}</td><td>${escapeHtml(formatNumber(subject.lowest_mark, 2))}</td><td>${escapeHtml(distribution || "-")}</td></tr>`;
            }).join("");
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
    return downloadReportFile("pdf");
}


/* =====================================================
   EXCEL
===================================================== */

async function exportReportExcel() {
    if (!state.report) {
        showReportError("Tengeneza ripoti kwanza kabla ya ku-export Excel.");
        return;
    }

    return downloadReportFile("excel");
}


function buildReportFilterPayload() {
    return {
        academic_year_id: reportYear?.value,
        examination_id: reportExam?.value,
        form_id: reportForm?.value,
        class_id: reportClass?.value,
        report_type: state.reportType,
        ...(state.reportType === "student" ? { student_id: reportStudent?.value } : {}),
    };
}


async function downloadReportFile(format) {
    if (!state.report) {
        showReportError("Tengeneza ripoti kwanza kabla ya ku-export.");
        return;
    }

    const button = format === "excel" ? exportExcel : exportPdf;
    if (button) button.disabled = true;
    try {
        const response = await fetch(`${MsongolaAPI.API_BASE_URL}/academic-master/operations/reports/exports/${format}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MsongolaAPI.getToken()}`
            },
            body: JSON.stringify(buildReportFilterPayload()),
            cache: "no-store"
        });

        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.message || "Imeshindikana ku-export ripoti.");
        }

        const blob = await response.blob();
        const extension = format === "excel" ? "xlsx" : "pdf";
        const filename = buildFileName(`msongola-${state.reportType}-report`, extension);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error(`${format} report export error:`, error);
        showReportError(error.message || "Imeshindikana ku-export ripoti.");
    } finally {
        if (button) button.disabled = !state.report;
    }
}


/* =====================================================
   RESET
===================================================== */

function resetFilters() {

    if (reportYear) {
        reportYear.value = "";
    }
    handleYearChange();
    if (reportStudent) {
        reportStudent.value = "";
    }
    if (reportSubject) {
        reportSubject.value = "";
    }


    clearGeneratedReport();


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
