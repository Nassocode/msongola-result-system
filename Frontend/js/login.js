/* =========================================================
   MSONGOLA SECONDARY SCHOOL
   RESULT MANAGEMENT SYSTEM
   LOGIN CONTROLLER — FRONTEND V3
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       DOM ELEMENTS
       ===================================================== */

    const form =
        document.getElementById("loginForm");

    const usernameInput =
        document.getElementById("username");

    const passwordInput =
        document.getElementById("password");

    const rememberMe =
        document.getElementById("rememberMe");

    const loginButton =
        document.getElementById("loginBtn");

    const loginButtonText =
        document.getElementById("loginBtnText");

    const loginButtonIcon =
        document.getElementById("loginBtnIcon");

    const loginButtonLoader =
        document.getElementById("loginBtnLoader");

    const togglePassword =
        document.getElementById("togglePassword");

    const passwordToggleIcon =
        document.getElementById("passwordToggleIcon");

    const loginError =
        document.getElementById("loginError");

    const errorText =
        document.getElementById("errorText");

    const closeLoginError =
        document.getElementById("closeLoginError");

    const usernameError =
        document.getElementById("usernameError");

    const passwordError =
        document.getElementById("passwordError");


    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const DEFAULT_ERROR_MESSAGE =
        "Username au password sio sahihi.";

    let isSubmitting = false;


    /* =====================================================
       ROLE DASHBOARD PATHS
       ===================================================== */

    const ROLE_DASHBOARDS = {

        ADMIN:
            "/msongola-result-system/Frontend/pages/admin/dashboard.html",

        ACADEMIC_MASTER:
            "/msongola-result-system/Frontend/pages/academic-master/dashboard.html",

        SUBJECT_TEACHER:
            "/msongola-result-system/Frontend/teacher/dashboard.html"

    };


    /* =====================================================
       CHECK SERVICES
       ===================================================== */

    function checkServices() {

        if (!window.MsongolaAPI) {

            console.error(
                "MsongolaAPI haijapatikana."
            );

            showError(
                "Mfumo wa API haujapakiwa. Tafadhali refresh page."
            );

            return false;
        }


        if (!window.MsongolaAuth) {

            console.error(
                "MsongolaAuth haijapatikana."
            );

            showError(
                "Authentication service haijapakiwa. Tafadhali refresh page."
            );

            return false;
        }


        return true;
    }


    /* =====================================================
       REDIRECT BY ROLE
       ===================================================== */

    function redirectToDashboard(role) {

        if (!role) {

            console.error(
                "User role haijapatikana."
            );

            showError(
                "Role ya akaunti haijapatikana."
            );

            return;
        }


        const normalizedRole =
            String(role)
                .trim()
                .toUpperCase();


        const destination =
            ROLE_DASHBOARDS[normalizedRole];


        if (!destination) {

            console.error(
                "Unknown user role:",
                normalizedRole
            );

            MsongolaAPI.clearAuthentication();

            showError(
                "Role ya akaunti hii haitambuliwi na mfumo."
            );

            return;
        }


        console.log(
            `🚀 Redirecting ${normalizedRole} to dashboard...`
        );


        window.location.replace(
            destination
        );
    }


    /* =====================================================
       CHECK EXISTING SESSION
       ===================================================== */

    async function checkExistingSession() {

        if (!window.MsongolaAuth) {
            return;
        }


        /*
         * Kama hakuna token/user,
         * hakuna session ya ku-check.
         */

        if (!window.MsongolaAuth.hasSession()) {

            return;
        }


        console.log(
            "🔎 Existing session found. Verifying..."
        );


        try {

            const response =
                await window.MsongolaAPI.getCurrentUser();


            if (
                response &&
                response.success
            ) {

                const backendUser =
                    response.user ||
                    response.data?.user;


                if (
                    backendUser &&
                    backendUser.role
                ) {

                    /*
                     * Refresh stored user information.
                     */

                    const token =
                        window.MsongolaAPI.getToken();


                    window.MsongolaAPI
                        .setAuthentication(
                            token,
                            backendUser
                        );


                    /*
                     * User tayari ameingia.
                     * Mpeleke dashboard yake.
                     */

                    redirectToDashboard(
                        backendUser.role
                    );
                }

            }

        } catch (error) {

            console.warn(
                "Existing session verification failed:",
                error.message
            );


            /*
             * Session invalid.
             * Clear it and remain on login page.
             */

            if (
                error.status === 401
            ) {

                window.MsongolaAPI
                    .clearAuthentication();
            }
        }
    }


    /* =====================================================
       FORM VALIDATION
       ===================================================== */

    function validateForm() {

        let isValid = true;

        clearFieldErrors();


        const username =
            usernameInput?.value.trim() || "";


        const password =
            passwordInput?.value || "";


        /* -----------------------------------------------
           Username
           ----------------------------------------------- */

        if (!username) {

            showFieldError(
                usernameInput,
                usernameError,
                "Weka username yako."
            );

            isValid = false;

        } else if (username.length < 2) {

            showFieldError(
                usernameInput,
                usernameError,
                "Username lazima iwe na angalau herufi 2."
            );

            isValid = false;
        }


        /* -----------------------------------------------
           Password
           ----------------------------------------------- */

        if (!password) {

            showFieldError(
                passwordInput,
                passwordError,
                "Weka password yako."
            );

            isValid = false;
        }


        return isValid;
    }


    /* =====================================================
       FIELD ERROR
       ===================================================== */

    function showFieldError(
        input,
        errorElement,
        message
    ) {

        if (input) {

            input.classList.add(
                "input-error"
            );
        }


        if (errorElement) {

            errorElement.textContent =
                message;

            errorElement.classList.add(
                "is-visible"
            );
        }
    }


    /* =====================================================
       CLEAR FIELD ERRORS
       ===================================================== */

    function clearFieldErrors() {

        if (usernameInput) {

            usernameInput.classList.remove(
                "input-error"
            );
        }


        if (passwordInput) {

            passwordInput.classList.remove(
                "input-error"
            );
        }


        if (usernameError) {

            usernameError.textContent = "";

            usernameError.classList.remove(
                "is-visible"
            );
        }


        if (passwordError) {

            passwordError.textContent = "";

            passwordError.classList.remove(
                "is-visible"
            );
        }
    }


    /* =====================================================
       SHOW LOGIN ERROR
       ===================================================== */

    function showError(message) {

        if (errorText) {

            errorText.textContent =
                message ||
                DEFAULT_ERROR_MESSAGE;
        }


        if (loginError) {

            loginError.hidden = false;

            loginError.classList.add(
                "is-visible"
            );
        }
    }


    /* =====================================================
       HIDE LOGIN ERROR
       ===================================================== */

    function hideError() {

        if (loginError) {

            loginError.hidden = true;

            loginError.classList.remove(
                "is-visible"
            );
        }


        if (errorText) {

            errorText.textContent = "";
        }
    }


    /* =====================================================
       PASSWORD VISIBILITY
       ===================================================== */

    function togglePasswordVisibility() {

        if (!passwordInput) {
            return;
        }


        const isPassword =
            passwordInput.type === "password";


        passwordInput.type =
            isPassword
                ? "text"
                : "password";


        if (passwordToggleIcon) {

            passwordToggleIcon.className =
                isPassword
                    ? "fa-solid fa-eye-slash"
                    : "fa-solid fa-eye";
        }


        if (togglePassword) {

            togglePassword.setAttribute(
                "aria-label",
                isPassword
                    ? "Ficha password"
                    : "Onyesha password"
            );


            togglePassword.setAttribute(
                "aria-pressed",
                String(isPassword)
            );
        }
    }


    /* =====================================================
       LOGIN BUTTON LOADING
       ===================================================== */

    function setLoginLoading(isLoading) {

        isSubmitting =
            isLoading;


        if (!loginButton) {
            return;
        }


        loginButton.disabled =
            isLoading;


        if (isLoading) {

            if (loginButtonText) {

                loginButtonText.textContent =
                    "Inaingia...";
            }


            if (loginButtonIcon) {

                loginButtonIcon.hidden =
                    true;
            }


            if (loginButtonLoader) {

                loginButtonLoader.hidden =
                    false;
            }

        } else {

            if (loginButtonText) {

                loginButtonText.textContent =
                    "Ingia kwenye mfumo";
            }


            if (loginButtonIcon) {

                loginButtonIcon.hidden =
                    false;
            }


            if (loginButtonLoader) {

                loginButtonLoader.hidden =
                    true;
            }
        }
    }


    /* =====================================================
       SUCCESS MESSAGE
       ===================================================== */

    function showSuccessMessage(message) {

        if (
            window.MsongolaApp &&
            typeof window.MsongolaApp.showToast ===
                "function"
        ) {

            window.MsongolaApp.showToast(
                message,
                "success",
                1500
            );
        }
    }


    /* =====================================================
       HANDLE LOGIN
       ===================================================== */

    async function handleLogin(event) {

        event.preventDefault();


        /*
         * Prevent double submit.
         */

        if (isSubmitting) {
            return;
        }


        hideError();

        clearFieldErrors();


        /* -----------------------------------------------
           Validate
           ----------------------------------------------- */

        if (!validateForm()) {
            return;
        }


        /* -----------------------------------------------
           Check services
           ----------------------------------------------- */

        if (!checkServices()) {
            return;
        }


        /* -----------------------------------------------
           Get credentials
           ----------------------------------------------- */

        const username =
            usernameInput.value.trim();


        const password =
            passwordInput.value;


        setLoginLoading(true);


        try {

            console.log(
                "🔐 Login request started..."
            );


            /* -------------------------------------------
               Call backend
               ------------------------------------------- */

            const response =
                await window.MsongolaAPI.login(
                    username,
                    password
                );


            console.log(
                "✅ Login response:",
                response
            );


            /* -------------------------------------------
               Check response
               ------------------------------------------- */

            if (
                !response ||
                !response.success
            ) {

                throw new Error(
                    response?.message ||
                    DEFAULT_ERROR_MESSAGE
                );
            }


            /* -------------------------------------------
               Extract authentication data
               ------------------------------------------- */

            const authData =
                response.data || {};


            const token =
                authData.token;


            const user =
                authData.user;


            /* -------------------------------------------
               Validate token/user
               ------------------------------------------- */

            if (!token || !user) {

                console.error(
                    "Invalid login response:",
                    response
                );

                throw new Error(
                    "Server imerudisha taarifa za login zisizo kamili."
                );
            }


            /* -------------------------------------------
               Validate role
               ------------------------------------------- */

            const allowedRoles = [

                "ADMIN",

                "ACADEMIC_MASTER",

                "SUBJECT_TEACHER"

            ];


            const normalizedRole =
                String(user.role)
                    .trim()
                    .toUpperCase();


            if (
                !allowedRoles.includes(
                    normalizedRole
                )
            ) {

                console.error(
                    "Unknown role:",
                    user.role
                );


                window.MsongolaAPI
                    .clearAuthentication();


                throw new Error(
                    "Role ya akaunti hii haijatambuliwa na mfumo."
                );
            }


            /* -------------------------------------------
               SAVE SESSION
               ------------------------------------------- */

            /*
             * IMPORTANT:
             *
             * Hatutumii:
             *
             * MsongolaAuth.saveSession()
             *
             * kwa sababu function hiyo haipo kwenye
             * auth.js yetu.
             *
             * Tunatumia:
             *
             * MsongolaAPI.setAuthentication()
             */

            window.MsongolaAPI
                .setAuthentication(
                    token,
                    {
                        id:
                            user.id,

                        username:
                            user.username,

                        role:
                            normalizedRole
                    }
                );


            console.log(
                "💾 Session saved successfully."
            );


            /* -------------------------------------------
               Remember Me
               ------------------------------------------- */

            if (
                rememberMe &&
                rememberMe.checked
            ) {

                sessionStorage.setItem(
                    "msongola_remember_preference",
                    "true"
                );

            } else {

                sessionStorage.removeItem(
                    "msongola_remember_preference"
                );
            }


            /* -------------------------------------------
               Success
               ------------------------------------------- */

            showSuccessMessage(
                "Login imefanikiwa. Karibu kwenye mfumo."
            );


            console.log(
                `👤 Logged in as ${normalizedRole}`
            );


            /* -------------------------------------------
               Redirect
               ------------------------------------------- */

            setTimeout(() => {

                redirectToDashboard(
                    normalizedRole
                );

            }, 400);


        } catch (error) {

            console.error(
                "❌ Login failed:",
                error
            );


            let message =
                DEFAULT_ERROR_MESSAGE;


            if (
                error &&
                error.message
            ) {

                message =
                    error.message;
            }


            /*
             * Network/server error
             */

            if (
                error &&
                !error.status &&
                error.message &&
                (
                    error.message
                        .toLowerCase()
                        .includes("server") ||

                    error.message
                        .toLowerCase()
                        .includes("kuwasiliana")
                )
            ) {

                message =
                    "Imeshindikana kuwasiliana na server. Hakikisha Node.js backend inaendelea kwenye port 5000.";
            }


            showError(message);

        } finally {

            setLoginLoading(false);
        }
    }


    /* =====================================================
       INPUT EVENTS
       ===================================================== */

    function initializeInputEvents() {

        if (usernameInput) {

            usernameInput.addEventListener(
                "input",
                () => {

                    usernameInput.classList.remove(
                        "input-error"
                    );


                    if (usernameError) {

                        usernameError.textContent = "";

                        usernameError.classList.remove(
                            "is-visible"
                        );
                    }


                    hideError();
                }
            );
        }


        if (passwordInput) {

            passwordInput.addEventListener(
                "input",
                () => {

                    passwordInput.classList.remove(
                        "input-error"
                    );


                    if (passwordError) {

                        passwordError.textContent = "";

                        passwordError.classList.remove(
                            "is-visible"
                        );
                    }


                    hideError();
                }
            );
        }
    }


    /* =====================================================
       KEYBOARD BEHAVIOR
       ===================================================== */

    function initializeKeyboardBehavior() {

        if (!usernameInput) {
            return;
        }


        usernameInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    passwordInput?.focus();
                }
            }
        );
    }


    /* =====================================================
       CLOSE ERROR
       ===================================================== */

    function initializeErrorClose() {

        if (!closeLoginError) {
            return;
        }


        closeLoginError.addEventListener(
            "click",
            hideError
        );
    }


    /* =====================================================
       PASSWORD TOGGLE
       ===================================================== */

    function initializePasswordToggle() {

        if (!togglePassword) {
            return;
        }


        togglePassword.addEventListener(
            "click",
            togglePasswordVisibility
        );
    }


    /* =====================================================
       FORM
       ===================================================== */

    function initializeForm() {

        if (!form) {

            console.error(
                "Login form haijapatikana."
            );

            return;
        }


        form.addEventListener(
            "submit",
            handleLogin
        );
    }


    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    function initializeYear() {

        const yearElement =
            document.getElementById(
                "currentYear"
            );


        if (yearElement) {

            yearElement.textContent =
                new Date().getFullYear();
        }
    }


    /* =====================================================
       INITIALIZE LOGIN PAGE
       ===================================================== */

    async function initializeLoginPage() {

        console.log(
            "🚀 Msongola Login V3 initialized"
        );


        initializeForm();

        initializePasswordToggle();

        initializeErrorClose();

        initializeInputEvents();

        initializeKeyboardBehavior();

        initializeYear();


        /*
         * Check existing session.
         */

        await checkExistingSession();
    }


    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeLoginPage
        );

    } else {

        initializeLoginPage();
    }

})();