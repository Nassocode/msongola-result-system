/* =========================================================
   MSONGOLA RESULT SYSTEM
   ACADEMIC MASTER DASHBOARD
   ========================================================= */

(() => {
    "use strict";

    const state = {
        dashboardData: null,
        currentUser: null
    };

    function setText(id, value, fallback = "0") {
        const element = document.getElementById(id);

        if (!element) {
            return;
        }

        const cleanValue =
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
                ? String(value)
                : String(fallback);

        element.textContent = cleanValue;
    }

    function getInitials(name) {
        if (!name) {
            return "AM";
        }

        const words = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 0) {
            return "AM";
        }

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }

    function renderCurrentUser(user) {
        if (!user) {
            return;
        }

        state.currentUser = user;

        const username = user.username || user.name || "Academic Master";
        const displayName = user.full_name || user.fullName || user.name || username;
        const initials = getInitials(displayName);

        const sidebarUsername = document.getElementById("sidebarUsername");
        const topbarUsername = document.getElementById("topbarUsername");
        const welcomeUsername = document.getElementById("welcomeUsername");
        const sidebarAvatar = document.getElementById("sidebarAvatar");
        const topbarAvatar = document.getElementById("topbarAvatar");

        if (sidebarUsername) {
            sidebarUsername.textContent = displayName;
        }

        if (topbarUsername) {
            topbarUsername.textContent = displayName;
        }

        if (welcomeUsername) {
            welcomeUsername.textContent = displayName;
        }

        if (sidebarAvatar) {
            sidebarAvatar.textContent = initials;
        }

        if (topbarAvatar) {
            topbarAvatar.textContent = initials;
        }
    }

    function openSidebar() {
        const sidebar = document.getElementById("sidebar");
        const sidebarOverlay = document.getElementById("sidebarOverlay");

        if (sidebar) {
            sidebar.classList.add("sidebar-open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("active");
        }

        document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
        const sidebar = document.getElementById("sidebar");
        const sidebarOverlay = document.getElementById("sidebarOverlay");

        if (sidebar) {
            sidebar.classList.remove("sidebar-open");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }

        document.body.style.overflow = "";
    }

    function initializeSidebar() {
        const menuToggle = document.getElementById("menuToggle");
        const sidebarClose = document.getElementById("sidebarClose");
        const sidebarOverlay = document.getElementById("sidebarOverlay");

        if (menuToggle) {
            menuToggle.addEventListener("click", openSidebar);
        }

        if (sidebarClose) {
            sidebarClose.addEventListener("click", closeSidebar);
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener("click", closeSidebar);
        }

        document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 900) {
                    closeSidebar();
                }
            });
        });
    }

    function updateCurrentDate() {
        const currentDate = document.getElementById("currentDate");

        if (!currentDate) {
            return;
        }

        const now = new Date();
        const formattedDate = new Intl.DateTimeFormat("sw-TZ", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(now);

        currentDate.textContent = formattedDate;
    }

    function updateCurrentYear() {
        const currentYear = document.getElementById("currentYear");

        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }
    }

    function updateSubmissionProgress(submitted, total) {
        const safeSubmitted = Number(submitted) || 0;
        const safeTotal = Number(total) || 0;

        let percentage = 0;

        if (safeTotal > 0) {
            percentage = Math.round((safeSubmitted / safeTotal) * 100);
        }

        if (percentage > 100) {
            percentage = 100;
        }

        setText("submissionPercentage", `${percentage}%`, "0%");
        setText("submissionCount", `${safeSubmitted} / ${safeTotal}`, "0 / 0");

        const progress = document.getElementById("submissionProgress");

        if (progress) {
            progress.style.width = `${percentage}%`;
        }
    }

    function renderSchoolInformation(school) {
        const headerSchoolNames = document.querySelectorAll(".topbar-school-name");

        if (headerSchoolNames.length > 0) {
            const schoolName =
                school?.school_name ||
                school?.schoolName ||
                "MSONGOLA SECONDARY SCHOOL";

            headerSchoolNames.forEach((element) => {
                element.textContent = schoolName;
            });
        }
    }

    function renderDashboardData(data) {
        const dashboard = data || {};
        const submissions = dashboard.submissions || {};

        const students = Number(dashboard.students || 0);
        const teachers = Number(dashboard.teachers || 0);
        const classes = Number(dashboard.classes || 0);
        const subjects = Number(dashboard.subjects || 0);

        const pendingSubmissions = Number(submissions.draft || 0) + Number(submissions.submitted || 0);
        const approvedSubmissions = Number(submissions.approved || 0);
        const returnedSubmissions = Number(submissions.returned || 0);
        const totalEntries = Number(submissions.total || 0);
        const processedEntries = approvedSubmissions + returnedSubmissions + Number(submissions.submitted || 0);

        setText("totalStudents", students, "0");
        setText("totalTeachers", teachers, "0");
        setText("totalClasses", classes, "0");
        setText("totalSubjects", subjects, "0");

        setText("pendingSubmissions", pendingSubmissions, "0");
        setText("approvedSubmissions", approvedSubmissions, "0");
        setText("returnedSubmissions", returnedSubmissions, "0");

        setText("pendingActionCount", pendingSubmissions, "0");
        setText("pendingBadge", pendingSubmissions, "0");

        updateSubmissionProgress(processedEntries, totalEntries || Math.max(processedEntries, pendingSubmissions));

        const progressElement = document.getElementById("submissionProgress");
        if (progressElement && totalEntries === 0) {
            progressElement.style.width = "0%";
        }
    }

    async function loadSchoolInformation() {
        try {
            const response = await MsongolaAPI.get("/school-settings");

            if (!response || !response.success) {
                return;
            }

            const settings = response.data || response.settings || response.school || {};
            renderSchoolInformation(settings);
        } catch (error) {
            console.warn("School settings could not be loaded:", error.message);
        }
    }

    async function loadDashboardStats() {
        try {
            const response = await MsongolaAPI.get("/academic-master/dashboard");

            if (!response || !response.success) {
                throw new Error(response?.message || "Dashboard data is unavailable");
            }

            state.dashboardData = response.data || {};
            renderDashboardData(state.dashboardData);

        } catch (error) {
            console.error("Dashboard load error:", error);

            setText("totalStudents", "0");
            setText("totalTeachers", "0");
            setText("totalClasses", "0");
            setText("totalSubjects", "0");
            setText("pendingSubmissions", "0");
            setText("approvedSubmissions", "0");
            setText("returnedSubmissions", "0");
            setText("pendingActionCount", "0");
            setText("pendingBadge", "0");
            setText("submissionPercentage", "0%");
            setText("submissionCount", "0 / 0");

            const progress = document.getElementById("submissionProgress");
            if (progress) {
                progress.style.width = "0%";
            }
        }
    }

    function initializeLogout() {
        const logoutBtn = document.getElementById("logoutBtn");

        if (!logoutBtn) {
            return;
        }

        logoutBtn.addEventListener("click", () => {
            const confirmed = window.confirm("Unataka kutoka kwenye mfumo?");

            if (!confirmed) {
                return;
            }

            MsongolaAuth.logout();
        });
    }

    function initializeNotificationButton() {
        const notificationBtn = document.getElementById("notificationBtn");

        if (!notificationBtn) {
            return;
        }

        notificationBtn.addEventListener("click", () => {
            window.location.href = "notifications.html";
        });
    }

    async function loadNotificationCount() {
        try {
            const response = await MsongolaAPI.get("/notifications");
            if (!response?.success) return;
            const badge = document.querySelector(".notification-badge");
            if (badge) {
                const unread = Number(response.data?.unread_count || 0);
                badge.textContent = unread > 99 ? "99+" : String(unread);
                badge.style.display = unread === 0 ? "none" : "flex";
            }
        } catch (error) {
            console.warn("Notification count could not be loaded:", error.message);
        }
    }

    function initializeResponsiveActions() {
        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                closeSidebar();
            }
        });
    }

    async function initializeDashboard() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) {
            console.error("Shared auth/API system is not loaded.");
            return;
        }

        const sessionAllowed = await MsongolaAuth.protectPage({
            roles: ["ACADEMIC_MASTER"]
        });

        if (!sessionAllowed) {
            return;
        }

        const currentUser = MsongolaAuth.getUser();

        if (currentUser) {
            renderCurrentUser(currentUser);
        }

        updateCurrentDate();
        updateCurrentYear();
        initializeSidebar();
        initializeLogout();
        initializeNotificationButton();
        initializeResponsiveActions();

        await Promise.all([
            loadDashboardStats(),
            loadSchoolInformation(),
            loadNotificationCount()
        ]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeDashboard);
    } else {
        initializeDashboard();
    }
})();