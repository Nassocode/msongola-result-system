(() => {
    "use strict";

    if (document.body.dataset.role === "ACADEMIC_MASTER") {
        import("../academic-master/shared-shell.js").catch((error) => {
            console.error("Academic Master shell could not be loaded:", error);
        });
    }

    const page = document.body.dataset.catalog;
    const endpoints = { teachers: "/admin-catalog/teachers", subjects: "/admin-catalog/subjects", classes: "/admin-catalog/classes", assignments: "/admin-catalog/assignments" };
    const list = document.getElementById("catalogList");
    const table = document.getElementById("catalogTable");
    const empty = document.getElementById("catalogEmpty");
    const error = document.getElementById("catalogError");
    const search = document.getElementById("catalogSearch");
    const modal = document.getElementById("catalogModal");
    const form = document.getElementById("catalogForm");
    const alertBox = document.getElementById("catalogAlert");

    let records = [];

    const escapeHTML = (value) => {
        const node = document.createElement("div");
        node.textContent = value ?? "";
        return node.innerHTML;
    };

    function statusBadge(status) {
        const active = String(status).toUpperCase() === "ACTIVE";
        return `<span class="catalog-badge${active ? "" : " inactive"}">${active ? "Active" : "Inactive"}</span>`;
    }

    function statusControl(item) {
        const nextStatus = String(item.status).toUpperCase() === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        return `${statusBadge(item.status)} <button class="catalog-status-toggle" type="button" data-status-id="${item.id}" data-next-status="${nextStatus}" title="Badili status kuwa ${nextStatus}"><i class="fa-solid fa-rotate"></i></button>`;
    }

    function render() {
        const query = String(search?.value || "").toLowerCase().trim();
        const visible = records.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
        list.innerHTML = visible.map((item, index) => {
            if (page === "teachers") {
                const name = [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" ");
                return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(name)}</strong><br><small>${escapeHTML(item.teacher_number || "")}</small></td><td>${escapeHTML(item.username || "-")}</td><td>${escapeHTML(item.phone || "-")}</td><td>${statusControl(item)}</td></tr>`;
            }
            if (page === "subjects") {
                return `<tr><td>${index + 1}</td><td>${escapeHTML(item.subject_code)}</td><td><strong>${escapeHTML(item.subject_name)}</strong></td><td>${statusControl(item)}</td></tr>`;
            }
            if (page === "assignments") {
                return `<tr><td>${index + 1}</td><td>${escapeHTML(item.teacher_name)}</td><td>${escapeHTML(item.class_name)}</td><td>${escapeHTML(item.subject_name)}</td><td>${escapeHTML(item.academic_year)}</td><td>${statusControl(item)}</td></tr>`;
            }
            return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(item.class_name)}</strong></td><td>${escapeHTML(item.form_name)}</td><td>${escapeHTML(item.academic_year)}</td><td>${escapeHTML(item.capacity || "-")}</td><td>${statusControl(item)}</td></tr>`;
        }).join("");
        table.hidden = visible.length === 0;
        empty.hidden = visible.length !== 0;
    }

    async function load() {
        error.hidden = true;
        try {
            const response = await MsongolaAPI.get(endpoints[page]);
            if (!response?.success) throw new Error(response?.message || "Taarifa hazikupatikana.");
            records = Array.isArray(response.data) ? response.data : [];
            render();
        } catch (requestError) {
            table.hidden = true;
            empty.hidden = true;
            error.hidden = false;
            error.textContent = requestError.message;
        }
    }

    async function loadTeacherOptions() {
        if (page !== "teachers") return;
        const select = document.getElementById("teacherUserId");
        if (!select) return;

        try {
            const response = await MsongolaAPI.get("/admin-catalog/teachers/options");
            const users = Array.isArray(response.data) ? response.data : [];
            select.innerHTML = users.length
                ? `<option value="">Chagua account</option>${users.map((user) => `<option value="${user.id}">${escapeHTML(user.username)}</option>`).join("")}`
                : '<option value="">Hakuna account mpya ya Subject Teacher</option>';
        } catch (requestError) {
            select.innerHTML = '<option value="">Imeshindikana kupakia accounts</option>';
        }
    }

    async function loadClassOptions() {
        if (page !== "classes") return;
        try {
            const response = await MsongolaAPI.get("/admin-catalog/classes/options");
            const forms = response.data?.forms || [];
            const years = response.data?.years || [];
            const formSelect = document.getElementById("classFormId");
            const yearSelect = document.getElementById("classYearId");
            if (formSelect) formSelect.innerHTML = `<option value="">Chagua form</option>${forms.map((item) => `<option value="${item.id}">${escapeHTML(item.form_name)}</option>`).join("")}`;
            if (yearSelect) yearSelect.innerHTML = `<option value="">Chagua mwaka</option>${years.map((item) => `<option value="${item.id}">${escapeHTML(item.year_label)}</option>`).join("")}`;
        } catch (requestError) {
            const formSelect = document.getElementById("classFormId");
            if (formSelect) formSelect.innerHTML = '<option value="">Imeshindikana kupakia forms</option>';
        }
    }

    async function loadAssignmentOptions() {
        if (page !== "assignments") return;
        const response = await MsongolaAPI.get("/admin-catalog/assignments/options");
        const data = response.data || {};
        const fill = (id, items, label) => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = `<option value="">Chagua</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(label(item))}</option>`).join("")}`;
        };
        fill("assignmentTeacher", data.teachers || [], (item) => `${item.teacher_name} (${item.teacher_number})`);
        fill("assignmentClass", data.classes || [], (item) => item.class_name);
        fill("assignmentSubject", data.subjects || [], (item) => `${item.subject_code} - ${item.subject_name}`);
        fill("assignmentYear", data.years || [], (item) => item.year_label);
    }

    function openModal() { if (modal) modal.hidden = false; }
    function closeModal() { if (modal) { modal.hidden = true; form?.reset(); alertBox.hidden = true; } }

    async function submit(event) {
        event.preventDefault();
        alertBox.hidden = true;
        const payload = Object.fromEntries(new FormData(form));
        try {
            const response = await MsongolaAPI.post(endpoints[page], payload);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuhifadhi.");
            closeModal();
            await load();
        } catch (requestError) {
            alertBox.textContent = requestError.message;
            alertBox.hidden = false;
        }
    }

    async function toggleStatus(event) {
        const button = event.target.closest("[data-status-id]");
        if (!button) return;
        button.disabled = true;
        try {
            const response = await MsongolaAPI.patch(`/admin-catalog/${page}/${button.dataset.statusId}/status`, { status: button.dataset.nextStatus });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kubadilisha status.");
            await load();
        } catch (requestError) {
            error.textContent = requestError.message;
            error.hidden = false;
            button.disabled = false;
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        const role = document.body.dataset.role || "ADMIN";
        if (!await MsongolaAuth.protectPage({ roles: [role] })) return;
        search?.addEventListener("input", render);
        document.getElementById("openCatalogModal")?.addEventListener("click", openModal);
        document.getElementById("closeCatalogModal")?.addEventListener("click", closeModal);
        document.getElementById("cancelCatalogModal")?.addEventListener("click", closeModal);
        form?.addEventListener("submit", submit);
        list?.addEventListener("click", toggleStatus);
        await loadTeacherOptions();
        await loadClassOptions();
        await loadAssignmentOptions();
        await load();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
