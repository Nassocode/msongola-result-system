/* =========================================================
   MSONGOLA SECONDARY SCHOOL
   RESULT MANAGEMENT SYSTEM
   GLOBAL APP CONTROLLER — FRONTEND V2
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       DOM HELPERS
       ===================================================== */

    const $ = (selector, parent = document) => {
        return parent.querySelector(selector);
    };

    const $$ = (selector, parent = document) => {
        return Array.from(parent.querySelectorAll(selector));
    };

    /* =====================================================
       ELEMENTS
       ===================================================== */

    let sidebar;
    let sidebarToggle;
    let sidebarClose;
    let sidebarOverlay;
    let notificationButton;
    let notificationPanel;

    /* =====================================================
       INITIALIZE DOM REFERENCES
       ===================================================== */

    function initializeElements() {
        sidebar = $("#sidebar");
        sidebarToggle = $("#sidebarToggle");
        sidebarClose = $("#sidebarClose");
        sidebarOverlay = $("#sidebarOverlay");

        notificationButton = $(
            "#notificationButton, #notificationBtn, [data-action='notifications']"
        );

        notificationPanel = $(
            "#notificationPanel, .notification-panel"
        );
    }

    /* =====================================================
       SIDEBAR
       ===================================================== */

    function openSidebar() {
        if (!sidebar) return;

        sidebar.classList.add("is-open", "open");
        document.body.classList.add("sidebar-open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("is-visible", "active");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "true");
        }
    }

    function closeSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("is-open", "open");
        document.body.classList.remove("sidebar-open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("is-visible", "active");
        }

        if (sidebarToggle) {
            sidebarToggle.setAttribute("aria-expanded", "false");
        }
    }

    function toggleSidebar() {
        if (!sidebar) return;

        if (sidebar.classList.contains("is-open") || sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    function initializeSidebar() {
        if (sidebarToggle) {
            sidebarToggle.addEventListener(
                "click",
                toggleSidebar
            );
        }

        if (sidebarClose) {
            sidebarClose.addEventListener(
                "click",
                closeSidebar
            );
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener(
                "click",
                closeSidebar
            );
        }

        /*
         * Close mobile sidebar when a navigation item
         * is clicked.
         */
        const navLinks = $$(".sidebar a");

        navLinks.forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 1024) {
                    closeSidebar();
                }
            });
        });

        /*
         * ESC closes sidebar.
         */
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        });

        /*
         * Resize handling.
         */
        window.addEventListener("resize", () => {
            if (window.innerWidth > 1024) {
                closeSidebar();
            }
        });
    }

    /* =====================================================
       ACTIVE NAVIGATION
       ===================================================== */

    function normalizePath(path) {
        if (!path) return "";

        return path
            .split("?")[0]
            .split("#")[0]
            .replace(/\\/g, "/")
            .toLowerCase();
    }

    function initializeActiveNavigation() {
        const currentPath =
            normalizePath(window.location.pathname);

        const navLinks = $$(".sidebar a[href]");

        navLinks.forEach((link) => {
            const href = link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            const linkUrl =
                new URL(href, window.location.href);

            const linkPath =
                normalizePath(linkUrl.pathname);

            link.classList.remove("active");

            if (linkPath === currentPath) {
                link.classList.add("active");
            }
        });
    }

    /* =====================================================
       USER INFORMATION
       ===================================================== */

    function getCurrentUser() {
        if (
            !window.MsongolaAuth ||
            typeof window.MsongolaAuth.currentUser !==
                "function"
        ) {
            return null;
        }

        return window.MsongolaAuth.currentUser();
    }

    function updateUserInformation() {
        const user = getCurrentUser();

        if (!user) {
            return;
        }

        const username =
            user.username ||
            "";

        const displayName =
            user.full_name ||
            user.name ||
            username;

        const role =
            user.role ||
            "";

        /*
         * Generic selectors.
         */
        const nameElements = $$(
            "[data-user-name], #currentUserName, .current-user-name"
        );

        const usernameElements = $$(
            "[data-username], #currentUsername, .current-username"
        );

        const roleElements = $$(
            "[data-user-role], #currentUserRole, .current-user-role"
        );

        nameElements.forEach((element) => {
            element.textContent = displayName;
        });

        usernameElements.forEach((element) => {
            element.textContent = username;
        });

        roleElements.forEach((element) => {
            if (
                window.MsongolaAuth &&
                typeof window.MsongolaAuth.roleLabel ===
                    "function"
            ) {
                element.textContent =
                    window.MsongolaAuth.roleLabel(role);
            } else {
                element.textContent = role;
            }
        });

        /*
         * Initials for avatar.
         */
        updateUserInitials(displayName);
    }

    /* =====================================================
       USER AVATAR INITIALS
       ===================================================== */

    function updateUserInitials(name) {
        if (!name) {
            return;
        }

        const words =
            name
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        let initials = "";

        if (words.length === 1) {
            initials =
                words[0]
                    .substring(0, 2)
                    .toUpperCase();
        } else {
            initials =
                (
                    words[0][0] +
                    words[words.length - 1][0]
                ).toUpperCase();
        }

        const avatarElements = $$(
            "[data-user-initials], #userInitials, .user-initials"
        );

        avatarElements.forEach((element) => {
            element.textContent = initials;
        });
    }

    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    function updateCurrentYear() {
        const year =
            new Date().getFullYear();

        const yearElements = $$(
            "#currentYear, [data-current-year]"
        );

        yearElements.forEach((element) => {
            element.textContent = year;
        });
    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    function initializeLogout() {
        const logoutButtons = $$(
            "[data-action='logout'], #logoutBtn, .logout-btn"
        );

        logoutButtons.forEach((button) => {
            /*
             * Avoid duplicate listeners if auth.js
             * already initialized one.
             */
            if (button.dataset.logoutInitialized === "true") {
                return;
            }

            button.dataset.logoutInitialized = "true";

            button.addEventListener("click", (event) => {
                event.preventDefault();

                if (
                    window.MsongolaAuth &&
                    typeof window.MsongolaAuth.logout ===
                        "function"
                ) {
                    window.MsongolaAuth.logout();
                }
            });
        });
    }

    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    function openNotifications() {
        if (!notificationPanel) {
            return;
        }

        notificationPanel.classList.add("is-open");

        if (notificationButton) {
            notificationButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }

    function closeNotifications() {
        if (!notificationPanel) {
            return;
        }

        notificationPanel.classList.remove("is-open");

        if (notificationButton) {
            notificationButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }

    function toggleNotifications() {
        if (!notificationPanel) {
            return;
        }

        if (
            notificationPanel.classList.contains("is-open")
        ) {
            closeNotifications();
        } else {
            openNotifications();
        }
    }

    function initializeNotifications() {
        if (notificationButton) {
            notificationButton.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    toggleNotifications();
                }
            );
        }

        document.addEventListener("click", (event) => {
            if (!notificationPanel) {
                return;
            }

            if (
                !notificationPanel.contains(event.target) &&
                notificationButton &&
                !notificationButton.contains(event.target)
            ) {
                closeNotifications();
            }
        });
    }

    /* =====================================================
       NOTIFICATION DOT
       ===================================================== */

    function setNotificationState(hasNotifications) {
        const dots = $$(
            "#notificationDot, .notification-dot, [data-notification-dot]"
        );

        dots.forEach((dot) => {
            if (hasNotifications) {
                dot.classList.add("is-visible");
                dot.hidden = false;
            } else {
                dot.classList.remove("is-visible");
                dot.hidden = true;
            }
        });
    }

    /* =====================================================
       MOBILE DROPDOWNS
       ===================================================== */

    function initializeDropdowns() {
        const dropdownTriggers = $$(
            "[data-dropdown-toggle]"
        );

        dropdownTriggers.forEach((trigger) => {
            const targetSelector =
                trigger.getAttribute(
                    "data-dropdown-toggle"
                );

            if (!targetSelector) {
                return;
            }

            const target =
                document.querySelector(targetSelector);

            if (!target) {
                return;
            }

            trigger.addEventListener(
                "click",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    const isOpen =
                        target.classList.contains(
                            "is-open"
                        );

                    /*
                     * Close other dropdowns.
                     */
                    $$(".dropdown.is-open").forEach(
                        (dropdown) => {
                            dropdown.classList.remove(
                                "is-open"
                            );
                        }
                    );

                    if (!isOpen) {
                        target.classList.add(
                            "is-open"
                        );
                    }
                }
            );
        });

        document.addEventListener("click", () => {
            $$(".dropdown.is-open").forEach(
                (dropdown) => {
                    dropdown.classList.remove(
                        "is-open"
                    );
                }
            );
        });
    }

    /* =====================================================
       TOAST
       ===================================================== */

    function showToast(
        message,
        type = "info",
        duration = 3500
    ) {
        if (!message) {
            return;
        }

        let container =
            $("#toastContainer");

        if (!container) {
            container =
                document.createElement("div");

            container.id =
                "toastContainer";

            container.className =
                "toast-container";

            document.body.appendChild(
                container
            );
        }

        const toast =
            document.createElement("div");

        toast.className =
            `toast toast-${type}`;

        toast.setAttribute(
            "role",
            "status"
        );

        const iconMap = {
            success:
                "fa-solid fa-circle-check",

            error:
                "fa-solid fa-circle-xmark",

            warning:
                "fa-solid fa-triangle-exclamation",

            info:
                "fa-solid fa-circle-info"
        };

        const icon =
            iconMap[type] ||
            iconMap.info;

        toast.innerHTML = `
            <span class="toast-icon">
                <i class="${icon}"></i>
            </span>

            <span class="toast-message">
                ${escapeHtml(message)}
            </span>

            <button
                type="button"
                class="toast-close"
                aria-label="Funga"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("is-visible");
        });

        const closeButton =
            $(".toast-close", toast);

        if (closeButton) {
            closeButton.addEventListener(
                "click",
                () => {
                    removeToast(toast);
                }
            );
        }

        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }

    function removeToast(toast) {
        if (!toast) {
            return;
        }

        toast.classList.remove("is-visible");

        setTimeout(() => {
            toast.remove();
        }, 250);
    }

    /* =====================================================
       HTML ESCAPE
       ===================================================== */

    function escapeHtml(value) {
        const div =
            document.createElement("div");

        div.textContent =
            String(value);

        return div.innerHTML;
    }

    /* =====================================================
       LOADING STATE
       ===================================================== */

    function setLoading(
        element,
        isLoading,
        loadingText = "Inapakia..."
    ) {
        if (!element) {
            return;
        }

        if (isLoading) {
            if (!element.dataset.originalHtml) {
                element.dataset.originalHtml =
                    element.innerHTML;
            }

            element.disabled = true;

            element.innerHTML = `
                <span class="button-spinner"></span>
                ${escapeHtml(loadingText)}
            `;
        } else {
            element.disabled = false;

            if (element.dataset.originalHtml) {
                element.innerHTML =
                    element.dataset.originalHtml;

                delete element.dataset.originalHtml;
            }
        }
    }

    /* =====================================================
       FORM SUBMIT PROTECTION
       ===================================================== */

    function initializeFormProtection() {
        const forms = $$(
            "form[data-prevent-double-submit]"
        );

        forms.forEach((form) => {
            form.addEventListener(
                "submit",
                () => {
                    const submitButton =
                        form.querySelector(
                            "button[type='submit'], input[type='submit']"
                        );

                    if (!submitButton) {
                        return;
                    }

                    setTimeout(() => {
                        submitButton.disabled =
                            true;
                    }, 0);
                }
            );
        });
    }

    /* =====================================================
       PAGE VISIBILITY
       ===================================================== */

    function initializePageVisibility() {
        document.documentElement.classList.add(
            "app-ready"
        );
    }

    /* =====================================================
       GLOBAL KEYBOARD SHORTCUT
       ===================================================== */

    function initializeKeyboardShortcuts() {
        document.addEventListener(
            "keydown",
            (event) => {
                /*
                 * Ctrl + Shift + B
                 * Toggle sidebar.
                 */
                if (
                    event.ctrlKey &&
                    event.shiftKey &&
                    event.key.toLowerCase() === "b"
                ) {
                    event.preventDefault();

                    toggleSidebar();
                }
            }
        );
    }

    /* =====================================================
       HANDLE BACK/FORWARD CACHE
       ===================================================== */

    function initializePageShow() {
        window.addEventListener(
            "pageshow",
            () => {
                updateCurrentYear();
                updateUserInformation();
            }
        );
    }

    /* =====================================================
       GLOBAL INITIALIZATION
       ===================================================== */

    function initialize() {
        initializeElements();

        updateCurrentYear();

        updateUserInformation();

        initializeSidebar();

        initializeActiveNavigation();

        initializeLogout();

        initializeNotifications();

        initializeDropdowns();

        initializeFormProtection();

        initializePageVisibility();

        initializeKeyboardShortcuts();

        initializePageShow();

        /*
         * Default notification state.
         *
         * Later this will come from backend.
         */
        setNotificationState(false);

        console.log(
            "✅ Msongola Frontend V2 initialized"
        );
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MsongolaApp = {
        initialize,

        openSidebar,
        closeSidebar,
        toggleSidebar,

        openNotifications,
        closeNotifications,
        toggleNotifications,

        updateUserInformation,
        updateUserInitials,
        updateCurrentYear,

        showToast,

        setLoading,

        setNotificationState,

        escapeHtml
    };

    /* =====================================================
       START APP
       ===================================================== */

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();