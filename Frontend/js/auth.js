/* =========================================================
   MSONGOLA RESULT SYSTEM
   AUTHENTICATION SYSTEM
   FRONTEND V3
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       PAGE CONFIGURATION
    ===================================================== */

    const APPLICATION_ROOT =
        "/msongola-result-system/Frontend";

    const LOGIN_PAGE =
        `${APPLICATION_ROOT}/pages/login.html`;

    const ROLE_PAGES = {
        ADMIN:
            `${APPLICATION_ROOT}/pages/admin/dashboard.html`,

        ACADEMIC_MASTER:
            `${APPLICATION_ROOT}/pages/academic-master/dashboard.html`,

        SUBJECT_TEACHER:
            `${APPLICATION_ROOT}/teacher/dashboard.html`
    };


    /* =====================================================
       CURRENT PAGE
    ===================================================== */

    function getCurrentPage() {
        return window.location.pathname;
    }


    function isLoginPage() {
        return getCurrentPage()
            .toLowerCase()
            .endsWith("/login.html");
    }


    /* =====================================================
       SESSION
    ===================================================== */

    function getToken() {

        if (!window.MsongolaAPI) {
            return null;
        }

        return MsongolaAPI.getToken();
    }


    function getUser() {

        if (!window.MsongolaAPI) {
            return null;
        }

        return MsongolaAPI.getUser();
    }


    function hasSession() {

        const token = getToken();
        const user = getUser();

        return Boolean(token && user);
    }


    function clearSession() {

        if (window.MsongolaAPI) {

            MsongolaAPI.clearAuthentication();

            return;
        }


        sessionStorage.removeItem("msongola_token");
        sessionStorage.removeItem("msongola_user");

        localStorage.removeItem("msongola_token");
        localStorage.removeItem("msongola_user");

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
    }


    /* =====================================================
       LOGIN REDIRECT
    ===================================================== */

    function redirectToLogin() {

        if (isLoginPage()) {
            return;
        }

        window.location.replace(LOGIN_PAGE);
    }


    /* =====================================================
       ROLE NORMALIZATION
    ===================================================== */

    function normalizeRole(role) {

        return String(role || "")
            .trim()
            .toUpperCase();
    }


    /* =====================================================
       REDIRECT USER AFTER LOGIN
       ONLY USED WHEN WE WANT TO SEND USER TO
       THEIR DEFAULT DASHBOARD.
    ===================================================== */

    function redirectByRole(role) {

        const normalizedRole =
            normalizeRole(role);


        if (!normalizedRole) {

            redirectToLogin();

            return;
        }


        const destination =
            ROLE_PAGES[normalizedRole];


        if (!destination) {

            console.error(
                "Unknown user role:",
                normalizedRole
            );

            clearSession();

            redirectToLogin();

            return;
        }


        const currentPath =
            getCurrentPage()
                .toLowerCase();


        const destinationPath =
            destination
                .toLowerCase();


        /*
         * If already on the exact dashboard,
         * do nothing.
         */

        if (currentPath === destinationPath) {
            return;
        }


        /*
         * Otherwise send the user to their
         * role dashboard.
         *
         * This function is NOT called by
         * protectPage() for every normal page.
         */

        window.location.replace(destination);
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    async function login(username, password) {

        if (!username || !password) {

            throw new Error(
                "Username na password vinahitajika."
            );
        }


        const response =
            await MsongolaAPI.login(
                username.trim(),
                password
            );


        if (
            !response ||
            !response.success ||
            !response.data
        ) {

            throw new Error(
                response?.message ||
                "Login imeshindikana."
            );
        }


        const token =
            response.data.token;


        const user =
            response.data.user;


        if (!token || !user) {

            throw new Error(
                "Server haikurudisha session sahihi."
            );
        }


        MsongolaAPI.setAuthentication(
            token,
            user
        );


        return {
            token,
            user
        };
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    function logout() {

        clearSession();

        window.location.replace(
            LOGIN_PAGE
        );
    }


    /* =====================================================
       ROLE CHECK
    ===================================================== */

    function hasRole(allowedRoles) {

        const user =
            getUser();


        if (!user) {
            return false;
        }


        if (!Array.isArray(allowedRoles)) {
            return false;
        }


        const userRole =
            normalizeRole(user.role);


        return allowedRoles
            .map((role) =>
                normalizeRole(role)
            )
            .includes(userRole);
    }


    /* =====================================================
       PROTECT PAGE
       
       IMPORTANT:
       This function DOES NOT redirect an Admin
       from users.html to dashboard.html.

       It only checks whether the current user
       is allowed to access the current page.
    ===================================================== */

    async function protectPage(options = {}) {

        const allowedRoles =
            Array.isArray(options.roles)
                ? options.roles
                : [];


        /*
         * Login page doesn't need protection.
         */

        if (isLoginPage()) {

            return true;
        }


        /*
         * No session.
         */

        if (!hasSession()) {

            redirectToLogin();

            return false;
        }


        /*
         * Check frontend role permission first.
         */

        if (
            allowedRoles.length > 0 &&
            !hasRole(allowedRoles)
        ) {

            const user =
                getUser();


            if (
                user &&
                user.role
            ) {

                /*
                 * User is logged in but
                 * doesn't have permission
                 * for this page.
                 *
                 * Send them to THEIR dashboard.
                 */

                redirectByRole(
                    user.role
                );

            } else {

                redirectToLogin();
            }


            return false;
        }


        /* =================================================
           VERIFY TOKEN WITH BACKEND
        ================================================= */

        try {

            const response =
                await MsongolaAPI.getCurrentUser();


            if (
                !response ||
                !response.success
            ) {

                throw new Error(
                    "Session verification failed."
                );
            }


            /*
             * Backend may return:
             *
             * response.user
             *
             * OR
             *
             * response.data.user
             */

            const backendUser =
                response.user ||
                response.data?.user;


            if (!backendUser) {

                throw new Error(
                    "User information haijapatikana."
                );
            }


            /*
             * Update stored user information.
             */

            const token =
                getToken();


            MsongolaAPI.setAuthentication(
                token,
                backendUser
            );


            /* =============================================
               IMPORTANT FIX
               
               DO NOT call redirectByRole() here
               simply because the current page isn't
               the dashboard.

               Example:
               
               ADMIN opens:
               users.html

               allowedRoles = ["ADMIN"]

               Admin is allowed.

               Therefore:
               STAY ON users.html
            ============================================= */

            if (
                allowedRoles.length > 0 &&
                !allowedRoles
                    .map(role => normalizeRole(role))
                    .includes(
                        normalizeRole(
                            backendUser.role
                        )
                    )
            ) {

                redirectByRole(
                    backendUser.role
                );

                return false;
            }


            /*
             * Everything is okay.
             *
             * Stay on current page.
             */

            return true;

        } catch (error) {

            console.warn(
                "Session verification failed:",
                error.message
            );


            /*
             * Token invalid/expired.
             */

            if (
                error.status === 401 ||
                error.message
                    ?.toLowerCase()
                    .includes("token")
            ) {

                clearSession();

                redirectToLogin();

                return false;
            }


            /*
             * If backend temporarily fails,
             * don't destroy an otherwise valid
             * local session.
             */

            return true;
        }
    }


    /* =====================================================
       LOGOUT BUTTONS
    ===================================================== */

    function initializeLogoutButtons() {

        const buttons =
            document.querySelectorAll(
                "[data-logout]"
            );


        buttons.forEach((button) => {

            button.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    logout();
                }
            );

        });
    }


    /* =====================================================
       LOGIN PAGE PROTECTION
    ===================================================== */

    function protectLoginPage() {

        if (!isLoginPage()) {
            return;
        }


        if (!hasSession()) {
            return;
        }


        const user =
            getUser();


        if (
            !user ||
            !user.role
        ) {

            clearSession();

            return;
        }


        /*
         * Only redirect from LOGIN PAGE
         * to the appropriate dashboard.
         */

        redirectByRole(
            user.role
        );
    }


    /* =====================================================
       PUBLIC AUTH API
    ===================================================== */

    window.MsongolaAuth = {

        login,

        logout,

        clearSession,

        getToken,

        getUser,

        hasSession,

        hasRole,

        protectPage,

        redirectToLogin,

        redirectByRole,

        isLoginPage
    };


    /* =====================================================
       INITIALIZE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeLogoutButtons();

            protectLoginPage();

        }
    );

})();