/* =========================================================
   MSONGOLA RESULT SYSTEM
   API SERVICE — FRONTEND V2
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const API_BASE_URL = "http://localhost:5000/api";
    const DEFAULT_TIMEOUT = 10000;
    const API_SCRIPT_URL = document.currentScript?.src || window.location.href;
    const API_ORIGIN = new URL(API_BASE_URL).origin;
    const SCHOOL_LOGO_PATH = "/uploads/logo/school-logo.png";
    const SCHOOL_LOGO_URL = new URL(SCHOOL_LOGO_PATH, API_ORIGIN).href;
    let activeSchoolLogoURL = SCHOOL_LOGO_URL;
    let schoolBrandObserver = null;

    /* =====================================================
       STORAGE KEYS
       ===================================================== */

    const TOKEN_KEY = "msongola_token";
    const USER_KEY = "msongola_user";

    /* =====================================================
       STORAGE HELPERS
       ===================================================== */

    function getStorage() {
        /*
         * V2 uses sessionStorage as the default authentication
         * storage. This avoids old persistent login sessions.
         */
        return window.sessionStorage;
    }

    function getToken() {
        return getStorage().getItem(TOKEN_KEY);
    }

    function getUser() {
        const user = getStorage().getItem(USER_KEY);

        if (!user) {
            return null;
        }

        try {
            return JSON.parse(user);
        } catch (error) {
            console.warn("Invalid stored user data.");
            getStorage().removeItem(USER_KEY);
            return null;
        }
    }

    function setAuthentication(token, user) {
        if (!token || !user) {
            throw new Error("Token na user vinahitajika.");
        }

        getStorage().setItem(TOKEN_KEY, token);
        getStorage().setItem(USER_KEY, JSON.stringify(user));
    }

    function clearAuthentication() {
        /*
         * Clear V2 session.
         */
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        /*
         * Clear old V1 storage too.
         * This is important during migration.
         */
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        /*
         * Also remove possible legacy keys.
         */
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
    }

    /* =====================================================
       URL BUILDER
       ===================================================== */

    function buildUrl(endpoint) {
        if (!endpoint) {
            throw new Error("API endpoint haijatolewa.");
        }

        if (/^https?:\/\//i.test(endpoint)) {
            return endpoint;
        }

        const cleanEndpoint = endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`;

        return `${API_BASE_URL}${cleanEndpoint}`;
    }

    /* =====================================================
       REQUEST TIMEOUT
       ===================================================== */

    function createTimeoutController(timeout = DEFAULT_TIMEOUT) {
        const controller = new AbortController();

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);

        return {
            controller,
            timeoutId
        };
    }

    /* =====================================================
       RESPONSE PARSER
       ===================================================== */

    async function parseResponse(response) {
        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            return await response.json();
        }

        const text = await response.text();

        return {
            success: response.ok,
            message: text || "Server returned an empty response.",
            data: text
        };
    }

    /* =====================================================
       API ERROR
       ===================================================== */

    class ApiError extends Error {
        constructor(message, status = 0, data = null) {
            super(message);

            this.name = "ApiError";
            this.status = status;
            this.data = data;
        }
    }

    /* =====================================================
       MAIN REQUEST FUNCTION
       ===================================================== */

    async function request(endpoint, options = {}) {
        const {
            method = "GET",
            body = null,
            headers = {},
            timeout = DEFAULT_TIMEOUT,
            auth = true,
            cache = "no-store"
        } = options;

        const url = buildUrl(endpoint);

        const requestHeaders = {
            Accept: "application/json",
            ...headers
        };

        /*
         * Automatically send Bearer token.
         */
        const token = getToken();

        if (auth && token) {
            requestHeaders.Authorization = `Bearer ${token}`;
        }

        /*
         * Add JSON content type only when needed.
         */
        let requestBody = body;

        if (
            body !== null &&
            !(body instanceof FormData) &&
            typeof body === "object"
        ) {
            requestHeaders["Content-Type"] = "application/json";
            requestBody = JSON.stringify(body);
        }

        const {
            controller,
            timeoutId
        } = createTimeoutController(timeout);

        try {
            const response = await fetch(url, {
                method,
                headers: requestHeaders,
                body: requestBody,
                cache,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const result = await parseResponse(response);

            /*
             * Unauthorized.
             */
            if (response.status === 401) {
                /*
                 * Do not automatically redirect here.
                 *
                 * Auth.js will decide what to do.
                 */
                throw new ApiError(
                    result.message ||
                    "Session yako imekwisha. Tafadhali ingia tena.",
                    401,
                    result
                );
            }

            /*
             * Forbidden.
             */
            if (response.status === 403) {
                throw new ApiError(
                    result.message ||
                    "Huna ruhusa ya kufanya kitendo hiki.",
                    403,
                    result
                );
            }

            /*
             * Other server errors.
             */
            if (!response.ok) {
                throw new ApiError(
                    result.message ||
                    `Request failed with status ${response.status}.`,
                    response.status,
                    result
                );
            }

            return result;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === "AbortError") {
                throw new ApiError(
                    "Server haikujibu kwa wakati. Hakikisha backend inaendelea kwenye port 5000.",
                    408
                );
            }

            if (error instanceof ApiError) {
                throw error;
            }

            console.error("API Request Error:", error);

            throw new ApiError(
                "Imeshindikana kuwasiliana na server. Hakikisha Node.js backend inaendelea.",
                0,
                error
            );
        }
    }

    /* =====================================================
       HTTP METHODS
       ===================================================== */

    async function get(endpoint, options = {}) {
        return request(endpoint, {
            ...options,
            method: "GET"
        });
    }

    async function post(endpoint, body = null, options = {}) {
        return request(endpoint, {
            ...options,
            method: "POST",
            body
        });
    }

    async function put(endpoint, body = null, options = {}) {
        return request(endpoint, {
            ...options,
            method: "PUT",
            body
        });
    }

    async function patch(endpoint, body = null, options = {}) {
        return request(endpoint, {
            ...options,
            method: "PATCH",
            body
        });
    }

    async function remove(endpoint, options = {}) {
        return request(endpoint, {
            ...options,
            method: "DELETE"
        });
    }

    /* =====================================================
       AUTH API
       ===================================================== */

    async function login(username, password) {
        return post(
            "/auth/login",
            {
                username,
                password
            },
            {
                auth: false
            }
        );
    }

    async function getCurrentUser() {
        return get("/auth/me");
    }

    /* =====================================================
       HEALTH CHECK
       ===================================================== */

    async function checkServer() {
        try {
            const result = await get("/", {
                auth: false,
                timeout: 5000
            });

            return {
                online: true,
                data: result
            };

        } catch (error) {
            return {
                online: false,
                error
            };
        }
    }

    function decorateSchoolLogo(container, logoUrl) {
        if (!container || container.dataset.schoolLogoReady === "true") return;
        container.dataset.schoolLogoReady = "true";
        container.classList.add("school-logo-container");

        const image = document.createElement("img");
        image.className = "school-brand-image";
        image.src = logoUrl;
        image.alt = "Msongola Secondary School logo";
        image.decoding = "async";
        image.addEventListener("load", () => container.classList.add("has-school-logo"), { once: true });
        image.addEventListener("error", () => {
            const localLogoUrl = new URL("../../uploads/logo/school-logo.png", API_SCRIPT_URL).href;
            if (!image.dataset.localFallbackAttempted && image.src !== localLogoUrl) {
                image.dataset.localFallbackAttempted = "true";
                image.src = localLogoUrl;
                return;
            }
            image.remove();
            container.classList.remove("has-school-logo");
        });
        container.prepend(image);
    }

    function applySchoolLogos(logoUrl) {
        const stylesheetUrl = new URL("../css/school-brand.css", API_SCRIPT_URL).href;
        if (!document.querySelector("link[data-school-brand-styles]")) {
            const stylesheet = document.createElement("link");
            stylesheet.rel = "stylesheet";
            stylesheet.href = stylesheetUrl;
            stylesheet.dataset.schoolBrandStyles = "true";
            document.head.appendChild(stylesheet);
        }

        document.querySelectorAll(
            ".sidebar-brand-icon, .brand-mark, .brand-logo, .auth-logo-mark, .school-logo, .logo-placeholder, .preview-logo, .loading-card .logo"
        ).forEach((container) => decorateSchoolLogo(container, logoUrl));

        document.querySelectorAll(".sidebar-brand-text, .brand-text").forEach((container) => {
            if (container.classList.contains("brand-text")) {
                const subtitle = container.querySelector("span");
                if (subtitle && subtitle.textContent.toLowerCase().includes("result system")) {
                    subtitle.textContent = "SECONDARY SCHOOL";
                }
            }
            if (container.querySelector(".school-brand-system-name")) return;
            const tagline = document.createElement("span");
            tagline.className = "school-brand-system-name";
            tagline.textContent = "Results Management System";
            container.appendChild(tagline);
        });

        document.querySelectorAll(".auth-logo, .auth-mobile-logo").forEach((container) => {
            if (container.querySelector(".school-brand-system-name")) return;
            const details = [...container.children].find((child) => !child.classList.contains("auth-logo-mark"));
            if (!details || details.textContent.toLowerCase().includes("results management system")) return;
            const tagline = document.createElement("span");
            tagline.className = "school-brand-system-name";
            tagline.textContent = "Results Management System";
            details.appendChild(tagline);
        });

        if (!schoolBrandObserver && document.body) {
            schoolBrandObserver = new MutationObserver(() => applySchoolLogos(activeSchoolLogoURL));
            schoolBrandObserver.observe(document.body, { childList: true, subtree: true });
        }
    }

    async function loadSchoolBranding() {
        let logoUrl = SCHOOL_LOGO_URL;
        let settings = {};

        try {
            const response = await get("/school-settings/branding", { auth: false, timeout: 3500 });
            settings = response?.data || {};
            const storedPath = String(settings.logo_path || SCHOOL_LOGO_PATH);
            const candidate = new URL(storedPath, API_ORIGIN);
            if (candidate.pathname === SCHOOL_LOGO_PATH) logoUrl = candidate.href;
        } catch (error) {
            console.warn("School branding settings unavailable; using the official logo path.");
        }

        activeSchoolLogoURL = logoUrl;
        applySchoolLogos(logoUrl);
        document.querySelectorAll("[data-school-name]").forEach((element) => {
            if (settings.school_name) element.textContent = settings.school_name;
        });
        document.querySelectorAll("[data-school-branding-field]").forEach((element) => {
            const field = element.dataset.schoolBrandingField;
            element.textContent = settings[field] || "-";
        });
        document.querySelectorAll("[data-school-logo-path]").forEach((element) => {
            element.textContent = SCHOOL_LOGO_PATH.replace(/^\//, "");
        });
        return { ...settings, logo_path: SCHOOL_LOGO_PATH, logo_url: logoUrl };
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MsongolaAPI = {
        API_BASE_URL,
        SCHOOL_LOGO_PATH,
        SCHOOL_LOGO_URL,

        TOKEN_KEY,
        USER_KEY,

        getToken,
        getUser,
        setAuthentication,
        clearAuthentication,

        request,

        get,
        post,
        put,
        patch,
        delete: remove,

        login,
        getCurrentUser,

        checkServer,
        loadSchoolBranding,

        ApiError
    };

    loadSchoolBranding();

})();