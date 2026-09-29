(() => {
    "use strict";

    if (document.body.dataset.role === "ACADEMIC_MASTER") {
        import("../academic-master/shared-shell.js").catch((error) => {
            console.error("Academic Master shell could not be loaded:", error);
        });
    }

    const page = document.body.dataset.catalog;
    const role = document.body.dataset.role || "ADMIN";
    const isReadOnlyAssignments = page === "assignments" && role === "ACADEMIC_MASTER";
    const isReadOnlyCoordinators = role === "ACADEMIC_MASTER" && ["classTeachers", "formCoordinators"].includes(page);
    const endpoints = { teachers: "/admin-catalog/teachers", subjects: "/admin-catalog/subjects", classes: "/admin-catalog/classes", assignments: "/admin-catalog/assignments", classTeachers: "/admin-catalog/class-teachers", formCoordinators: "/admin-catalog/form-coordinators" };
    const resourcePaths = { classTeachers: "class-teachers", formCoordinators: "form-coordinators" };
    const list = document.getElementById("catalogList");
    const table = document.getElementById("catalogTable");
    const empty = document.getElementById("catalogEmpty");
    const error = document.getElementById("catalogError");
    const search = document.getElementById("catalogSearch");
    const modal = document.getElementById("catalogModal");
    const form = document.getElementById("catalogForm");
    const alertBox = document.getElementById("catalogAlert");
    let assignmentClassFilter = null;

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
        const visible = records.filter((item) => {
            if (!JSON.stringify(item).toLowerCase().includes(query)) return false;
            if (isReadOnlyAssignments && assignmentClassFilter?.value) {
                return `${item.class_id}:${item.academic_year_id}` === assignmentClassFilter.value;
            }
            return true;
        });
        list.innerHTML = visible.map((item, index) => {
            if (page === "teachers") {
                const name = [item.first_name, item.middle_name, item.last_name].filter(Boolean).join(" ");
                return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(name)}</strong><br><small>${escapeHTML(item.teacher_number || "")}</small></td><td>${escapeHTML(item.username || "-")}</td><td>${escapeHTML(item.phone || "-")}</td><td>${statusControl(item)}</td></tr>`;
            }
            if (page === "subjects") {
                return `<tr><td>${index + 1}</td><td>${escapeHTML(item.subject_code)}</td><td><strong>${escapeHTML(item.subject_name)}</strong></td><td>${statusControl(item)}</td></tr>`;
            }
            if (page === "classTeachers") {
                const classLabel = item.form_name ? `${item.form_name} - ${item.class_name}` : item.class_name;
                const status = isReadOnlyCoordinators ? statusBadge(item.status) : statusControl(item);
                return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(classLabel)}</strong></td><td>${escapeHTML(item.teacher_name)}</td><td>${escapeHTML(item.teacher_number)}</td><td>${escapeHTML(item.academic_year)}</td><td>${status}</td></tr>`;
            }
            if (page === "assignments") {
                const classLabel = item.form_name ? `${item.form_name} - ${item.class_name}` : item.class_name;
                const status = isReadOnlyAssignments ? statusBadge(item.status) : statusControl(item);
                return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(item.teacher_name)}</strong><br><small>${escapeHTML(item.teacher_number || "")}</small></td><td>${escapeHTML(classLabel)}</td><td>${escapeHTML(item.subject_name)}</td><td>${escapeHTML(item.academic_year)}</td><td>${status}</td></tr>`;
            }
            if (page === "formCoordinators") {
                const status = isReadOnlyCoordinators ? statusBadge(item.status) : statusControl(item);
                return `<tr><td>${index + 1}</td><td><strong>${escapeHTML(item.form_name)}</strong></td><td>${escapeHTML(item.teacher_name)}</td><td>${escapeHTML(item.teacher_number)}</td><td>${escapeHTML(item.academic_year)}</td><td>${status}</td></tr>`;
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
            if (isReadOnlyAssignments && assignmentClassFilter) {
                const selectedClass = assignmentClassFilter.value;
                const classes = new Map();
                records.forEach((item) => {
                    const key = `${item.class_id}:${item.academic_year_id}`;
                    classes.set(key, `${item.form_name} - ${item.class_name} (${item.academic_year})`);
                });
                assignmentClassFilter.innerHTML = `<option value="">Madarasa yote</option>${[...classes].map(([id, label]) => `<option value="${escapeHTML(id)}">${escapeHTML(label)}</option>`).join("")}`;
                if (classes.has(selectedClass)) assignmentClassFilter.value = selectedClass;
            }
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
            if (!response?.success) throw new Error(response?.message || "Accounts za Subject Teacher hazikupatikana.");
            const users = Array.isArray(response.data) ? response.data : [];
            select.innerHTML = users.length
                ? `<option value="">Chagua account</option>${users.map((user) => `<option value="${user.id}">${escapeHTML(user.username)}</option>`).join("")}`
                : '<option value="">Hakuna account ambayo haijaunganishwa</option>';
            if (!users.length && error) {
                error.textContent = "Hakuna akaunti mpya ya Subject Teacher ya kuunganisha. Accounts zenye taarifa za mwalimu tayari hazionekani hapa.";
                error.hidden = false;
            }
        } catch (requestError) {
            select.innerHTML = '<option value="">Imeshindikana kupakia accounts</option>';
            if (error) {
                error.textContent = requestError.message || "Imeshindikana kupakia accounts za Subject Teacher.";
                error.hidden = false;
            }
        }
    }

    async function loadClassOptions() {
        if (page !== "classes") return;
        const formSelect = document.getElementById("classFormId");
        const yearSelect = document.getElementById("classYearId");
        const submitButton = form?.querySelector('[type="submit"]');

        try {
            const response = await MsongolaAPI.get("/admin-catalog/classes/options");
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia Form na miaka ya masomo.");

            const forms = Array.isArray(response.data?.forms) ? response.data.forms : [];
            const years = Array.isArray(response.data?.years) ? response.data.years : [];
            if (!forms.length || !years.length) {
                throw new Error("Hakuna Form au mwaka wa masomo unaopatikana. Hakikisha taarifa hizo zimesajiliwa na ziko active.");
            }

            if (formSelect) formSelect.innerHTML = `<option value="">Chagua form</option>${forms.map((item) => `<option value="${item.id}">${escapeHTML(item.form_name)}</option>`).join("")}`;
            if (yearSelect) yearSelect.innerHTML = `<option value="">Chagua mwaka</option>${years.map((item) => `<option value="${item.id}">${escapeHTML(item.year_label)}</option>`).join("")}`;
            if (submitButton) submitButton.disabled = false;
        } catch (requestError) {
            if (formSelect) formSelect.innerHTML = '<option value="">Form hazikupatikana</option>';
            if (yearSelect) yearSelect.innerHTML = '<option value="">Miaka haikupatikana</option>';
            if (submitButton) submitButton.disabled = true;
            if (error) {
                error.textContent = requestError.message || "Imeshindikana kupakia taarifa za madarasa.";
                error.hidden = false;
            }
        }
    }

    async function loadAssignmentOptions() {
        if (page !== "assignments" || isReadOnlyAssignments) return;
        const fill = (id, items, label) => {
            const select = document.getElementById(id);
            if (select) select.innerHTML = `<option value="">Chagua</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(label(item))}</option>`).join("")}`;
        };

        try {
            const response = await MsongolaAPI.get("/admin-catalog/assignments/options");
            if (!response?.success) throw new Error(response?.message || "Assignment options hazikupatikana.");
            const data = response.data || {};
            const teachers = data.teachers || [];
            const teacherSelect = document.getElementById("assignmentTeacher");

            if (teachers.length) {
                fill("assignmentTeacher", teachers, (item) => `${item.teacher_name} (${item.teacher_number})`);
            } else if (teacherSelect) {
                teacherSelect.innerHTML = '<option value="">Hakuna teacher profile iliyosajiliwa</option>';
                error.hidden = false;
                error.textContent = "Subject Teacher account hazijaunganishwa na taarifa za mwalimu. Admin afungue Walimu, achague account, ajaze teacher number na majina, kisha Academic Master arudie hapa.";
            }

            fill("assignmentClass", data.classes || [], (item) => `${item.form_name} - ${item.class_name} (${item.academic_year})`);
            fill("assignmentSubject", data.subjects || [], (item) => `${item.subject_code} - ${item.subject_name}`);
            fill("assignmentYear", data.years || [], (item) => item.year_label);
        } catch (requestError) {
            error.hidden = false;
            error.textContent = requestError.message || "Imeshindikana kupakia walimu, madarasa na masomo.";
        }
    }

    async function loadFormCoordinatorOptions() {
        if (page !== "formCoordinators" || isReadOnlyCoordinators) return;
        const teacherSelect = document.getElementById("coordinatorTeacher");
        const formSelect = document.getElementById("coordinatorForm");
        const yearSelect = document.getElementById("coordinatorYear");
        const fill = (select, items, label) => {
            if (select) select.innerHTML = `<option value="">Chagua</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(label(item))}</option>`).join("")}`;
        };

        try {
            const response = await MsongolaAPI.get(`${endpoints.formCoordinators}/options`);
            if (!response?.success) throw new Error(response?.message || "Chaguo za waratibu hazikupatikana.");
            const data = response.data || {};
            fill(teacherSelect, data.teachers || [], (item) => `${item.teacher_name} (${item.teacher_number})`);
            fill(formSelect, data.forms || [], (item) => item.form_name);
            fill(yearSelect, data.years || [], (item) => item.year_label);
        } catch (requestError) {
            error.textContent = requestError.message || "Imeshindikana kupakia chaguo za waratibu.";
            error.hidden = false;
        }
    }

    async function loadClassTeacherOptions() {
        if (page !== "classTeachers" || isReadOnlyCoordinators) return;
        const teacherSelect = document.getElementById("classTeacher");
        const classSelect = document.getElementById("classTeacherClass");
        const yearSelect = document.getElementById("classTeacherYear");
        const fill = (select, items, label) => {
            if (select) select.innerHTML = `<option value="">Chagua</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(label(item))}</option>`).join("")}`;
        };

        try {
            const response = await MsongolaAPI.get(`${endpoints.classTeachers}/options`);
            if (!response?.success) throw new Error(response?.message || "Chaguo za class teacher hazikupatikana.");
            const data = response.data || {};
            fill(teacherSelect, data.teachers || [], (item) => `${item.teacher_name} (${item.teacher_number})`);
            fill(classSelect, data.classes || [], (item) => `${item.form_name} - ${item.class_name} (${item.academic_year})`);
            fill(yearSelect, data.years || [], (item) => item.year_label);
            classSelect?.addEventListener("change", () => {
                const selectedClass = data.classes?.find((item) => String(item.id) === classSelect.value);
                if (selectedClass && yearSelect) yearSelect.value = String(selectedClass.academic_year_id);
            });
        } catch (requestError) {
            error.textContent = requestError.message || "Imeshindikana kupakia chaguo za class teacher.";
            error.hidden = false;
        }
    }

    function openModal() { if (modal) modal.hidden = false; }
    function closeModal() { if (modal) { modal.hidden = true; form?.reset(); alertBox.hidden = true; } }

    function initializeAdminSidebar() {
        const sidebar = document.getElementById("sidebar");
        const toggle = document.getElementById("sidebarToggle");
        const close = document.getElementById("sidebarClose");
        const overlay = document.getElementById("sidebarOverlay");
        if (!sidebar) return;

        const setOpen = (open) => {
            sidebar.classList.toggle("open", open);
            overlay?.classList.toggle("active", open);
            toggle?.setAttribute("aria-expanded", String(open));
        };

        toggle?.addEventListener("click", () => setOpen(!sidebar.classList.contains("open")));
        close?.addEventListener("click", () => setOpen(false));
        overlay?.addEventListener("click", () => setOpen(false));
        sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setOpen(false);
        });
    }

    async function submit(event) {
        if (isReadOnlyAssignments || isReadOnlyCoordinators) return;
        event.preventDefault();
        alertBox.hidden = true;
        const payload = Object.fromEntries(new FormData(form));
        const submitButton = form.querySelector('[type="submit"]');
        const submitLabel = submitButton?.textContent.trim() || "Hifadhi";
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Inahifadhi...";
        }
        try {
            const response = await MsongolaAPI.post(endpoints[page], payload);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuhifadhi.");
            closeModal();
            await load();
        } catch (requestError) {
            alertBox.textContent = requestError.message;
            alertBox.hidden = false;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitLabel;
            }
        }
    }

    async function toggleStatus(event) {
        if (isReadOnlyAssignments || isReadOnlyCoordinators) return;
        const button = event.target.closest("[data-status-id]");
        if (!button) return;
        button.disabled = true;
        try {
            const resource = resourcePaths[page] || page;
            const response = await MsongolaAPI.patch(`/admin-catalog/${resource}/${button.dataset.statusId}/status`, { status: button.dataset.nextStatus });
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
        initializeAdminSidebar();
        if (isReadOnlyAssignments || isReadOnlyCoordinators) {
            document.getElementById("openCatalogModal")?.remove();
            modal?.remove();
            const description = document.querySelector(".catalog-header p");
            if (description && isReadOnlyAssignments) description.textContent = "Chagua darasa kuona walimu waliopangiwa masomo.";
            if (description && isReadOnlyCoordinators && page === "classTeachers") description.textContent = "Orodha ya walimu waratibu waliowekwa kwa kila darasa maalum.";
            if (description && isReadOnlyCoordinators && page === "formCoordinators") description.textContent = "Orodha ya waratibu waliowekwa kwa Form nzima na mwaka wa masomo.";
        }
        if (isReadOnlyAssignments) {
            assignmentClassFilter = document.createElement("select");
            assignmentClassFilter.id = "assignmentClassFilter";
            assignmentClassFilter.setAttribute("aria-label", "Chuja assignments kwa darasa");
            assignmentClassFilter.innerHTML = '<option value="">Madarasa yote</option>';
            search?.insertAdjacentElement("afterend", assignmentClassFilter);
            assignmentClassFilter.addEventListener("change", render);
        }
        search?.addEventListener("input", render);
        if (!isReadOnlyAssignments && !isReadOnlyCoordinators) {
            document.getElementById("openCatalogModal")?.addEventListener("click", openModal);
            document.getElementById("closeCatalogModal")?.addEventListener("click", closeModal);
            document.getElementById("cancelCatalogModal")?.addEventListener("click", closeModal);
            form?.addEventListener("submit", submit);
        }
        list?.addEventListener("click", toggleStatus);
        await load();
        await loadTeacherOptions();
        await loadClassOptions();
        await loadAssignmentOptions();
        await loadClassTeacherOptions();
        await loadFormCoordinatorOptions();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
