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

    function renderSubmissionClasses(submissions) {
        const classes = new Map();
        for (const submission of submissions) {
            const key = `${submission.class_id}:${submission.academic_year}`;
            if (!classes.has(key)) {
                classes.set(key, {
                    form_name: submission.form_name,
                    class_name: submission.class_name,
                    academic_year: submission.academic_year,
                    submissions: []
                });
            }
            classes.get(key).submissions.push(submission);
        }

        const classGroups = [...classes.values()];
        const totalMarks = submissions.reduce((total, submission) => total + Number(submission.marks_count || 0), 0);
        if (count) count.textContent = `${classGroups.length} classes · ${submissions.length} submissions · ${totalMarks} student marks`;
        submissionClasses.innerHTML = classGroups.map((classGroup) => {
            const classLabel = [classGroup.form_name, classGroup.class_name].filter(Boolean).join(" · ");
            const studentCount = classGroup.submissions.reduce((total, submission) => total + Number(submission.marks_count || 0), 0);
            const submissionMarkup = classGroup.submissions.map((submission) => {
                const actions = submission.status === "SUBMITTED"
                    ? `<div class="ops-row-actions"><button class="ops-button" data-review="APPROVED" data-id="${submission.id}" type="button">Approve</button><button class="ops-button danger" data-review="RETURNED" data-id="${submission.id}" type="button">Return</button></div>`
                    : "";
                const students = Array.isArray(submission.students) ? submission.students : [];
                return `
                    <section class="ops-class-submission">
                        <header class="ops-class-submission-head">
                            <div>
                                <p class="ops-submission-context">${escapeHTML(submission.subject_name)} · ${escapeHTML(submission.exam_name)}${submission.term ? ` · ${escapeHTML(submission.term)}` : ""}</p>
                                <h3>${students.length} student marks</h3>
                                <p class="ops-submitted-by"><i class="fa-solid fa-user-tie" aria-hidden="true"></i> Submitted by <strong>${escapeHTML(submission.teacher_name)}</strong> <span>${escapeHTML(submission.teacher_number)}</span></p>
                                ${submission.review_comment ? `<p class="ops-review-comment">Feedback: ${escapeHTML(submission.review_comment)}</p>` : ""}
                            </div>
                            <div class="ops-submission-controls">${badge(submission.status)}${actions}</div>
                        </header>
                        <div class="ops-student-table-wrap">
                            <table class="ops-student-table">
                                <thead><tr><th>Student</th><th>Admission No.</th><th>Mark / 100</th><th>Mark status</th></tr></thead>
                                <tbody>${students.map((student) => `<tr><td><strong>${escapeHTML(student.student_name)}</strong></td><td>${escapeHTML(student.admission_number)}</td><td>${escapeHTML(student.mark)}</td><td>${badge(student.mark_status || submission.status)}</td></tr>`).join("")}</tbody>
                            </table>
                            ${students.length ? "" : '<p class="ops-no-students">No student marks were found for this submission.</p>'}
                        </div>
                    </section>
                `;
            }).join("");

            return `
                <details class="ops-class-group">
                    <summary>
                        <span class="ops-class-mark"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span>
                        <span class="ops-class-title"><strong>${escapeHTML(classLabel)}</strong><small>${escapeHTML(classGroup.academic_year)}</small></span>
                        <span class="ops-class-count">${classGroup.submissions.length} submissions · ${studentCount} student marks</span>
                        <i class="fa-solid fa-chevron-down ops-class-chevron" aria-hidden="true"></i>
                    </summary>
                    <div class="ops-class-details">${submissionMarkup}</div>
                </details>
            `;
        }).join("");
        submissionClasses.hidden = classGroups.length === 0;
        table.hidden = true;
        if (tableWrap) tableWrap.hidden = true;
        empty.hidden = submissions.length > 0;
        empty.textContent = rows.length === 0 ? "No marks have been submitted yet." : "No submissions match your search.";
    }

    function render() {
        const query = String(search?.value || "").trim().toLowerCase();
        const visibleRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
        if (resource === "submissions") {
            renderSubmissionClasses(visibleRows);
            return;
        }
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
