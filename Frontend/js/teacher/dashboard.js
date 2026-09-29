(() => {
    "use strict";

    const elements = {
        welcome: document.getElementById("teacherWelcome"),
        sidebarUsername: document.getElementById("sidebarUsername"),
        sidebarAvatar: document.getElementById("sidebarAvatar"),
        assignments: document.getElementById("teacherAssignments"),
        drafts: document.getElementById("teacherDrafts"),
        submitted: document.getElementById("teacherSubmitted"),
        approved: document.getElementById("teacherApproved"),
        summaryAssignments: document.getElementById("summaryAssignments"),
        summaryDrafts: document.getElementById("summaryDrafts"),
        summarySubmitted: document.getElementById("summarySubmitted"),
        summaryApproved: document.getElementById("summaryApproved"),
        assignmentSummary: document.getElementById("assignmentSummary"),
        body: document.getElementById("teacherAssignmentsBody"),
        empty: document.getElementById("teacherAssignmentsEmpty"),
        notificationList: document.getElementById("dashboardNotificationList"),
        notificationsEmpty: document.getElementById("dashboardNotificationsEmpty"),
        notificationCount: document.getElementById("dashboardNotificationCount"),
        refresh: document.getElementById("refreshTeacherDashboard"),
        logout: document.getElementById("logoutBtn"),
        sidebar: document.getElementById("sidebar"),
        sidebarToggle: document.getElementById("sidebarToggle"),
        sidebarClose: document.getElementById("sidebarClose"),
        sidebarOverlay: document.getElementById("sidebarOverlay"),
        error: document.getElementById("dashboardError")
    };

    function escapeHTML(value) {
        const container = document.createElement("div");
        container.textContent = value ?? "";
        return container.innerHTML;
    }

    function getInitials(name) {
        if (!name) return "T";
        const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
        const initials = words.map((part) => part.charAt(0).toUpperCase()).join("");
        return initials || "T";
    }

    function setText(element, value) {
        if (element) element.textContent = String(value ?? 0);
    }

    function setStatusClass(status) {
        const normalized = String(status || "ACTIVE").toUpperCase();
        const map = {
            ACTIVE: "status-active",
            DRAFT: "status-draft",
            SUBMITTED: "status-submitted",
            APPROVED: "status-approved",
            RETURNED: "status-returned"
        };
        return map[normalized] || "status-active";
    }

    function showError(message) {
        if (!elements.error) return;
        elements.error.textContent = message || "Imeshindikana kupakia dashboard.";
        elements.error.classList.add("show");
    }

    function hideError() {
        if (!elements.error) return;
        elements.error.textContent = "";
        elements.error.classList.remove("show");
    }

    function renderAssignments(assignments) {
        const items = Array.isArray(assignments) ? assignments : [];
        elements.body.innerHTML = items.map((assignment) => `
            <tr>
                <td>${escapeHTML(assignment.class_name || "-")}</td>
                <td>${escapeHTML(assignment.subject_name || "-")}</td>
                <td>${escapeHTML(assignment.academic_year || "-")}</td>
                <td><span class="status-pill ${setStatusClass(assignment.status)}">${escapeHTML(assignment.status || "ACTIVE")}</span></td>
            </tr>
        `).join("");

        elements.empty.hidden = items.length > 0;
        elements.assignmentSummary.textContent = `${items.length} active`;
    }

    function renderNotifications(notifications) {
        const items = Array.isArray(notifications) ? notifications : [];
        const unreadCount = items.filter((notification) => !Boolean(notification.is_read)).length;
        elements.notificationCount.textContent = `${unreadCount} mpya`;
        elements.notificationsEmpty.hidden = items.length > 0;
        elements.notificationList.innerHTML = items.slice(0, 5).map((notification) => {
            const date = new Date(notification.created_at);
            const formattedDate = Number.isNaN(date.getTime())
                ? notification.created_at || "Hivi karibuni"
                : date.toLocaleString("sw-TZ", { dateStyle: "medium", timeStyle: "short" });
            return `
                <li class="dashboard-notification-item ${Boolean(notification.is_read) ? "" : "unread"}">
                    <strong>${escapeHTML(notification.title || "Arifa")}</strong>
                    <p>${escapeHTML(notification.message || "")}</p>
                    <time>${escapeHTML(formattedDate)}</time>
                </li>
            `;
        }).join("");
    }

    async function loadNotifications() {
        try {
            const response = await MsongolaAPI.get("/notifications");
            if (!response?.success) throw new Error(response?.message || "Arifa hazipatikani.");
            renderNotifications(response.data?.notifications || []);
        } catch (error) {
            elements.notificationList.innerHTML = "";
            elements.notificationsEmpty.hidden = false;
            elements.notificationsEmpty.textContent = error.message || "Arifa hazikupatikana.";
            elements.notificationCount.textContent = "";
        }
    }

    async function loadDashboard() {
        hideError();

        try {
            const response = await MsongolaAPI.get("/teacher/dashboard");

            if (!response || !response.success) {
                throw new Error(response?.message || "Dashboard haipatikani.");
            }

            const data = response.data || {};
            const teacher = data.teacher || {};
            const statistics = data.statistics || {};
            const assignments = Array.isArray(data.assignments) ? data.assignments : [];
            const displayName = [teacher.first_name, teacher.middle_name, teacher.last_name].filter(Boolean).join(" ") || MsongolaAuth.getUser()?.username || "Teacher";

            elements.welcome.textContent = `Karibu, ${displayName}.`;
            elements.sidebarUsername.textContent = displayName;
            elements.sidebarAvatar.textContent = getInitials(displayName);

            setText(elements.assignments, statistics.assignments ?? assignments.length);
            setText(elements.drafts, statistics.draft_submissions ?? 0);
            setText(elements.submitted, statistics.submitted_submissions ?? 0);
            setText(elements.approved, statistics.approved_submissions ?? 0);

            setText(elements.summaryAssignments, statistics.assignments ?? assignments.length);
            setText(elements.summaryDrafts, statistics.draft_submissions ?? 0);
            setText(elements.summarySubmitted, statistics.submitted_submissions ?? 0);
            setText(elements.summaryApproved, statistics.approved_submissions ?? 0);

            renderAssignments(assignments);
            await loadNotifications();
        } catch (error) {
            showError(error.message || "Imeshindikana kupakia dashboard.");
            elements.body.innerHTML = "";
            elements.empty.hidden = false;
            elements.empty.textContent = error.message || "Imeshindikana kupakia dashboard.";
            elements.assignmentSummary.textContent = "0 active";
        }
    }

    async function initialize() {
        const allowed = await MsongolaAuth.protectPage({ roles: ["SUBJECT_TEACHER"] });
        if (!allowed) return;

        const setSidebarOpen = (open) => {
            elements.sidebar?.classList.toggle("open", open);
            elements.sidebarOverlay?.classList.toggle("active", open);
            elements.sidebarToggle?.setAttribute("aria-expanded", String(open));
        };

        elements.sidebarToggle?.addEventListener("click", () => {
            setSidebarOpen(!elements.sidebar?.classList.contains("open"));
        });
        elements.sidebarClose?.addEventListener("click", () => setSidebarOpen(false));
        elements.sidebarOverlay?.addEventListener("click", () => setSidebarOpen(false));

        elements.refresh?.addEventListener("click", loadDashboard);
        elements.logout?.addEventListener("click", () => MsongolaAuth.logout());

        await loadDashboard();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
