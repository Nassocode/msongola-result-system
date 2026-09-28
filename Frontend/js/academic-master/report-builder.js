(() => {
    "use strict";

    import("./shared-shell.js").catch((error) => console.error("Academic shell unavailable:", error));

    const apiBase = "/academic-master/operations/reports";
    const examSelect = document.getElementById("reportExam");
    const classSelect = document.getElementById("reportClass");
    const preview = document.getElementById("reportPreview");
    const errorBox = document.getElementById("reportError");
    const rowsElement = document.getElementById("reportRows");
    const emptyState = document.getElementById("reportEmpty");
    const exportButtons = ["exportExcel", "exportPdf", "exportExcelBottom", "exportPdfBottom"]
        .map((id) => document.getElementById(id));

    let options = { examinations: [], classes: [] };
    let report = null;

    function escapeHTML(value) {
        const node = document.createElement("span");
        node.textContent = value ?? "";
        return node.innerHTML;
    }

    function setText(id, value, fallback = "-") {
        const element = document.getElementById(id);
        if (element) element.textContent = value || fallback;
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.hidden = false;
    }

    function enableExports(enabled) {
        exportButtons.forEach((button) => { if (button) button.disabled = !enabled; });
    }

    function fillExams() {
        examSelect.innerHTML = options.examinations.length
            ? `<option value="">Chagua mtihani</option>${options.examinations.map((exam) => `<option value="${exam.id}">${escapeHTML(exam.exam_name)}${exam.term ? ` - ${escapeHTML(exam.term)}` : ""} (${escapeHTML(exam.academic_year)})</option>`).join("")}`
            : '<option value="">Hakuna mitihani iliyopatikana</option>';
    }

    function fillClasses() {
        const exam = options.examinations.find((item) => String(item.id) === examSelect.value);
        const classes = exam ? options.classes.filter((item) => Number(item.academic_year_id) === Number(exam.academic_year_id)) : [];
        classSelect.innerHTML = classes.length
            ? `<option value="">Chagua darasa</option>${classes.map((item) => `<option value="${item.id}">${escapeHTML(item.class_name)}</option>`).join("")}`
            : '<option value="">Chagua mtihani wenye madarasa</option>';
        classSelect.disabled = classes.length === 0;
    }

    function renderReport(data) {
        report = data;
        const school = data.school || {};
        const signatories = data.signatories || {};
        setText("reportSchoolName", school.school_name, "MSONGOLA SECONDARY SCHOOL");
        setText("reportSchoolAddress", school.po_box, "");
        setText("reportMotto", school.motto, "");
        setText("reportExamName", `${data.examination.exam_name}${data.examination.term ? ` - ${data.examination.term}` : ""}`);
        setText("reportClassName", data.class.class_name);
        setText("reportYear", data.class.academic_year);
        setText("reportHead", signatories.head_of_school);
        setText("reportAcademicMaster", signatories.academic_master);
        setText("reportClassTeacher", signatories.class_teacher);
        setText("signatureHead", signatories.head_of_school);
        setText("signatureAcademic", signatories.academic_master);
        setText("signatureClassTeacher", signatories.class_teacher);

        rowsElement.innerHTML = (data.students || []).map((student, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHTML(student.admission_number)}</td>
                <td><strong>${escapeHTML(student.student_name)}</strong></td>
                <td>${escapeHTML(student.subject_marks || "-")}</td>
                <td>${escapeHTML(student.total_marks ?? "-")}</td>
                <td>${escapeHTML(student.average ?? "-")}${student.average === null ? "" : "%"}</td>
                <td>${escapeHTML(student.total_points ?? "-")}</td>
                <td>${escapeHTML(student.division || "-")}</td>
                <td>${escapeHTML(student.position ?? "-")}</td>
                <td><input class="report-remarks" data-student-id="${student.id}" aria-label="Maoni ya ${escapeHTML(student.student_name)}" placeholder="Maoni"><span class="report-remark-text" hidden></span></td>
            </tr>
        `).join("");

        rowsElement.querySelectorAll(".report-remarks").forEach((input) => {
            input.nextElementSibling.textContent = "-";
            input.nextElementSibling.hidden = false;
        });

        emptyState.hidden = data.students?.length > 0;
        preview.hidden = false;
        enableExports(true);
        rowsElement.addEventListener("input", updateRemarkPrintText);
    }

    function updateRemarkPrintText(event) {
        const input = event.target.closest(".report-remarks");
        if (!input) return;
        const printable = input.nextElementSibling;
        printable.textContent = input.value.trim() || "-";
        printable.hidden = false;
    }

    async function loadReport() {
        if (!examSelect.value || !classSelect.value) return;
        errorBox.hidden = true;
        enableExports(false);
        try {
            const query = new URLSearchParams({ examination_id: examSelect.value, class_id: classSelect.value });
            const response = await MsongolaAPI.get(`${apiBase}/details?${query.toString()}`);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kutengeneza ripoti.");
            renderReport(response.data);
        } catch (error) {
            showError(error.message || "Imeshindikana kupata taarifa za ripoti.");
        }
    }

    function xmlEscape(value) {
        return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    }

    function excelCell(value, forceString = false) {
        const isNumber = !forceString && value !== "" && value !== null && Number.isFinite(Number(value));
        const type = isNumber ? "Number" : "String";
        return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`;
    }

    function exportExcel() {
        if (!report) return;
        const school = report.school || {};
        const signatories = report.signatories || {};
        const tableRows = [
            ["School", school.school_name],
            ["P.O. Box", school.po_box],
            ["Motto", school.motto],
            ["Examination", report.examination.exam_name],
            ["Term", report.examination.term],
            ["Academic year", report.class.academic_year],
            ["Class", report.class.class_name],
            ["Head of School", signatories.head_of_school],
            ["Academic Master", signatories.academic_master],
            ["Class Teacher", signatories.class_teacher],
            ["General comment", document.getElementById("reportNarrative").value],
            [""],
            ["#", "Admission Number", "Student", "Subject marks", "Total", "Average", "Points", "Division", "Position", "Comment"]
        ];
        (report.students || []).forEach((student, index) => {
            const comment = document.querySelector(`.report-remarks[data-student-id="${CSS.escape(String(student.id))}"]`)?.value || "";
            tableRows.push([index + 1, student.admission_number, student.student_name, student.subject_marks, student.total_marks, student.average, student.total_points, student.division, student.position, comment]);
        });

        const worksheetRows = tableRows.map((row) => `<Row>${row.map((cell) => excelCell(cell, typeof cell === "string")).join("")}</Row>`).join("");
        const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Ripoti"><Table>${worksheetRows}</Table></Worksheet></Workbook>`;
        const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Ripoti-${String(report.class.class_name).replace(/\s+/g, "-")}-${String(report.examination.exam_name).replace(/\s+/g, "-")}.xls`;
        link.click();
        URL.revokeObjectURL(url);
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        if (!await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] })) return;
        try {
            const response = await MsongolaAPI.get(`${apiBase}/options`);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia mitihani na madarasa.");
            options = response.data || options;
            fillExams();
        } catch (error) {
            showError(error.message || "Imeshindikana kupakia chaguo za ripoti.");
        }
        examSelect.addEventListener("change", () => {
            preview.hidden = true;
            enableExports(false);
            fillClasses();
        });
        classSelect.addEventListener("change", loadReport);
        document.getElementById("exportPdf").addEventListener("click", () => window.print());
        document.getElementById("exportPdfBottom").addEventListener("click", () => window.print());
        document.getElementById("exportExcel").addEventListener("click", exportExcel);
        document.getElementById("exportExcelBottom").addEventListener("click", exportExcel);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
