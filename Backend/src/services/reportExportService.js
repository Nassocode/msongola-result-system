const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const WORKSPACE_ROOT = path.resolve(__dirname, "../../..");
const COLORS = {
    ink: "17324D",
    teal: "168AAD",
    pale: "EAF3F6",
    border: "B8C7D1",
    white: "FFFFFF"
};
const PDF_COLORS = Object.fromEntries(
    Object.entries(COLORS).map(([name, value]) => [name, `#${value}`])
);

function studentName(student) {
    return [student.first_name, student.middle_name, student.last_name]
        .filter(Boolean)
        .join(" ") || student.full_name || student.student_name || "";
}

function reportTitle(report) {
    return ({
        student: "STUDENT ACADEMIC REPORT",
        class: "CLASS ACADEMIC REPORT",
        subject: "SUBJECT PERFORMANCE REPORT",
        summary: "RESULT SUMMARY REPORT"
    })[report.report_type] || "SCHOOL ACADEMIC REPORT";
}

function reportMetadata(report) {
    const student = report.students?.[0] || {};
    return [
        ["Academic Year", report.academic_year?.year_label || report.examination?.year_label || ""],
        ["Examination", report.examination?.name || ""],
        ["Form", report.form?.form_name || report.class?.form_name || ""],
        ["Class", report.class?.name || report.class?.class_name || ""],
        ...(report.report_type === "student" ? [["Student", studentName(student)], ["Admission Number", student.admission_number || ""]] : []),
        ["Class Teacher", report.class_teacher?.full_name || "Not Assigned"],
        ["Academic Master", report.academic_master?.name || report.school?.academic_master || "Not Assigned"],
        ["Head of School", report.head_of_school?.name || report.school?.head_of_school || "Not Assigned"]
    ];
}

function uniqueSubjects(students) {
    const subjects = new Map();
    (students || []).forEach((student) => (student.subjects || []).forEach((subject) => {
        const id = String(subject.subject_id || subject.subject_name);
        if (!subjects.has(id)) subjects.set(id, subject);
    }));
    return [...subjects.values()].sort((left, right) => String(left.subject_name).localeCompare(String(right.subject_name)));
}

function worksheetTitle(report) {
    return ({ student: "Student Report", class: "Class Report", subject: "Subject Report", summary: "Result Summary" })[report.report_type];
}

function addExcelTableHeader(sheet, headers) {
    const row = sheet.addRow(headers);
    row.height = 28;
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: `FF${COLORS.white}` }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.ink}` } };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
            top: { style: "thin", color: { argb: `FF${COLORS.border}` } },
            bottom: { style: "thin", color: { argb: `FF${COLORS.border}` } },
            left: { style: "thin", color: { argb: `FF${COLORS.border}` } },
            right: { style: "thin", color: { argb: `FF${COLORS.border}` } }
        };
    });
    return row.number;
}

function styleExcelData(sheet, startRow) {
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber < startRow) return;
        row.eachCell((cell) => {
            cell.alignment = { vertical: "middle", wrapText: true };
            cell.border = {
                top: { style: "thin", color: { argb: `FF${COLORS.border}` } },
                bottom: { style: "thin", color: { argb: `FF${COLORS.border}` } },
                left: { style: "thin", color: { argb: `FF${COLORS.border}` } },
                right: { style: "thin", color: { argb: `FF${COLORS.border}` } }
            };
            if (rowNumber % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8FA" } };
        });
    });
}

async function createExcelBuffer(report) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Msongola Result System";
    workbook.created = new Date();
    workbook.subject = reportTitle(report);
    const sheet = workbook.addWorksheet(worksheetTitle(report));
    const students = report.students || [];
    const subjects = uniqueSubjects(students);
    const columnCount = report.report_type === "student" ? 4
        : report.report_type === "class" ? Math.max(8, 3 + subjects.length + 4)
            : report.report_type === "subject" ? 6 : 8;
    const lastColumn = ExcelJS.Workbook.xlsx?.columnToLetter
        ? ExcelJS.Workbook.xlsx.columnToLetter(columnCount)
        : (() => {
            let value = columnCount;
            let letters = "";
            while (value) {
                const remainder = (value - 1) % 26;
                letters = String.fromCharCode(65 + remainder) + letters;
                value = Math.floor((value - 1) / 26);
            }
            return letters;
        })();

    sheet.mergeCells(`C1:${lastColumn}1`);
    sheet.getCell("C1").value = report.school?.school_name || "MSONGOLA SECONDARY SCHOOL";
    sheet.getCell("C1").font = { bold: true, size: 16, color: { argb: `FF${COLORS.white}` } };
    sheet.getCell("C1").alignment = { horizontal: "center", vertical: "middle" };
    sheet.getCell("C1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.ink}` } };
    sheet.getRow(1).height = 30;
    sheet.mergeCells(`C2:${lastColumn}2`);
    sheet.getCell("C2").value = [report.school?.po_box, report.school?.motto].filter(Boolean).join(" | ");
    sheet.getCell("C2").alignment = { horizontal: "center", vertical: "middle" };
    sheet.getCell("C2").font = { italic: true, color: { argb: `FF${COLORS.ink}` } };
    sheet.getRow(2).height = 22;
    sheet.mergeCells(`C3:${lastColumn}3`);
    sheet.getCell("C3").value = reportTitle(report);
    sheet.getCell("C3").font = { bold: true, size: 13, color: { argb: `FF${COLORS.teal}` } };
    sheet.getCell("C3").alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(3).height = 22;
    const logoPath = getLogoPath(report);
    if (logoPath) {
        const imageId = workbook.addImage({ buffer: fs.readFileSync(logoPath), extension: "png" });
        sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 92, height: 92 } });
    }

    const detailsSheet = workbook.addWorksheet("Report Details");
    detailsSheet.mergeCells("A1:B1");
    detailsSheet.getCell("A1").value = report.school?.school_name || "MSONGOLA SECONDARY SCHOOL";
    detailsSheet.getCell("A1").font = { bold: true, size: 15, color: { argb: `FF${COLORS.white}` } };
    detailsSheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.ink}` } };
    detailsSheet.getCell("A1").alignment = { horizontal: "center" };
    detailsSheet.addRow(["P.O BOX", report.school?.po_box || ""]);
    detailsSheet.addRow(["Motto", report.school?.motto || ""]);
    detailsSheet.addRow(["Report", reportTitle(report)]);
    reportMetadata(report).forEach((values) => detailsSheet.addRow(values));
    detailsSheet.columns = [{ width: 24 }, { width: 48 }];
    detailsSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.alignment = { vertical: "middle", wrapText: true };
            if (rowNumber > 1) {
                cell.border = {
                    top: { style: "thin", color: { argb: `FF${COLORS.border}` } },
                    bottom: { style: "thin", color: { argb: `FF${COLORS.border}` } },
                    left: { style: "thin", color: { argb: `FF${COLORS.border}` } },
                    right: { style: "thin", color: { argb: `FF${COLORS.border}` } }
                };
            }
        });
    });
    sheet.addRow([]);

    let headers;
    let rows;
    if (report.report_type === "student") {
        const student = students[0] || {};
        headers = ["Subject", "Marks", "Grade", "Points"];
        rows = (student.subjects || []).map((subject) => [subject.subject_name, Number(subject.marks), subject.grade, Number(subject.points)]);
    } else if (report.report_type === "class") {
        headers = ["Position", "Admission Number", "Student Name", ...subjects.map((subject) => `${subject.subject_name} Marks`), "Total Marks", "Average", "Total Points", "Division"];
        rows = students.map((student) => {
            const marks = new Map((student.subjects || []).map((subject) => [String(subject.subject_id), Number(subject.marks)]));
            return [student.class_position || student.position || "", student.admission_number, studentName(student), ...subjects.map((subject) => marks.get(String(subject.subject_id)) ?? ""), Number(student.total_marks), Number(student.average_marks), Number(student.total_points), student.division];
        });
    } else if (report.report_type === "subject") {
        headers = ["Student Name", "Admission Number", "Subject", "Marks", "Grade", "Points"];
        rows = students.flatMap((student) => (student.subjects || []).map((subject) => [
            studentName(student), student.admission_number, subject.subject_name,
            Number(subject.marks), subject.grade, Number(subject.points)
        ]));
    } else {
        headers = ["Measure", "Value", "Subject", "Students", "Average", "Highest", "Lowest", "Grade Distribution"];
        const summary = report.summary || {};
        rows = [
            ["Total Students", summary.total_students ?? students.length, "", "", "", "", "", ""],
            ["Approved Students", summary.approved_students ?? students.length, "", "", "", "", "", ""],
            ["Overall Average", Number(summary.average || 0), "", "", "", "", "", ""],
            ["Total Marks", Number(summary.total_marks || 0), "", "", "", "", "", ""],
            ...Object.entries(summary.division_counts || {}).map(([division, count]) => [`Division ${division}`, count, "", "", "", "", "", ""]),
            ...(report.subject_summary || []).map((subject) => ["Subject Performance", "", subject.subject_name, subject.students, Number(subject.average_marks), subject.highest_mark, subject.lowest_mark, Object.entries(subject.grade_distribution || {}).map(([grade, count]) => `${grade}: ${count}`).join(", ")])
        ];
    }

    const headerRow = addExcelTableHeader(sheet, headers);
    sheet.views = [{ state: "frozen", ySplit: headerRow }];
    rows.forEach((values) => sheet.addRow(values));
    styleExcelData(sheet, headerRow + 1);
    sheet.columns = headers.map((header) => ({ width: Math.min(Math.max(String(header).length + 3, 13), 30) }));
    if (report.report_type === "subject") {
        sheet.addRow([]);
        const summaryHeaders = ["Subject", "Students", "Average", "Highest", "Lowest", "Grade Distribution"];
        const summaryHeaderRow = addExcelTableHeader(sheet, summaryHeaders);
        const subjectRows = (report.subject_summary || []).map((subject) => [
            subject.subject_name,
            subject.students,
            Number(subject.average_marks),
            subject.highest_mark,
            subject.lowest_mark,
            Object.entries(subject.grade_distribution || {}).map(([grade, count]) => `${grade}: ${count}`).join(", ")
        ]);
        subjectRows.forEach((values) => sheet.addRow(values));
        styleExcelData(sheet, summaryHeaderRow + 1);
    }
    if (report.report_type === "student") {
        const student = students[0] || {};
        sheet.addRow([]);
        [
            ["Total Marks", Number(student.total_marks || 0)],
            ["Average", Number(student.average_marks || 0)],
            ["Total Points", Number(student.total_points || 0)],
            ["Division", student.division || ""],
            ["Position", student.class_position || student.position || ""]
        ].forEach(([label, value]) => {
            const row = sheet.addRow([label, value]);
            row.getCell(1).font = { bold: true, color: { argb: `FF${COLORS.ink}` } };
            row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLORS.pale}` } };
        });
    }
    for (const row of sheet.getRows(headerRow + 1, rows.length) || []) {
        row.eachCell((cell, columnNumber) => {
            if (typeof cell.value === "number" && /(marks|average|highest|lowest)/i.test(String(headers[columnNumber - 1]))) {
                cell.numFmt = "0.00";
            }
        });
    }
    return workbook.xlsx.writeBuffer();
}

function getLogoPath(report) {
    const configuredPath = String(report.school?.logo_path || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const logoRelativePath = configuredPath.startsWith("uploads/logo/")
        ? configuredPath
        : "uploads/logo/school-logo.png";
    const logoPath = path.resolve(WORKSPACE_ROOT, logoRelativePath);
    const uploadRoot = path.resolve(WORKSPACE_ROOT, "uploads/logo");
    if (!logoPath.startsWith(`${uploadRoot}${path.sep}`) || !fs.existsSync(logoPath)) return null;
    return logoPath;
}

function tableRows(report) {
    const students = report.students || [];
    if (report.report_type === "student") {
        return {
            columns: [{ title: "Subject", width: 260 }, { title: "Marks", width: 75 }, { title: "Grade", width: 75 }, { title: "Points", width: 75 }],
            rows: (students[0]?.subjects || []).map((subject) => [subject.subject_name, subject.marks, subject.grade, subject.points])
        };
    }
    if (report.report_type === "subject") {
        return {
            columns: [{ title: "Student", width: 130 }, { title: "Admission No.", width: 85 }, { title: "Subject", width: 120 }, { title: "Marks", width: 55 }, { title: "Grade", width: 40 }, { title: "Points", width: 45 }],
            rows: students.flatMap((student) => (student.subjects || []).map((subject) => [studentName(student), student.admission_number, subject.subject_name, subject.marks, subject.grade, subject.points]))
        };
    }
    if (report.report_type === "summary") {
        const summary = report.summary || {};
        return {
                columns: [{ title: "Measure", width: 155 }, { title: "Value", width: 90 }, { title: "Details", width: 210 }],
            rows: [
                ["Total Students", summary.total_students, "Active class roster"],
                ["Approved Students", summary.approved_students, "Students with approved results"],
                ["Overall Average", summary.average, "Based on approved results"],
                ["Total Marks", summary.total_marks, "Approved marks only"],
                ...Object.entries(summary.division_counts || {}).map(([division, count]) => [`Division ${division}`, count, "Approved student results"]),
                ...(report.subject_summary || []).map((subject) => [subject.subject_name, subject.average_marks, `Students ${subject.students}; highest ${subject.highest_mark ?? "-"}; lowest ${subject.lowest_mark ?? "-"}; grades ${Object.entries(subject.grade_distribution || {}).map(([grade, count]) => `${grade}:${count}`).join(" ")}`])
            ]
        };
    }
    return {
        columns: [{ title: "Position", width: 52 }, { title: "Admission No.", width: 84 }, { title: "Student", width: 132 }, { title: "Total", width: 58 }, { title: "Average", width: 58 }, { title: "Points", width: 50 }, { title: "Division", width: 55 }],
        rows: students.map((student) => [student.class_position || student.position, student.admission_number, studentName(student), student.total_marks, student.average_marks, student.total_points, student.division])
    };
}

function drawPdfTable(doc, columns, rows, startY) {
    const xStart = doc.page.margins.left;
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const bottom = doc.page.height - doc.page.margins.bottom - 28;
    let y = startY;

    const drawHeader = () => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.white);
        let x = xStart;
        columns.forEach((column) => {
            doc.rect(x, y, column.width, 24).fill(PDF_COLORS.ink).stroke(PDF_COLORS.border);
            doc.fillColor(PDF_COLORS.white).text(column.title, x + 4, y + 7, { width: column.width - 8, height: 16, lineBreak: false, ellipsis: true });
            x += column.width;
        });
        y += 24;
    };

    if (tableWidth > doc.page.width - doc.page.margins.left - doc.page.margins.right) {
        throw new Error("Jedwali la ripoti ni pana kuliko ukurasa wa A4.");
    }
    drawHeader();
    rows.forEach((row, rowIndex) => {
        doc.font("Helvetica").fontSize(8).fillColor(PDF_COLORS.ink);
        const height = Math.max(22, ...columns.map((column, index) => doc.heightOfString(String(row[index] ?? ""), { width: column.width - 8 }))) + 8;
        if (y + height > bottom) {
            doc.addPage();
            y = doc.page.margins.top;
            drawHeader();
        }
        let x = xStart;
        columns.forEach((column, index) => {
            if (rowIndex % 2 === 1) doc.rect(x, y, column.width, height).fill("#F5F8FA");
            doc.rect(x, y, column.width, height).stroke(PDF_COLORS.border);
            doc.fillColor(PDF_COLORS.ink).text(String(row[index] ?? "-"), x + 4, y + 4, { width: column.width - 8, height: height - 8, ellipsis: true });
            x += column.width;
        });
        y += height;
    });
    return y;
}

async function createPdfBuffer(report) {
    const doc = new PDFDocument({ size: "A4", layout: "portrait", margins: { top: 38, right: 42, bottom: 42, left: 42 }, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const output = new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });

    const logoPath = getLogoPath(report);
    if (logoPath) {
        try {
            doc.image(logoPath, 42, 8, { fit: [136, 136], align: "center", valign: "center" });
        } catch (error) { console.warn("Report PDF logo could not be embedded:", error.message); }
    }
    const school = report.school || {};
    doc.font("Helvetica-Bold").fontSize(16).fillColor(PDF_COLORS.ink).text(school.school_name || "MSONGOLA SECONDARY SCHOOL", 190, 40, { width: 363, align: "left", ellipsis: true });
    doc.font("Helvetica").fontSize(9).fillColor(PDF_COLORS.ink).text(school.po_box || "", 190, 68, { width: 363 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.teal).text(school.motto || "", 190, 84, { width: 363 });
    doc.moveTo(42, 152).lineTo(553, 152).lineWidth(1.4).stroke(PDF_COLORS.teal);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(PDF_COLORS.ink).text(reportTitle(report), 42, 164, { width: 511, align: "center" });
    doc.y = 183;
    doc.moveDown(0.8);

    const metadata = reportMetadata(report);
    metadata.forEach(([label, value]) => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.ink).text(`${label}: `, { continued: true });
        doc.font("Helvetica").text(String(value || "-"));
    });
    doc.moveDown(0.8);

    const table = tableRows(report);
    let y = drawPdfTable(doc, table.columns, table.rows, doc.y);
    if (report.report_type === "student") {
        const student = report.students?.[0] || {};
        y += 10;
        doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.ink).text(`Total Marks: ${student.total_marks}    Average: ${student.average_marks}    Total Points: ${student.total_points}    Division: ${student.division}    Position: ${student.class_position || student.position || "-"}`, 42, y, { width: 511 });
    } else if (report.report_type === "subject") {
        const subjectRows = (report.subject_summary || []).map((subject) => [
            subject.subject_name,
            subject.students,
            subject.average_marks,
            subject.highest_mark,
            subject.lowest_mark,
            Object.entries(subject.grade_distribution || {}).map(([grade, count]) => `${grade}: ${count}`).join(", ")
        ]);
        y = drawPdfTable(doc, [
            { title: "Subject", width: 125 }, { title: "Students", width: 55 },
            { title: "Average", width: 65 }, { title: "Highest", width: 65 },
            { title: "Lowest", width: 65 }, { title: "Grades", width: 100 }
        ], subjectRows, y + 10);
    } else if (report.report_type === "summary") {
        y += 12;
        doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_COLORS.ink).text("Subject performance and grade distributions are included in the summary table above.", 42, y, { width: 511 });
    }

    const footerHeight = report.report_type === "student" ? 96 : 72;
    if (y + footerHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
    }
    doc.y = y + 16;
    const footerY = doc.y;
    const blockWidth = 160;
    const classTeacher = report.class_teacher?.full_name || "Not Assigned";
    const academicMaster = report.academic_master?.name || school.academic_master || "Not Assigned";
    const head = report.head_of_school?.name || school.head_of_school || "Not Assigned";
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_COLORS.ink).text("CLASS TEACHER", 42, footerY);
    doc.font("Helvetica").text(classTeacher, 42, footerY + 16, { width: blockWidth });
    doc.font("Helvetica-Bold").text("ACADEMIC MASTER", 217, footerY);
    doc.font("Helvetica").text(academicMaster, 217, footerY + 16, { width: blockWidth });
    doc.text("Signature: __________________", 217, footerY + 37, { width: blockWidth });
    doc.font("Helvetica-Bold").text("HEAD OF SCHOOL", 392, footerY);
    doc.font("Helvetica").text(head, 392, footerY + 16, { width: blockWidth });
    doc.roundedRect(405, footerY + 36, 118, 34, 12).dash(3, { space: 2 }).stroke(PDF_COLORS.border).undash();
    doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_COLORS.ink).text("OFFICIAL SCHOOL STAMP", 410, footerY + 49, { width: 108, align: "center" });
    doc.font("Helvetica").fontSize(7).fillColor("#64748B").text("Official report. Only approved marks are included.", 42, footerY + 82, { width: 511, align: "center" });
    doc.end();
    return output;
}

module.exports = { createExcelBuffer, createPdfBuffer };