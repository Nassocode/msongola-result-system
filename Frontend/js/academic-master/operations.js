(() => {
    "use strict";

    import("./shared-shell.js").catch((error) => {
        console.error("Academic Master shell could not be loaded:", error);
    });

    const resource = document.body.dataset.operation;
    const base = "/academic-master/operations";
    const config = {
        examinations: { endpoint: `${base}/examinations`, title: "Mitihani", options: `${base}/examinations/options` },
        classTeachers: { endpoint: `${base}/class-teachers`, title: "Class Teachers", options: `${base}/class-teachers/options` },
        submissions: { endpoint: `${base}/submissions`, title: "Mark Submissions" },
        results: { endpoint: `${base}/results`, title: "Matokeo" },
        reports: { endpoint: `${base}/reports`, title: "Ripoti" }
    }[resource];

    const tbody = document.getElementById("opsRows");
    const table = document.getElementById("opsTable");
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

    function render() {
        const query = String(search?.value || "").trim().toLowerCase();
        const visibleRows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
        tbody.innerHTML = visibleRows.map(rowHTML).join("");
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
            empty.hidden = true;
            error.textContent = requestError.message;
            error.hidden = false;
        }
    }

    async function populateOptions() {
        if (!config.options) return;
        const response = await MsongolaAPI.get(config.options);
        const data = response.data || {};
        const setOptions = (elementId, items, formatter) => {
            const select = document.getElementById(elementId);
            if (!select) return;
            select.innerHTML = `<option value="">Chagua</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(formatter(item))}</option>`).join("")}`;
        };
        if (resource === "examinations") setOptions("examYear", data.years || [], (item) => item.year_label);
        if (resource === "classTeachers") {
            setOptions("classTeacher", data.teachers || [], (item) => `${item.teacher_name} (${item.teacher_number})`);
            setOptions("classId", data.classes || [], (item) => item.class_name);
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
        search?.addEventListener("input", render);
        document.getElementById("openOpsModal")?.addEventListener("click", () => { modal.hidden = false; });
        document.getElementById("closeOpsModal")?.addEventListener("click", closeModal);
        document.getElementById("cancelOpsModal")?.addEventListener("click", closeModal);
        form?.addEventListener("submit", createRecord);
        tbody?.addEventListener("click", review);
        document.getElementById("printOpsReport")?.addEventListener("click", () => window.print());
        try { await populateOptions(); } catch (requestError) { error.textContent = requestError.message; error.hidden = false; }
        await load();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
