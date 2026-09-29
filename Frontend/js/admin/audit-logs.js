/* =========================================================
   MSONGOLA RESULT SYSTEM
   ADMIN — AUDIT LOGS
   FRONTEND JAVASCRIPT
   ========================================================= */

(() => {
    "use strict";


    // =====================================================
    // PAGE CONFIGURATION
    // =====================================================

    const PAGE_ROLES = ["ADMIN"];

    let allAuditLogs = [];
    let filteredAuditLogs = [];

    let currentLogId = null;


    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const elements = {};


    function cacheElements() {

        elements.tableBody =
            document.getElementById(
                "auditLogsTableBody"
            );

        elements.search =
            document.getElementById(
                "auditLogSearch"
            );

        elements.actionFilter =
            document.getElementById(
                "auditLogActionFilter"
            );

        elements.moduleFilter =
            document.getElementById(
                "auditLogModuleFilter"
            );

        elements.refreshButton =
            document.getElementById(
                "refreshAuditLogsButton"
            );

        elements.clearFiltersButton =
            document.getElementById(
                "clearAuditFiltersButton"
            );

        elements.retryButton =
            document.getElementById(
                "retryAuditLogsButton"
            );

        elements.totalLogs =
            document.getElementById(
                "totalAuditLogs"
            );

        elements.todayLogs =
            document.getElementById(
                "todayAuditLogs"
            );

        elements.loginLogs =
            document.getElementById(
                "loginAuditLogs"
            );

        elements.visibleCount =
            document.getElementById(
                "auditVisibleCount"
            );

        elements.emptyState =
            document.getElementById(
                "auditEmptyState"
            );

        elements.errorState =
            document.getElementById(
                "auditErrorState"
            );

        elements.errorMessage =
            document.getElementById(
                "auditErrorMessage"
            );

        elements.modal =
            document.getElementById(
                "auditDetailsModal"
            );

        elements.modalBody =
            document.getElementById(
                "auditModalBody"
            );

        elements.closeModalButton =
            document.getElementById(
                "closeAuditModalButton"
            );

        elements.toast =
            document.getElementById(
                "adminToast"
            );

        elements.toastTitle =
            document.getElementById(
                "toastTitle"
            );

        elements.toastMessage =
            document.getElementById(
                "toastMessage"
            );

        elements.toastCloseButton =
            document.getElementById(
                "toastCloseButton"
            );

        elements.topbarUsername =
            document.getElementById(
                "topbarUsername"
            );

        elements.mobileMenuToggle =
            document.getElementById(
                "mobileMenuToggle"
            );

        elements.sidebar =
            document.getElementById(
                "adminSidebar"
            );

        elements.sidebarClose =
            document.getElementById(
                "sidebarClose"
            );

        elements.sidebarOverlay =
            document.getElementById(
                "sidebarOverlay"
            );
    }


    // =====================================================
    // PAGE PROTECTION
    // =====================================================

    async function protectPage() {

        if (
            !window.MsongolaAuth ||
            !window.MsongolaAPI
        ) {
            console.error(
                "Authentication system haijapatikana."
            );

            return false;
        }


        const allowed =
            await MsongolaAuth.protectPage({
                roles: PAGE_ROLES
            });


        return allowed;
    }


    // =====================================================
    // INITIALIZE PAGE
    // =====================================================

    async function initialize() {

        cacheElements();


        const protectedPage =
            await protectPage();


        if (!protectedPage) {
            return;
        }


        loadTopbarUser();

        initializeSidebar();

        initializeEvents();

        await loadAuditLogs();
    }


    // =====================================================
    // LOAD TOPBAR USER
    // =====================================================

    function loadTopbarUser() {

        if (!elements.topbarUsername) {
            return;
        }


        const user =
            MsongolaAuth.getUser();


        if (
            user &&
            user.username
        ) {

            elements.topbarUsername.textContent =
                user.username;

        }

    }


    // =====================================================
    // SIDEBAR
    // =====================================================

    function initializeSidebar() {

        if (
            !elements.mobileMenuToggle ||
            !elements.sidebar
        ) {
            return;
        }


        elements.mobileMenuToggle.addEventListener(
            "click",
            () => {
                const isOpen = elements.sidebar.classList.toggle("open");
                elements.sidebarOverlay?.classList.toggle("active", isOpen);
                elements.mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
            }
        );

        elements.sidebarClose?.addEventListener("click", closeSidebar);


        if (
            elements.sidebarOverlay
        ) {

            elements.sidebarOverlay.addEventListener(
                "click",
                closeSidebar
            );

        }


        const sidebarLinks =
            elements.sidebar.querySelectorAll(
                ".sidebar-link"
            );


        sidebarLinks.forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    closeSidebar
                );

            }
        );

    }


    function closeSidebar() {

        if (
            elements.sidebar
        ) {

            elements.sidebar.classList.remove(
                "open"
            );

        }


        if (
            elements.sidebarOverlay
        ) {

            elements.sidebarOverlay.classList.remove(
                "active"
            );

        }

        elements.mobileMenuToggle?.setAttribute("aria-expanded", "false");

    }


    // =====================================================
    // EVENTS
    // =====================================================

    function initializeEvents() {


        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------

        if (elements.search) {

            elements.search.addEventListener(
                "input",
                applyFilters
            );

        }


        // -------------------------------------------------
        // ACTION FILTER
        // -------------------------------------------------

        if (elements.actionFilter) {

            elements.actionFilter.addEventListener(
                "change",
                applyFilters
            );

        }


        // -------------------------------------------------
        // MODULE FILTER
        // -------------------------------------------------

        if (elements.moduleFilter) {

            elements.moduleFilter.addEventListener(
                "change",
                applyFilters
            );

        }


        // -------------------------------------------------
        // REFRESH
        // -------------------------------------------------

        if (elements.refreshButton) {

            elements.refreshButton.addEventListener(
                "click",
                async () => {

                    await loadAuditLogs(
                        true
                    );

                }
            );

        }


        // -------------------------------------------------
        // CLEAR FILTERS
        // -------------------------------------------------

        if (
            elements.clearFiltersButton
        ) {

            elements.clearFiltersButton.addEventListener(
                "click",
                clearFilters
            );

        }


        // -------------------------------------------------
        // RETRY
        // -------------------------------------------------

        if (elements.retryButton) {

            elements.retryButton.addEventListener(
                "click",
                async () => {

                    await loadAuditLogs(
                        true
                    );

                }
            );

        }


        // -------------------------------------------------
        // TABLE ACTIONS
        // -------------------------------------------------

        if (elements.tableBody) {

            elements.tableBody.addEventListener(
                "click",
                handleTableClick
            );

        }


        // -------------------------------------------------
        // CLOSE MODAL
        // -------------------------------------------------

        if (
            elements.closeModalButton
        ) {

            elements.closeModalButton.addEventListener(
                "click",
                closeModal
            );

        }


        // -------------------------------------------------
        // CLOSE MODAL USING OVERLAY
        // -------------------------------------------------

        if (elements.modal) {

            const overlay =
                elements.modal.querySelector(
                    "[data-close-audit-modal]"
                );


            if (overlay) {

                overlay.addEventListener(
                    "click",
                    closeModal
                );

            }

        }


        // -------------------------------------------------
        // ESC KEY
        // -------------------------------------------------

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape"
                ) {

                    closeModal();

                }

            }
        );


        // -------------------------------------------------
        // TOAST CLOSE
        // -------------------------------------------------

        if (
            elements.toastCloseButton
        ) {

            elements.toastCloseButton.addEventListener(
                "click",
                hideToast
            );

        }

    }


    // =====================================================
    // LOAD AUDIT LOGS
    // =====================================================

    async function loadAuditLogs(
        showMessage = false
    ) {

        showLoadingState();


        try {

            const response =
                await MsongolaAPI.get(
                    "/audit-logs"
                );


            if (
                !response ||
                !response.success
            ) {

                throw new Error(
                    response?.message ||
                    "Audit logs hazikupatikana."
                );

            }


            allAuditLogs =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];


            filteredAuditLogs =
                [...allAuditLogs];


            buildFilterOptions();

            updateStatistics();

            applyFilters();


            if (showMessage) {

                showToast(
                    "Imefanikiwa",
                    "Audit Logs zime-refresh."
                );

            }


        } catch (error) {

            console.error(
                "Load audit logs error:",
                error
            );


            showErrorState(
                error.message ||
                "Imeshindikana kupakia Audit Logs."
            );

        }

    }


    // =====================================================
    // LOADING STATE
    // =====================================================

    function showLoadingState() {

        hideElement(
            elements.emptyState
        );

        hideElement(
            elements.errorState
        );


        if (
            !elements.tableBody
        ) {
            return;
        }


        elements.tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="audit-loading-state"
                >

                    <div>

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        <span>
                            Inapakia Audit Logs...
                        </span>

                    </div>

                </td>

            </tr>

        `;

    }


    // =====================================================
    // ERROR STATE
    // =====================================================

    function showErrorState(
        message
    ) {

        hideElement(
            elements.emptyState
        );


        if (
            elements.tableBody
        ) {

            elements.tableBody.innerHTML = "";

        }


        if (
            elements.errorMessage
        ) {

            elements.errorMessage.textContent =
                message;

        }


        showElement(
            elements.errorState
        );

    }


    // =====================================================
    // BUILD FILTER OPTIONS
    // =====================================================

    function buildFilterOptions() {

        if (
            elements.actionFilter
        ) {

            const actions =
                uniqueSortedValues(
                    allAuditLogs,
                    "action"
                );


            elements.actionFilter.innerHTML =
                `
                    <option value="">
                        Actions zote
                    </option>
                `;


            actions.forEach(
                (action) => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        action;

                    option.textContent =
                        formatAction(
                            action
                        );

                    elements.actionFilter.appendChild(
                        option
                    );

                }
            );

        }


        if (
            elements.moduleFilter
        ) {

            const modules =
                uniqueSortedValues(
                    allAuditLogs,
                    "module"
                );


            elements.moduleFilter.innerHTML =
                `
                    <option value="">
                        Modules zote
                    </option>
                `;


            modules.forEach(
                (module) => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        module;

                    option.textContent =
                        formatModule(
                            module
                        );

                    elements.moduleFilter.appendChild(
                        option
                    );

                }
            );

        }

    }


    // =====================================================
    // UNIQUE SORTED VALUES
    // =====================================================

    function uniqueSortedValues(
        logs,
        property
    ) {

        const values =
            logs
                .map(
                    (log) =>
                        log?.[property]
                )
                .filter(
                    (value) =>
                        value !== null &&
                        value !== undefined &&
                        String(value).trim() !== ""
                )
                .map(
                    (value) =>
                        String(value).trim()
                );


        return [
            ...new Set(values)
        ].sort(
            (a, b) =>
                a.localeCompare(
                    b
                )
        );

    }


    // =====================================================
    // APPLY FILTERS
    // =====================================================

    function applyFilters() {

        const searchTerm =
            elements.search
                ? elements.search.value
                    .trim()
                    .toLowerCase()
                : "";


        const selectedAction =
            elements.actionFilter
                ? elements.actionFilter.value
                : "";


        const selectedModule =
            elements.moduleFilter
                ? elements.moduleFilter.value
                : "";


        filteredAuditLogs =
            allAuditLogs.filter(
                (log) => {

                    const searchableText =
                        [
                            log.id,
                            log.user_id,
                            log.username,
                            log.role,
                            log.action,
                            log.description,
                            log.module,
                            log.ip_address,
                            log.user_agent,
                            log.created_at
                        ]
                            .map(
                                (value) =>
                                    value === null ||
                                    value === undefined
                                        ? ""
                                        : String(value)
                            )
                            .join(" ")
                            .toLowerCase();


                    const matchesSearch =
                        !searchTerm ||
                        searchableText.includes(
                            searchTerm
                        );


                    const matchesAction =
                        !selectedAction ||
                        String(
                            log.action || ""
                        ) === selectedAction;


                    const matchesModule =
                        !selectedModule ||
                        String(
                            log.module || ""
                        ) === selectedModule;


                    return (
                        matchesSearch &&
                        matchesAction &&
                        matchesModule
                    );

                }
            );


        renderAuditLogs();

    }


    // =====================================================
    // RENDER AUDIT LOGS
    // =====================================================

    function renderAuditLogs() {

        hideElement(
            elements.errorState
        );


        if (
            elements.visibleCount
        ) {

            elements.visibleCount.textContent =
                filteredAuditLogs.length;

        }


        if (
            filteredAuditLogs.length === 0
        ) {

            if (
                elements.tableBody
            ) {

                elements.tableBody.innerHTML =
                    "";

            }


            showElement(
                elements.emptyState
            );

            return;

        }


        hideElement(
            elements.emptyState
        );


        if (
            !elements.tableBody
        ) {
            return;
        }


        elements.tableBody.innerHTML =
            filteredAuditLogs
                .map(
                    (log, index) =>
                        createAuditRow(
                            log,
                            index
                        )
                )
                .join("");

    }


    // =====================================================
    // CREATE TABLE ROW
    // =====================================================

    function createAuditRow(
        log,
        index
    ) {

        const username =
            log.username ||
            "System";


        const role =
            log.role ||
            "N/A";


        const initials =
            getInitials(
                username
            );


        const action =
            formatAction(
                log.action
            );


        const actionClass =
            getActionClass(
                log.action
            );


        const actionIcon =
            getActionIcon(
                log.action
            );


        const module =
            formatModule(
                log.module
            );


        const description =
            log.description ||
            "Hakuna maelezo";


        const ipAddress =
            log.ip_address ||
            "N/A";


        const createdAt =
            formatDate(
                log.created_at
            );


        return `

            <tr>

                <td>
                    ${index + 1}
                </td>


                <td>

                    <div class="audit-user-cell">

                        <div
                            class="audit-user-avatar"
                            aria-hidden="true"
                        >
                            ${escapeHtml(
                                initials
                            )}
                        </div>

                        <div
                            class="audit-user-info"
                        >

                            <strong>
                                ${escapeHtml(
                                    username
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    role
                                )}
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <span
                        class="audit-action-badge ${actionClass}"
                    >

                        <i
                            class="${actionIcon}"
                        ></i>

                        ${escapeHtml(
                            action
                        )}

                    </span>

                </td>


                <td>

                    <span
                        class="audit-module-badge"
                    >
                        ${escapeHtml(
                            module
                        )}
                    </span>

                </td>


                <td>

                    <div
                        class="audit-description"
                        title="${escapeHtml(
                            description
                        )}"
                    >
                        ${escapeHtml(
                            description
                        )}
                    </div>

                </td>


                <td>

                    <span class="audit-ip">
                        ${escapeHtml(
                            ipAddress
                        )}
                    </span>

                </td>


                <td>

                    <span class="audit-date">
                        ${escapeHtml(
                            createdAt
                        )}
                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="audit-view-button"
                        data-view-audit="${escapeHtml(
                            log.id
                        )}"
                        title="Angalia maelezo"
                        aria-label="Angalia maelezo ya audit log"
                    >

                        <i
                            class="fa-solid fa-eye"
                        ></i>

                    </button>

                </td>

            </tr>

        `;

    }


    // =====================================================
    // HANDLE TABLE CLICK
    // =====================================================

    function handleTableClick(
        event
    ) {

        const button =
            event.target.closest(
                "[data-view-audit]"
            );


        if (!button) {
            return;
        }


        const id =
            button.getAttribute(
                "data-view-audit"
            );


        if (!id) {
            return;
        }


        openAuditDetails(
            id
        );

    }


    // =====================================================
    // OPEN AUDIT DETAILS
    // =====================================================

    async function openAuditDetails(
        id
    ) {

        currentLogId = id;


        let log =
            allAuditLogs.find(
                (item) =>
                    String(item.id) ===
                    String(id)
            );


        if (!log) {

            try {

                const response =
                    await MsongolaAPI.get(
                        `/audit-logs/${encodeURIComponent(
                            id
                        )}`
                    );


                if (
                    response?.success &&
                    response.data
                ) {

                    log =
                        response.data;

                }

            } catch (error) {

                console.error(
                    "Get audit log details error:",
                    error
                );

            }

        }


        if (!log) {

            showToast(
                "Haijapatikana",
                "Audit log hii haijapatikana.",
                "error"
            );

            return;

        }


        renderAuditDetails(
            log
        );


        showModal();

    }


    // =====================================================
    // RENDER AUDIT DETAILS
    // =====================================================

    function renderAuditDetails(
        log
    ) {

        const username =
            log.username ||
            "System";


        const role =
            log.role ||
            "N/A";


        const action =
            formatAction(
                log.action
            );


        const module =
            formatModule(
                log.module
            );


        const description =
            log.description ||
            "Hakuna maelezo";


        const ip =
            log.ip_address ||
            "N/A";


        const userAgent =
            log.user_agent ||
            "N/A";


        const createdAt =
            formatDate(
                log.created_at,
                true
            );


        if (
            !elements.modalBody
        ) {
            return;
        }


        elements.modalBody.innerHTML = `

            <div class="audit-details-grid">


                <div class="audit-detail-item">

                    <span class="audit-detail-label">
                        Log ID
                    </span>

                    <div class="audit-detail-value">
                        #${escapeHtml(
                            log.id
                        )}
                    </div>

                </div>


                <div class="audit-detail-item">

                    <span class="audit-detail-label">
                        User ID
                    </span>

                    <div class="audit-detail-value">
                        ${escapeHtml(
                            log.user_id ||
                            "N/A"
                        )}
                    </div>

                </div>


                <div class="audit-detail-item">

                    <span class="audit-detail-label">
                        Mtumiaji
                    </span>

                    <div class="audit-modal-user">

                        <div
                            class="audit-modal-user-avatar"
                        >
                            ${escapeHtml(
                                getInitials(
                                    username
                                )
                            )}
                        </div>

                        <div>

                            <div
                                class="audit-detail-value"
                            >
                                ${escapeHtml(
                                    username
                                )}
                            </div>

                            <small>
                                ${escapeHtml(
                                    role
                                )}
                            </small>

                        </div>

                    </div>

                </div>


                <div class="audit-detail-item">

                    <span class="audit-detail-label">
                        Action
                    </span>

                    <div class="audit-detail-value">

                        <span
                            class="audit-action-badge ${getActionClass(
                                log.action
                            )}"
                        >

                            <i
                                class="${getActionIcon(
                                    log.action
                                )}"
                            ></i>

                            ${escapeHtml(
                                action
                            )}

                        </span>

                    </div>

                </div>


                <div class="audit-detail-item">

                    <span class="audit-detail-label">
                        Module
                    </span>

                    <div class="audit-detail-value">
                        ${escapeHtml(
                            module
                        )}
                    </div>

                </div>


                <div class="audit-detail-item">

                    <span class="audit-detail-label">
                        IP Address
                    </span>

                    <div class="audit-detail-value">
                        ${escapeHtml(
                            ip
                        )}
                    </div>

                </div>


                <div
                    class="audit-detail-item full"
                >

                    <span class="audit-detail-label">
                        Tarehe na Muda
                    </span>

                    <div class="audit-detail-value">
                        ${escapeHtml(
                            createdAt
                        )}
                    </div>

                </div>


                <div
                    class="audit-detail-item full"
                >

                    <span class="audit-detail-label">
                        Maelezo
                    </span>

                    <div class="audit-detail-value">
                        ${escapeHtml(
                            description
                        )}
                    </div>

                </div>


                <div
                    class="audit-detail-item full"
                >

                    <span class="audit-detail-label">
                        User Agent
                    </span>

                    <div
                        class="audit-user-agent"
                    >
                        ${escapeHtml(
                            userAgent
                        )}
                    </div>

                </div>


            </div>

        `;

    }


    // =====================================================
    // UPDATE STATISTICS
    // =====================================================

    function updateStatistics() {

        const total =
            allAuditLogs.length;


        const today =
            getTodayLogs();


        const loginCount =
            allAuditLogs.filter(
                (log) =>
                    String(
                        log.action || ""
                    )
                        .toUpperCase()
                        .includes("LOGIN")
            ).length;


        if (
            elements.totalLogs
        ) {

            elements.totalLogs.textContent =
                total;

        }


        if (
            elements.todayLogs
        ) {

            elements.todayLogs.textContent =
                today;

        }


        if (
            elements.loginLogs
        ) {

            elements.loginLogs.textContent =
                loginCount;

        }


        if (
            elements.visibleCount
        ) {

            elements.visibleCount.textContent =
                total;

        }

    }


    // =====================================================
    // TODAY LOGS
    // =====================================================

    function getTodayLogs() {

        const now =
            new Date();


        const todayYear =
            now.getFullYear();


        const todayMonth =
            now.getMonth();


        const todayDate =
            now.getDate();


        return allAuditLogs.filter(
            (log) => {

                if (!log.created_at) {
                    return false;
                }


                const date =
                    new Date(
                        log.created_at
                    );


                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {

                    return false;

                }


                return (
                    date.getFullYear() ===
                        todayYear &&

                    date.getMonth() ===
                        todayMonth &&

                    date.getDate() ===
                        todayDate
                );

            }
        ).length;

    }


    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    function clearFilters() {

        if (
            elements.search
        ) {

            elements.search.value =
                "";

        }


        if (
            elements.actionFilter
        ) {

            elements.actionFilter.value =
                "";

        }


        if (
            elements.moduleFilter
        ) {

            elements.moduleFilter.value =
                "";

        }


        applyFilters();


        showToast(
            "Filters zimeondolewa",
            "Audit Logs zote zinaonyeshwa."
        );

    }


    // =====================================================
    // SHOW MODAL
    // =====================================================

    function showModal() {

        if (
            !elements.modal
        ) {
            return;
        }


        elements.modal.hidden =
            false;


        document.body.classList.add(
            "modal-open"
        );

    }


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    function closeModal() {

        if (
            !elements.modal
        ) {
            return;
        }


        elements.modal.hidden =
            true;


        document.body.classList.remove(
            "modal-open"
        );


        currentLogId =
            null;

    }


    // =====================================================
    // FORMAT ACTION
    // =====================================================

    function formatAction(
        action
    ) {

        if (!action) {
            return "N/A";
        }


        const value =
            String(action)
                .trim()
                .replace(
                    /[_-]+/g,
                    " "
                );


        return value
            .toLowerCase()
            .split(" ")
            .map(
                (word) =>
                    word
                        ? word.charAt(0)
                            .toUpperCase() +
                          word.slice(1)
                        : ""
            )
            .join(" ");

    }


    // =====================================================
    // FORMAT MODULE
    // =====================================================

    function formatModule(
        module
    ) {

        if (!module) {
            return "General";
        }


        const value =
            String(module)
                .trim()
                .replace(
                    /[_-]+/g,
                    " "
                );


        return value
            .toLowerCase()
            .split(" ")
            .map(
                (word) =>
                    word
                        ? word.charAt(0).toUpperCase() +
                          word.slice(1)
                        : ""
            )
            .join(" ");

    }


    // =====================================================
    // ACTION CLASS
    // =====================================================

    function getActionClass(
        action
    ) {

        const value =
            String(
                action || ""
            )
                .toLowerCase();


        if (
            value.includes("login") ||
            value.includes("sign in")
        ) {

            return "login";

        }


        if (
            value.includes("logout") ||
            value.includes("sign out")
        ) {

            return "logout";

        }


        if (
            value.includes("create") ||
            value.includes("add") ||
            value.includes("register")
        ) {

            return "create";

        }


        if (
            value.includes("update") ||
            value.includes("edit") ||
            value.includes("change")
        ) {

            return "update";

        }


        if (
            value.includes("delete") ||
            value.includes("remove")
        ) {

            return "delete";

        }


        if (
            value.includes("security") ||
            value.includes("password") ||
            value.includes("permission")
        ) {

            return "security";

        }


        return "";

    }


    // =====================================================
    // ACTION ICON
    // =====================================================

    function getActionIcon(
        action
    ) {

        const value =
            String(
                action || ""
            )
                .toLowerCase();


        if (
            value.includes("login") ||
            value.includes("sign in")
        ) {

            return "fa-solid fa-right-to-bracket";

        }


        if (
            value.includes("logout") ||
            value.includes("sign out")
        ) {

            return "fa-solid fa-right-from-bracket";

        }


        if (
            value.includes("create") ||
            value.includes("add") ||
            value.includes("register")
        ) {

            return "fa-solid fa-plus";

        }


        if (
            value.includes("update") ||
            value.includes("edit") ||
            value.includes("change")
        ) {

            return "fa-solid fa-pen";

        }


        if (
            value.includes("delete") ||
            value.includes("remove")
        ) {

            return "fa-solid fa-trash";

        }


        if (
            value.includes("security") ||
            value.includes("password") ||
            value.includes("permission")
        ) {

            return "fa-solid fa-shield-halved";

        }


        return "fa-solid fa-circle-info";

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(
        value,
        includeSeconds = false
    ) {

        if (!value) {
            return "N/A";
        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(
                value
            );

        }


        const options = {

            day: "2-digit",

            month: "short",

            year: "numeric",

            hour: "2-digit",

            minute: "2-digit",

            hour12: false

        };


        if (includeSeconds) {

            options.second =
                "2-digit";

        }


        return new Intl.DateTimeFormat(
            "en-GB",
            options
        ).format(
            date
        );

    }


    // =====================================================
    // GET INITIALS
    // =====================================================

    function getInitials(
        name
    ) {

        if (!name) {
            return "SY";
        }


        const words =
            String(name)
                .trim()
                .split(
                    /\s+/
                )
                .filter(Boolean);


        if (
            words.length === 1
        ) {

            return words[0]
                .substring(
                    0,
                    2
                )
                .toUpperCase();

        }


        return (
            words[0].charAt(0) +
            words[1].charAt(0)
        ).toUpperCase();

    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(
        value
    ) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // =====================================================
    // SHOW ELEMENT
    // =====================================================

    function showElement(
        element
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            false;

    }


    // =====================================================
    // HIDE ELEMENT
    // =====================================================

    function hideElement(
        element
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            true;

    }


    // =====================================================
    // TOAST
    // =====================================================

    function showToast(
        title,
        message,
        type = "success"
    ) {

        if (
            !elements.toast
        ) {
            return;
        }


        if (
            elements.toastTitle
        ) {

            elements.toastTitle.textContent =
                title;

        }


        if (
            elements.toastMessage
        ) {

            elements.toastMessage.textContent =
                message;

        }


        elements.toast.classList.remove(
            "show",
            "success",
            "error",
            "warning"
        );


        elements.toast.classList.add(
            "show",
            type
        );


        window.clearTimeout(
            showToast.timeout
        );


        showToast.timeout =
            window.setTimeout(
                hideToast,
                4000
            );

    }


    function hideToast() {

        if (
            elements.toast
        ) {

            elements.toast.classList.remove(
                "show"
            );

        }

    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.MsongolaAuditLogs = {

        loadAuditLogs,

        applyFilters,

        clearFilters,

        openAuditDetails,

        closeModal

    };


    // =====================================================
    // START PAGE
    // =====================================================

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

})();