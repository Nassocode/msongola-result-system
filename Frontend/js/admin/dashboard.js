/* =========================================================
   MSONGOLA SECONDARY SCHOOL
   RESULT MANAGEMENT SYSTEM
   ADMIN DASHBOARD V2
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       DOM HELPERS
       ===================================================== */

    const $ = (selector) => document.querySelector(selector);

    const $$ = (selector) => {
        return Array.from(document.querySelectorAll(selector));
    };


    /* =====================================================
       PAGE STATE
       ===================================================== */

    const state = {
        currentUser: null,
        users: [],
        schoolSettings: null,
        serverOnline: false,
        loading: false
    };


    /* =====================================================
       SAFE TEXT HELPER
       ===================================================== */

    function setText(selector, value, fallback = "—") {
        const element = $(selector);

        if (!element) {
            return;
        }

        element.textContent =
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
                ? value
                : fallback;
    }


    /* =====================================================
       DATE
       ===================================================== */

    function renderCurrentDate() {
        const dateElement = $("#currentDate");

        if (!dateElement) {
            return;
        }

        const now = new Date();

        const formattedDate = new Intl.DateTimeFormat(
            "sw-TZ",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        ).format(now);

        dateElement.textContent = formattedDate;
    }


    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    function renderCurrentYear() {
        setText(
            "#currentYear",
            new Date().getFullYear()
        );
    }


    /* =====================================================
       USER INITIALS
       ===================================================== */

    function getInitials(name) {
        if (!name) {
            return "AD";
        }

        const words = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (words.length === 1) {
            return words[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }


    /* =====================================================
       DISPLAY USER
       ===================================================== */

    function renderCurrentUser(user) {
        if (!user) {
            return;
        }

        state.currentUser = user;

        const username =
            user.username ||
            user.name ||
            "Administrator";

        const displayName =
            user.full_name ||
            user.fullName ||
            user.name ||
            username;

        setText(
            "[data-user-name]",
            displayName,
            username
        );

        setText(
            "[data-user-role]",
            "Administrator"
        );

        const initialsElements =
            $$("[data-user-initials]");

        initialsElements.forEach((element) => {
            element.textContent =
                getInitials(displayName);
        });
    }


    /* =====================================================
       LOAD CURRENT USER
       ===================================================== */

    async function loadCurrentUser() {
        try {
            const response =
                await MsongolaAPI.getCurrentUser();

            if (
                response &&
                response.user
            ) {
                renderCurrentUser(
                    response.user
                );

                return response.user;
            }

            if (
                response &&
                response.data &&
                response.data.user
            ) {
                renderCurrentUser(
                    response.data.user
                );

                return response.data.user;
            }

            const storedUser =
                MsongolaAPI.getUser();

            if (storedUser) {
                renderCurrentUser(
                    storedUser
                );

                return storedUser;
            }

        } catch (error) {
            console.warn(
                "Current user could not be loaded:",
                error.message
            );

            const storedUser =
                MsongolaAPI.getUser();

            if (storedUser) {
                renderCurrentUser(
                    storedUser
                );

                return storedUser;
            }
        }

        return null;
    }


    /* =====================================================
       LOAD USERS
       ===================================================== */

    async function loadUsers() {
        try {
            const response =
                await MsongolaAPI.get("/users");

            let users = [];

            if (
                response &&
                Array.isArray(response.data)
            ) {
                users = response.data;
            } else if (
                response &&
                response.data &&
                Array.isArray(response.data.users)
            ) {
                users = response.data.users;
            } else if (
                response &&
                Array.isArray(response.users)
            ) {
                users = response.users;
            }

            state.users = users;

            renderUserStatistics(users);

            return users;

        } catch (error) {
            console.warn(
                "Users could not be loaded:",
                error.message
            );

            state.users = [];

            renderUserStatistics([]);

            return [];
        }
    }


    /* =====================================================
       USER STATISTICS
       ===================================================== */

    function renderUserStatistics(users) {
        const totalUsers =
            users.length;

        const activeUsers =
            users.filter((user) => {
                return String(
                    user.status || ""
                ).toUpperCase() === "ACTIVE";
            }).length;

        const inactiveUsers =
            users.filter((user) => {
                return String(
                    user.status || ""
                ).toUpperCase() === "INACTIVE";
            }).length;

        setText(
            "#totalUsers",
            totalUsers,
            "0"
        );

        setText(
            "#activeUsers",
            activeUsers,
            "0"
        );

        setText(
            "#inactiveUsers",
            inactiveUsers,
            "0"
        );
    }


    /* =====================================================
       LOAD SCHOOL SETTINGS
       ===================================================== */

    async function loadSchoolSettings() {
        try {
            const response =
                await MsongolaAPI.get(
                    "/school-settings"
                );

            let settings = null;

            if (
                response &&
                response.data &&
                !Array.isArray(response.data)
            ) {
                settings =
                    response.data;
            } else if (
                response &&
                response.settings
            ) {
                settings =
                    response.settings;
            } else if (
                response &&
                response.data &&
                response.data.settings
            ) {
                settings =
                    response.data.settings;
            }

            state.schoolSettings =
                settings;

            renderSchoolSettings(settings);

            return settings;

        } catch (error) {
            console.warn(
                "School settings could not be loaded:",
                error.message
            );

            renderSchoolSettings(null);

            return null;
        }
    }


    /* =====================================================
       SCHOOL SETTINGS DISPLAY
       ===================================================== */

    function renderSchoolSettings(settings) {
        if (!settings) {
            setText(
                "#schoolName",
                "Msongola Secondary School"
            );

            setText(
                "#schoolBox",
                "P.O BOX 104727"
            );

            setText(
                "#schoolMotto",
                "Education is Light"
            );

            setText(
                "#headOfSchool",
                "NASSORO SHEKULAMBA"
            );

            return;
        }

        const schoolName =
            settings.school_name ||
            settings.schoolName ||
            settings.name;

        const schoolBox =
            settings.po_box ||
            settings.poBox ||
            settings.p_o_box ||
            settings.address;

        const motto =
            settings.motto ||
            settings.school_motto ||
            settings.schoolMotto;

        const headOfSchool =
            settings.head_of_school ||
            settings.headOfSchool ||
            settings.headteacher ||
            settings.head_teacher;

        setText(
            "#schoolName",
            schoolName,
            "Msongola Secondary School"
        );

        setText(
            "#schoolBox",
            schoolBox,
            "P.O BOX 104727"
        );

        setText(
            "#schoolMotto",
            motto,
            "Education is Light"
        );

        setText(
            "#headOfSchool",
            headOfSchool,
            "NASSORO SHEKULAMBA"
        );
    }


    /* =====================================================
       SERVER STATUS
       ===================================================== */

    async function checkServerStatus() {
        const statusDot =
            $(".sidebar-system-status .status-dot");

        const statusTitle =
            $(".sidebar-system-status strong");

        const statusDescription =
            $(".sidebar-system-status small");

        const securityStatus =
            $("#securityStatus");

        try {
            const result =
                await MsongolaAPI.checkServer();

            state.serverOnline =
                Boolean(result.online);

            if (result.online) {

                if (statusDot) {
                    statusDot.style.background =
                        "#37c871";
                }

                if (statusTitle) {
                    statusTitle.textContent =
                        "Mfumo uko online";
                }

                if (statusDescription) {
                    statusDescription.textContent =
                        "Server inaendelea vizuri";
                }

                setText(
                    "#securityStatus",
                    "Salama",
                    "Salama"
                );

            } else {

                if (statusDot) {
                    statusDot.style.background =
                        "#f59e0b";
                }

                if (statusTitle) {
                    statusTitle.textContent =
                        "Server haipatikani";
                }

                if (statusDescription) {
                    statusDescription.textContent =
                        "Hakuna mawasiliano na backend";
                }

                setText(
                    "#securityStatus",
                    "Offline",
                    "Offline"
                );
            }

        } catch (error) {

            state.serverOnline = false;

            if (statusDot) {
                statusDot.style.background =
                    "#f59e0b";
            }

            if (statusTitle) {
                statusTitle.textContent =
                    "Server haipatikani";
            }

            if (statusDescription) {
                statusDescription.textContent =
                    "Hakuna mawasiliano na backend";
            }

            setText(
                "#securityStatus",
                "Offline",
                "Offline"
            );
        }
    }


    /* =====================================================
       RECENT ACTIVITIES
       ===================================================== */

    function renderRecentActivities() {
        const container =
            $("#recentActivities");

        if (!container) {
            return;
        }

        /*
         * Audit API bado haijaunganishwa.
         * Kwa sasa tunaonyesha activity ya msingi
         * ya mfumo bila kutengeneza taarifa fake
         * za database.
         */

        container.innerHTML = `
            <div class="activity-empty">
                <i class="fa-regular fa-clock"></i>
                <span>
                    Audit activities zitaonekana hapa
                    baada ya Audit API kuunganishwa.
                </span>
            </div>
        `;
    }


    /* =====================================================
       LOADING STATE
       ===================================================== */

    function showDashboardLoading() {
        state.loading = true;

        const statElements = [
            "#totalUsers",
            "#activeUsers",
            "#inactiveUsers"
        ];

        statElements.forEach((selector) => {
            const element = $(selector);

            if (element) {
                element.textContent = "…";
            }
        });
    }


    function hideDashboardLoading() {
        state.loading = false;
    }


    /* =====================================================
       HANDLE API ERRORS
       ===================================================== */

    function handleApiError(error) {
        if (!error) {
            return;
        }

        if (error.status === 401) {
            MsongolaAuth.clearSession();

            MsongolaAuth.redirectToLogin();

            return;
        }

        if (error.status === 403) {
            console.warn(
                "Admin access denied."
            );

            return;
        }

        console.warn(
            "Dashboard API error:",
            error.message
        );
    }


    /* =====================================================
       REFRESH DASHBOARD
       ===================================================== */

    async function refreshDashboard() {
        if (state.loading) {
            return;
        }

        showDashboardLoading();

        try {

            await Promise.allSettled([
                loadCurrentUser(),
                loadUsers(),
                loadSchoolSettings(),
                checkServerStatus()
            ]);

            renderCurrentDate();

            renderCurrentYear();

            renderRecentActivities();

        } catch (error) {

            console.error(
                "Dashboard refresh failed:",
                error
            );

            handleApiError(error);

        } finally {

            hideDashboardLoading();
        }
    }


    /* =====================================================
       QUICK ACTION SAFETY
       ===================================================== */

    function initializeQuickActions() {
        const quickActions =
            $$(".quick-action");

        quickActions.forEach((action) => {

            action.addEventListener(
                "click",
                (event) => {

                    const href =
                        action.getAttribute("href");

                    if (
                        !href ||
                        href === "#" ||
                        href === "javascript:void(0)"
                    ) {
                        event.preventDefault();
                    }
                }
            );

        });
    }


    /* =====================================================
       PAGE VISIBILITY
       ===================================================== */

    function initializeVisibilityRefresh() {
        document.addEventListener(
            "visibilitychange",
            () => {

                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    renderCurrentDate();
                }

            }
        );
    }


    /* =====================================================
       AUTHENTICATION
       ===================================================== */

    async function initializeAuthentication() {
        if (
            !window.MsongolaAuth ||
            !window.MsongolaAPI
        ) {
            console.error(
                "Msongola authentication system haijapakiwa."
            );

            return false;
        }

        const session =
            await MsongolaAuth.protectPage({
                roles: ["ADMIN"]
            });

        if (!session) {
            return false;
        }

        return true;
    }


    /* =====================================================
       INITIALIZE DASHBOARD
       ===================================================== */

    async function initializeDashboard() {

        const authenticated =
            await initializeAuthentication();

        if (!authenticated) {
            return;
        }

        renderCurrentDate();

        renderCurrentYear();

        initializeQuickActions();

        initializeVisibilityRefresh();

        await refreshDashboard();
    }


    /* =====================================================
       GLOBAL REFRESH ACCESS
       ===================================================== */

    window.MsongolaAdminDashboard = {
        state,

        refresh: refreshDashboard,

        loadUsers,

        loadSchoolSettings,

        loadCurrentUser,

        checkServerStatus
    };


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeDashboard
        );

    } else {

        initializeDashboard();

    }

})();