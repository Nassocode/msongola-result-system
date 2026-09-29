(() => {
    "use strict";

    const rows = document.getElementById("classesRows");
    const errorBox = document.getElementById("pageError");
    const emptyState = document.getElementById("emptyState");
    const assignmentCount = document.getElementById("assignmentCount");
    const logoutButton = document.getElementById("logoutButton");

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function showError(message) {
        if (!errorBox) return;
        errorBox.textContent = message || "Imeshindikana kupakia darasa zako.";
        errorBox.classList.add("show");
    }

    function hideError() {
        if (!errorBox) return;
        errorBox.textContent = "";
        errorBox.classList.remove("show");
    }

    async function loadAssignments() {
        try {
            hideError();
            const response = await MsongolaAPI.get("/teacher/dashboard");
            if (!response || !response.success) {
                throw new Error(response?.message || "Assignments hazipatikani.");
            }

            const assignments = Array.isArray(response.data?.assignments) ? response.data.assignments : [];
            if (assignmentCount) assignmentCount.textContent = `${assignments.length}`;

            rows.innerHTML = assignments.map((assignment) => `
                <tr>
                    <td>${escapeHTML(assignment.class_name || "-")}</td>
                    <td>${escapeHTML(assignment.subject_name || "-")}</td>
                    <td>${escapeHTML(assignment.academic_year || "-")}</td>
                    <td><span class="status-pill status-active">${escapeHTML(assignment.status || "ACTIVE")}</span></td>
                </tr>
            `).join("");

            emptyState.hidden = assignments.length > 0;
        } catch (error) {
            rows.innerHTML = "";
            emptyState.hidden = false;
            emptyState.textContent = error.message || "Imeshindikana kupakia darasa zako.";
            showError(error.message || "Imeshindikana kupakia darasa zako.");
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        const allowed = await MsongolaAuth.protectPage({ roles: ["SUBJECT_TEACHER"] });
        if (!allowed) return;

        logoutButton?.addEventListener("click", () => MsongolaAuth.logout());
        await loadAssignments();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
