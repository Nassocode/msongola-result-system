(() => {
    "use strict";

    import("./shared-shell.js").catch((error) => {
        console.error("Academic Master shell could not be loaded:", error);
    });

    const resource = document.body.dataset.operation;
    const base = "/academic-master/operations";
    const config = {
        examinations: { endpoint: `${base}/examinations`, title: "Mitihani", options: `${base}/examinations/options` },
        classTeachers: { endpoint: `${base}/class-teachers`, title: "Class Teachers" },
        submissions: { endpoint: `${base}/submissions`, title: "Mark Submissions" },
        results: { endpoint: `${base}/results`, title: "Matokeo" },
        reports: { endpoint: `${base}/reports`, title: "Ripoti" }
    }[resource];

    const tbody = document.getElementById("opsRows");
    const table = document.getElementById("opsTable");
    const tableWrap = document.getElementById("opsTableWrap");
    const submissionClasses = document.getElementById("opsSubmissionClasses");
    const empty = document.getElementById("opsEmpty");
    const error = document.getElementById("opsError");
    const search = document.getElementById("opsSearch");
    const statusFilter = document.getElementById("opsStatusFilter");
    const modal = document.getElementById("opsModal");
    const form = document.getElementById("opsForm");
    const formError = document.getElementById("opsFormError");
    const count = document.getElementById("opsCount");
    let rows = [];

    const escapeHTML = (value) => {
        const element = document.createElement("span");
        element.textContent = value ?? "";
        return element.innerHTML;
    };

    function badge(status) {
        const value = String(status || "DRAFT").toUpperCase();
        const text = ({ ACTIVE: "Active", INACTIVE: "Inactive", DRAFT: "Draft", OPEN: "Open", CLOSED: "Closed", SUBMITTED: "Submitted", APPROVED: "Approved", RETURNED: "Returned", PROCESSED: "Processed" })[value] || value;
        return `<span class="ops-badge ${value.toLowerCase()}">${escapeHTML(text)}</span>`;
    }

    function rowHTML(item, index) {
        if (resource === "examinations") {
            const nextStatus = item.status === "DRAFT" ? "OPEN" : item.status === "OPEN" ? "CLOSED" : "OPEN";
            return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(item.exam_name)}</strong></td><td>${escapeHTML(item.exam_type)}</td><td>${escapeHTML(item.term || "-")}</td><td>${escapeHTML(item.academic_year)}</td><td>${escapeHTML(item.start_date || "-")}</td><td>${escapeHTML(item.end_date || "-")}</td><td>${badge(item.status)} <button class="ops-status-button" data-exam-id="${item.id}" data-next-status="${nextStatus}" type="button">${nextStatus === "OPEN" ? "Fungua" : "Funga"}</button></td></tr>`;
        }
        if (resource === "classTeachers") return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(item.class_name)}</strong></td><td>${escapeHTML(item.teacher_name)}</td><td>${escapeHTML(item.teacher_number)}</td><td>${escapeHTML(item.academic_year)}</td><td>${badge(item.status)}</td></tr>`;
        if (resource === "submissions") {
            const actions = item.status === "SUBMITTED" ? `<div class="ops-row-actions"><button class="ops-button" data-review="APPROVED" data-id="${item.id}" type="button">Approve</button><button class="ops-button danger" data-review="RETURNED" data-id="${item.id}" type="button">Return</button></div>` : "-";
            return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(item.teacher_name)}</strong><br><small>${escapeHTML(item.teacher_number)}</small></td><td>${escapeHTML(item.class_name)}</td><td>${escapeHTML(item.subject_name)}</td><td>${escapeHTML(item.exam_name)} ${item.term ? `· ${escapeHTML(item.term)}` : ""}</td><td>${escapeHTML(item.academic_year)}</td><td>${escapeHTML(item.marks_count)}</td><td>${badge(item.status)}</td><td>${actions}</td></tr>`;
        }
        if (resource === "results") return `<tr><td>${index + 1}</td><td>${escapeHTML(item.position ?? "-")}</td><td><strong>${escapeHTML(item.student_name)}</strong><br><small>${escapeHTML(item.admission_number)}</small></td><td>${escapeHTML(item.class_name)}</td><td>${escapeHTML(item.exam_name)}</td><td>${escapeHTML(item.academic_year)}</td><td>${escapeHTML(item.total_marks)}</td><td>${escapeHTML(item.average_marks)}%</td><td>${escapeHTML(item.division || "-")}</td><td>${badge(item.status)}</td></tr>`;
        return `<tr><td>${index + 1}</td><td>${escapeHTML(item.exam_name)} ${item.term ? `· ${escapeHTML(item.term)}` : ""}</td><td>${escapeHTML(item.class_name)}</td><td>${escapeHTML(item.academic_year)}</td><td>${escapeHTML(item.students)}</td><td>${escapeHTML(item.class_average ?? "-")}%</td><td>I: ${escapeHTML(item.division_i || 0)} · II: ${escapeHTML(item.division_ii || 0)} · III: ${escapeHTML(item.division_iii || 0)} · IV: ${escapeHTML(item.division_iv || 0)} · 0: ${escapeHTML(item.division_zero || 0)}</td></tr>`;
    }

    function renderSubmissionClasses(submissions, matchingSubmissions, query) {
        const matchingIds = new Set(matchingSubmissions.map((submission) => String(submission.id)));
        const openGroups = new Set(
            [...submissionClasses.querySelectorAll("details[open]")]
                .map((group) => group.dataset.groupKey)
                .filter(Boolean)
        );
        const classes = new Map();
        for (const submission of submissions) {
            const key = `${submission.class_id}:${submission.academic_year}`;
            if (!classes.has(key)) {
                classes.set(key, {
                    key,
                    class_id: submission.class_id,
                    academic_year_id: submission.academic_year_id,
                    form_id: submission.form_id,
                    form_name: submission.form_name,
                    class_name: submission.class_name,
                    academic_year: submission.academic_year,
                    submissions: []
                });
            }
            classes.get(key).submissions.push(submission);
        }

        const classGroups = [...classes.values()];
        const totalMarks = matchingSubmissions.reduce((total, submission) => total + Number(submission.marks_count || 0), 0);
        const pendingCount = matchingSubmissions.filter((submission) => submission.status === "SUBMITTED").length;
        const approvedCount = matchingSubmissions.filter((submission) => submission.status === "APPROVED").length;
        const visibleClasses = classGroups.filter((classGroup) => classGroup.submissions.some((submission) => matchingIds.has(String(submission.id))));
        if (count) count.textContent = `${visibleClasses.length} classes · ${pendingCount} pending · ${approvedCount} approved · ${totalMarks} student marks`;
        submissionClasses.innerHTML = visibleClasses.map((classGroup, classIndex) => {
            const classLabel = [classGroup.form_name, classGroup.class_name].filter(Boolean).join(" · ");
            const exams = new Map();
            for (const submission of classGroup.submissions) {
                const examKey = String(submission.examination_id);
                if (!exams.has(examKey)) {
                    exams.set(examKey, {
                        key: `${classGroup.key}:${examKey}`,
                        id: submission.examination_id,
                        name: submission.exam_name,
                        term: submission.term,
                        academic_year: submission.academic_year,
                        submissions: [],
                        subjects: new Map(),
                        assignedSubjects: new Map(),
                        students: new Map()
                    });
                }
                const exam = exams.get(examKey);
                exam.submissions.push(submission);
                for (const student of submission.class_students || []) {
                    const studentKey = String(student.student_id);
                    if (!exam.students.has(studentKey)) {
                        exam.students.set(studentKey, {
                            id: student.student_id,
                            name: student.student_name,
                            admission_number: student.admission_number,
                            marks: new Map()
                        });
                    }
                }
                for (const subject of submission.assigned_subjects || []) {
                    const subjectKey = String(subject.id || subject.name);
                    exam.assignedSubjects.set(subjectKey, subject.name);
                    exam.subjects.set(subjectKey, subject.name);
                }
                exam.subjects.set(String(submission.subject_id || submission.subject_name), submission.subject_name);
                for (const student of submission.students || []) {
                    const studentKey = String(student.student_id || student.admission_number);
                    if (!exam.students.has(studentKey)) {
                        exam.students.set(studentKey, {
                            id: student.student_id,
                            name: student.student_name,
                            admission_number: student.admission_number,
                            marks: new Map()
                        });
                    }
                    exam.students.get(studentKey).marks.set(String(submission.subject_name), {
                        mark: student.mark,
                        status: student.mark_status || submission.status
                    });
                }
            }

            const examGroups = [...exams.values()];
            const studentCount = new Set(examGroups.flatMap((exam) => [...exam.students.keys()])).size;
            const pendingSubjects = classGroup.submissions.filter((submission) => submission.status === "SUBMITTED").length;
            const examMarkup = examGroups.map((exam, examIndex) => {
                const visibleExamSubmissions = exam.submissions.filter((submission) => matchingIds.has(String(submission.id)));
                if (!visibleExamSubmissions.length) return "";
                const subjectNames = [...exam.subjects.values()].sort((left, right) => left.localeCompare(right));
                const allApproved = exam.assignedSubjects.size > 0
                    && exam.submissions.length === exam.assignedSubjects.size
                    && exam.submissions.every((submission) => submission.status === "APPROVED");
                const allStudentMarksComplete = exam.students.size > 0
                    && [...exam.students.values()].every((student) => [...exam.assignedSubjects.values()].every((subjectName) => {
                        const mark = student.marks.get(String(subjectName));
                        return mark && mark.status === "APPROVED";
                    }));
                const readyForReports = allApproved && allStudentMarksComplete;
                const missingSubjectCount = Math.max(exam.assignedSubjects.size - exam.submissions.length, 0);
                const pendingCount = exam.submissions.filter((submission) => submission.status === "SUBMITTED").length + missingSubjectCount;
                const matchingStudentIds = new Set(
                    exam.submissions.flatMap((submission) => submission.students || [])
                        .filter((student) => `${student.student_name} ${student.admission_number}`.toLowerCase().includes(query))
                        .map((student) => String(student.student_id))
                );
                const matrixStudents = [...exam.students.values()]
                    .filter((student) => !query || !matchingStudentIds.size || matchingStudentIds.has(String(student.id)))
                    .sort((left, right) => left.name.localeCompare(right.name));
                const matrixRows = matrixStudents.map((student) => {
                    const subjectCells = subjectNames.map((subjectName) => {
                        const mark = student.marks.get(String(subjectName));
                        return `<td>${mark ? `<strong>${escapeHTML(mark.mark)}</strong><small class="ops-mark-status">${escapeHTML(mark.status)}</small>` : '<span class="ops-mark-missing">-</span>'}</td>`;
                    }).join("");
                    const reportUrl = `reports.html?report_type=student&student_id=${encodeURIComponent(student.id)}&class_id=${encodeURIComponent(classGroup.class_id)}&academic_year_id=${encodeURIComponent(classGroup.academic_year_id)}&form_id=${encodeURIComponent(classGroup.form_id)}&examination_id=${encodeURIComponent(exam.id)}`;
                    const reportAction = readyForReports
                        ? `<a class="ops-button secondary ops-student-report" href="${reportUrl}"><i class="fa-solid fa-file-export" aria-hidden="true"></i> Ripoti</a>`
                        : '<span class="ops-report-pending" title="Idhinisha masomo yote kwanza">Ripoti baada ya idhini</span>';
                    return `<tr><td><strong>${escapeHTML(student.name)}</strong></td><td>${escapeHTML(student.admission_number)}</td>${subjectCells}<td>${reportAction}</td></tr>`;
                }).join("");
                const subjectSubmissions = visibleExamSubmissions.map((submission) => {
                    const actions = submission.status === "SUBMITTED"
                        ? `<div class="ops-row-actions"><button class="ops-button" data-review="APPROVED" data-id="${submission.id}" type="button"><i class="fa-solid fa-check" aria-hidden="true"></i> Approve</button><button class="ops-button danger" data-review="RETURNED" data-id="${submission.id}" type="button">Return</button></div>`
                        : "";
                    return `<article class="ops-subject-review"><div><strong>${escapeHTML(submission.subject_name)}</strong><small>${escapeHTML(submission.teacher_name)} · ${escapeHTML(submission.teacher_number)}</small>${submission.review_comment ? `<p class="ops-review-comment">Feedback: ${escapeHTML(submission.review_comment)}</p>` : ""}</div><div class="ops-subject-actions">${badge(submission.status)}${actions}</div></article>`;
                }).join("");
                const examLabel = `${exam.name}${exam.term ? ` · ${exam.term}` : ""}`;
                return `
                    <details class="ops-exam-group" data-group-key="${escapeHTML(exam.key)}"${openGroups.has(exam.key) || (!openGroups.size && examIndex === 0) ? " open" : ""}>
                        <summary><span class="ops-exam-title"><strong>${escapeHTML(examLabel)}</strong><small>${exam.submissions.length} of ${exam.assignedSubjects.size || exam.submissions.length} subjects submitted · ${exam.students.size} students</small></span><span class="ops-exam-state">${readyForReports ? badge("APPROVED") : `${pendingCount || "Marks incomplete"} pending`}</span><i class="fa-solid fa-chevron-down ops-class-chevron" aria-hidden="true"></i></summary>
                        <div class="ops-exam-content">
                            <div class="ops-student-matrix-heading"><div><h3>Marks by student</h3><p>Compare every subject for each student in this class.</p></div>${readyForReports ? '<span class="ops-approved-note"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Ready for student reports</span>' : '<span class="ops-pending-note">Complete and approve all class marks to enable reports</span>'}</div>
                            <div class="ops-student-table-wrap"><table class="ops-student-table ops-student-matrix"><thead><tr><th>Student</th><th>Admission No.</th>${subjectNames.map((subjectName) => `<th>${escapeHTML(subjectName)}</th>`).join("")}<th>Student report</th></tr></thead><tbody>${matrixRows || `<tr><td colspan="${subjectNames.length + 3}" class="ops-no-students">No student marks were found.</td></tr>`}</tbody></table></div>
                            <div class="ops-subject-review-list"><div class="ops-review-list-heading"><h3>Subject submissions</h3><span>${exam.submissions.length} submissions</span></div>${subjectSubmissions}</div>
                        </div>
                    </details>
                `;
            }).join("");

            return `
                <details class="ops-class-group" data-group-key="${escapeHTML(classGroup.key)}"${openGroups.has(classGroup.key) || (!openGroups.size && classIndex === 0) ? " open" : ""}>
                    <summary>
                        <span class="ops-class-mark"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span>
                        <span class="ops-class-title"><strong>${escapeHTML(classLabel)}</strong><small>${escapeHTML(classGroup.academic_year)}</small></span>
                        <span class="ops-class-count">${classGroup.submissions.length} submissions · ${studentCount} students · ${pendingSubjects} pending</span>
                        <i class="fa-solid fa-chevron-down ops-class-chevron" aria-hidden="true"></i>
                    </summary>
                    <div class="ops-class-details">${examMarkup}</div>
                </details>
            `;
        }).join("");
        submissionClasses.hidden = visibleClasses.length === 0;
        table.hidden = true;
        if (tableWrap) tableWrap.hidden = true;
        empty.hidden = matchingSubmissions.length > 0;
        empty.textContent = rows.length === 0 ? "No marks have been submitted yet." : "No submissions match your filters.";
    }

    function render() {
        const query = String(search?.value || "").trim().toLowerCase();
        const selectedStatus = String(statusFilter?.value || "").toUpperCase();
        const matchingRows = rows.filter((row) => {
            const matchesSearch = JSON.stringify(row).toLowerCase().includes(query);
            const matchesStatus = !selectedStatus || String(row.status || "").toUpperCase() === selectedStatus;
            return matchesSearch && matchesStatus;
        });
        if (resource === "submissions") {
            renderSubmissionClasses(rows, matchingRows, query);
            return;
        }
        const visibleRows = matchingRows;
        if (submissionClasses) submissionClasses.hidden = true;
        tbody.innerHTML = visibleRows.map(rowHTML).join("");
        if (tableWrap) tableWrap.hidden = visibleRows.length === 0;
        table.hidden = visibleRows.length === 0;
        empty.hidden = visibleRows.length > 0;
        empty.textContent = rows.length === 0 ? "Bado hakuna taarifa zilizosajiliwa." : "Hakuna matokeo yanayolingana na utafutaji.";
        if (count) count.textContent = `${visibleRows.length} records`;
    }

    async function load() {
        error.hidden = true;
        try {
            const response = await MsongolaAPI.get(config.endpoint);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia taarifa.");
            rows = Array.isArray(response.data) ? response.data : [];
            render();
        } catch (requestError) {
            table.hidden = true;
            if (tableWrap) tableWrap.hidden = true;
            if (submissionClasses) submissionClasses.hidden = true;
            empty.hidden = true;
            error.textContent = requestError.message;
            error.hidden = false;
        }
    }

    async function populateOptions() {
        if (!config.options) return;
        const response = await MsongolaAPI.get(config.options);
        if (!response?.success) throw new Error(response?.message || "Taarifa za chaguo hazikupatikana.");
        const data = response.data || {};
        const setOptions = (elementId, items, formatter) => {
            const select = document.getElementById(elementId);
            if (!select) return;
            select.innerHTML = `<option value="">Chagua</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(formatter(item))}</option>`).join("")}`;
        };
        if (resource === "examinations") setOptions("examYear", data.years || [], (item) => item.year_label);
        if (resource === "classTeachers") {
            const teachers = data.teachers || [];
            if (teachers.length) {
                setOptions("classTeacher", teachers, (item) => `${item.teacher_name} (${item.teacher_number})`);
            } else {
                const teacherSelect = document.getElementById("classTeacher");
                if (teacherSelect) teacherSelect.innerHTML = '<option value="">Hakuna teacher profile iliyosajiliwa</option>';
                error.textContent = "Subject Teacher account hazijaunganishwa na taarifa za mwalimu. Admin afungue Walimu, achague account, ajaze teacher number na majina, kisha Academic Master arudie hapa.";
                error.hidden = false;
            }
            setOptions("classId", data.classes || [], (item) => `${item.form_name} - ${item.class_name} (${item.academic_year})`);
            setOptions("classYear", data.years || [], (item) => item.year_label);
        }
    }

    function closeModal() {
        modal.hidden = true;
        form.reset();
        formError.hidden = true;
    }

    async function createRecord(event) {
        event.preventDefault();
        formError.hidden = true;
        const payload = Object.fromEntries(new FormData(form));
        const path = resource === "examinations" ? config.endpoint : `${config.endpoint}`;
        try {
            const response = await MsongolaAPI.post(path, payload);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuhifadhi.");
            closeModal();
            await load();
        } catch (requestError) {
            formError.textContent = requestError.message;
            formError.hidden = false;
        }
    }

    async function review(event) {
        const examButton = event.target.closest("[data-exam-id]");
        if (examButton) {
            examButton.disabled = true;
            try {
                const response = await MsongolaAPI.patch(`${base}/examinations/${examButton.dataset.examId}/status`, { status: examButton.dataset.nextStatus });
                if (!response?.success) throw new Error(response?.message || "Imeshindikana kubadilisha hali ya mtihani.");
                await load();
            } catch (requestError) {
                error.textContent = requestError.message;
                error.hidden = false;
                examButton.disabled = false;
            }
            return;
        }
        const button = event.target.closest("[data-review]");
        if (!button) return;
        const status = button.dataset.review;
        const comment = status === "RETURNED" ? window.prompt("Andika sababu ya kurudisha alama:") : "";
        if (status === "RETURNED" && !String(comment || "").trim()) return;
        if (status === "APPROVED" && !window.confirm("Thibitisha ku-approve submission hii?")) return;
        try {
            const response = await MsongolaAPI.patch(`${config.endpoint}/${button.dataset.id}/review`, { status, review_comment: comment || "" });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kukagua submission.");
            await load();
        } catch (requestError) {
            error.textContent = requestError.message;
            error.hidden = false;
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        if (!await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] })) return;
        if (resource === "classTeachers") {
            document.getElementById("openOpsModal")?.remove();
            modal?.remove();
            const description = document.querySelector(".ops-header p");
            if (description) description.textContent = "Orodha ya walimu waratibu waliowekwa kwa kila darasa maalum. Academic Master anaweza kutazama, lakini Admin ndiye anayefanya assignments.";
        }
        search?.addEventListener("input", render);
        statusFilter?.addEventListener("change", render);
        if (resource !== "classTeachers") {
            document.getElementById("openOpsModal")?.addEventListener("click", () => { modal.hidden = false; });
            document.getElementById("closeOpsModal")?.addEventListener("click", closeModal);
            document.getElementById("cancelOpsModal")?.addEventListener("click", closeModal);
            form?.addEventListener("submit", createRecord);
        }
        tbody?.addEventListener("click", review);
        submissionClasses?.addEventListener("click", review);
        document.getElementById("printOpsReport")?.addEventListener("click", () => window.print());
        await load();
        try { await populateOptions(); } catch (requestError) { error.textContent = requestError.message; error.hidden = false; }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
