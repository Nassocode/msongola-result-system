/* =========================================================
   MSONGOLA RESULT SYSTEM
   ADMIN — USER MANAGEMENT
   users.js
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const PAGE_SIZE = 10;

    let allUsers = [];
    let filteredUsers = [];

    let currentPage = 1;

    let selectedUser = null;

    let isLoading = false;


    /* =====================================================
       DOM HELPERS
    ===================================================== */

    const $ = (selector) =>
        document.querySelector(selector);


    const $$ = (selector) =>
        document.querySelectorAll(selector);


    /* =====================================================
        $$([data-password-toggle], [data-password-target])
    ===================================================== */

    const elements = {
        /* User Stats */
        usersTotal:
            $("#usersTotal"),

        usersActive:
            $("#usersActive"),

        usersInactive:
            $("#usersInactive"),

        academicMasterCount:
            $("#academicMasterCount"),

        teacherCount:
            $("#teacherCount"),


        /* Search / Filters */
        userSearch:
            $("#userSearch"),

        roleFilter:
            $("#roleFilter"),

        statusFilter:
            $("#statusFilter"),

        resetFiltersButton:
            $("#resetFiltersButton"),


        /* Table */
        usersResultCount:
            $("#usersResultCount"),

        usersTableBody:
            $("#usersTableBody"),

        usersEmptyState:
            $("#usersEmptyState"),


        /* Pagination */
        paginationInfo:
            $("#paginationInfo"),

        previousPageButton:
            $("#previousPageButton"),

        currentPageNumber:
            $("#currentPageNumber"),

        nextPageButton:
            $("#nextPageButton"),


        /* Create User */
        openCreateUserButton:
            $("#openCreateUserButton"),

        createUserModal:
            $("#createUserModal"),

        createUserForm:
            $("#createUserForm"),

        createUserAlert:
            $("#createUserAlert"),

        createUsername:
            $("#createUsername"),

        createPassword:
            $("#createPassword"),

        confirmPassword:
            $("#confirmPassword"),

        createRole:
            $("#createRole"),

        createStatus:
            $("#createStatus"),

        closeCreateUserButton:
            $("#closeCreateUserButton"),

        cancelCreateUserButton:
            $("#cancelCreateUserButton"),

        createUserSubmitButton:
            $("#createUserSubmitButton"),


        /* Edit User */
        editUserModal:
            $("#editUserModal"),

        editUserForm:
            $("#editUserForm"),

        editUserId:
            $("#editUserId"),

        editUserAlert:
            $("#editUserAlert"),

        editUsername:
            $("#editUsername"),

        editRole:
            $("#editRole"),

        closeEditUserButton:
            $("#closeEditUserButton"),

        cancelEditUserButton:
            $("#cancelEditUserButton"),

        editUserSubmitButton:
            $("#editUserSubmitButton"),


        /* Password */
        passwordUserModal:
            $("#passwordUserModal"),

        passwordUserForm:
            $("#passwordUserForm"),

        passwordUserId:
            $("#passwordUserId"),

        passwordUserAlert:
            $("#passwordUserAlert"),

        newUserPassword:
            $("#newUserPassword"),

        confirmNewUserPassword:
            $("#confirmNewUserPassword"),

        closePasswordUserButton:
            $("#closePasswordUserButton"),

        cancelPasswordUserButton:
            $("#cancelPasswordUserButton"),

        passwordUserSubmitButton:
            $("#passwordUserSubmitButton"),


        /* Status */
        statusUserModal:
            $("#statusUserModal"),

        statusUserModalTitle:
            $("#statusUserModalTitle"),

        statusUserMessage:
            $("#statusUserMessage"),

        statusUserId:
            $("#statusUserId"),

        statusNewValue:
            $("#statusNewValue"),

        cancelStatusUserButton:
            $("#cancelStatusUserButton"),

        confirmStatusUserButton:
            $("#confirmStatusUserButton"),


        /* Toast */
        adminToast:
            $("#adminToast"),

        toastTitle:
            $("#toastTitle"),

        toastMessage:
            $("#toastMessage"),

        closeToastButton:
            $("#closeToastButton")
    };

    document.addEventListener("click", (event) => {
        const trigger = event.target.closest("#openCreateUserButton");

        if (trigger) {
            openCreateUserModal();
        }
    });


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }


    async function initialize() {

        try {

            if ("scrollRestoration" in history) {
                history.scrollRestoration = "manual";
            }

            /*
             * Protect Admin page.
             *
             * IMPORTANT:
             * This will keep Admin on users.html.
             */

            const allowed =
                await MsongolaAuth.protectPage({
                    roles: ["ADMIN"]
                });


            if (!allowed) {
                return;
            }


            setCurrentYear();

            initializeEvents();

            await loadUsers();

            document.documentElement.style.scrollBehavior = "auto";
            window.scrollTo(0, 0);

        } catch (error) {

            console.error(
                "Users page initialization error:",
                error
            );

            showToast(
                "Hitilafu",
                "Imeshindikana kuanzisha ukurasa wa watumiaji.",
                "error"
            );
        }
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function initializeEvents() {

        /* Search */

        if (elements.userSearch) {

            elements.userSearch.addEventListener(
                "input",
                handleFilters
            );
        }


        /* Role filter */

        if (elements.roleFilter) {

            elements.roleFilter.addEventListener(
                "change",
                handleFilters
            );
        }


        /* Status filter */

        if (elements.statusFilter) {

            elements.statusFilter.addEventListener(
                "change",
                handleFilters
            );
        }


        /* Reset filters */

        if (elements.resetFiltersButton) {

            elements.resetFiltersButton.addEventListener(
                "click",
                resetFilters
            );
        }


        /* Pagination */

        if (elements.previousPageButton) {

            elements.previousPageButton.addEventListener(
                "click",
                goToPreviousPage
            );
        }


        if (elements.nextPageButton) {

            elements.nextPageButton.addEventListener(
                "click",
                goToNextPage
            );
        }


        /* Create User */

        if (elements.openCreateUserButton) {

            elements.openCreateUserButton.addEventListener(
                "click",
                openCreateUserModal
            );
        }


        if (elements.closeCreateUserButton) {

            elements.closeCreateUserButton.addEventListener(
                "click",
                closeCreateUserModal
            );
        }


        if (elements.cancelCreateUserButton) {

            elements.cancelCreateUserButton.addEventListener(
                "click",
                closeCreateUserModal
            );
        }


        if (elements.createUserForm) {

            elements.createUserForm.addEventListener(
                "submit",
                handleCreateUser
            );
        }


        /* Edit User */

        if (elements.closeEditUserButton) {

            elements.closeEditUserButton.addEventListener(
                "click",
                closeEditUserModal
            );
        }


        if (elements.cancelEditUserButton) {

            elements.cancelEditUserButton.addEventListener(
                "click",
                closeEditUserModal
            );
        }


        if (elements.editUserForm) {

            elements.editUserForm.addEventListener(
                "submit",
                handleEditUser
            );
        }


        /* Password */

        if (elements.closePasswordUserButton) {

            elements.closePasswordUserButton.addEventListener(
                "click",
                closePasswordUserModal
            );
        }


        if (elements.cancelPasswordUserButton) {

            elements.cancelPasswordUserButton.addEventListener(
                "click",
                closePasswordUserModal
            );
        }


        if (elements.passwordUserForm) {

            elements.passwordUserForm.addEventListener(
                "submit",
                handleChangePassword
            );
        }


        /* Status */

        if (elements.cancelStatusUserButton) {

            elements.cancelStatusUserButton.addEventListener(
                "click",
                closeStatusUserModal
            );
        }


        if (elements.confirmStatusUserButton) {

            elements.confirmStatusUserButton.addEventListener(
                "click",
                handleStatusChange
            );
        }


        /* Toast */

        if (elements.closeToastButton) {

            elements.closeToastButton.addEventListener(
                "click",
                hideToast
            );
        }


        /* Close modal when clicking backdrop */

        [
            elements.createUserModal,
            elements.editUserModal,
            elements.passwordUserModal,
            elements.statusUserModal
        ].forEach((modal) => {

            if (!modal) {
                return;
            }


            modal.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target === modal
                    ) {

                        closeModal(modal);
                    }
                }
            );
        });


        /* ESC closes modal */

        document.addEventListener(
            "keydown",
            (event) => {

                if (event.key !== "Escape") {
                    return;
                }


                closeCreateUserModal();
                closeEditUserModal();
                closePasswordUserModal();
                closeStatusUserModal();
            }
        );


        /*
         * Password visibility buttons.
         *
         * Supports any button in HTML with:
         * data-password-toggle="inputId"
         */

        $$("[data-password-toggle]")
            .forEach((button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const targetId =
                            button.dataset.passwordToggle;

                        togglePassword(
                            targetId,
                            button
                        );
                    }
                );
            });
    }


    /* =====================================================
       LOAD USERS
    ===================================================== */

    async function loadUsers() {

        if (isLoading) {
            return;
        }


        isLoading = true;

        showTableLoading();


        try {

            const response =
                await MsongolaAPI.get(
                    "/users"
                );


            allUsers =
                extractUsersFromResponse(
                    response
                );


            /*
             * Make sure we always have
             * an array.
             */

            if (!Array.isArray(allUsers)) {
                allUsers = [];
            }


            /*
             * Normalize user objects.
             */

            allUsers =
                allUsers.map(
                    normalizeUser
                );


            filteredUsers =
                [...allUsers];


            currentPage = 1;


            updateStatistics();

            renderUsers();

        } catch (error) {

            console.error(
                "Load users error:",
                error
            );


            if (error.status === 401) {

                MsongolaAuth.clearSession();

                MsongolaAuth.redirectToLogin();

                return;
            }


            showTableError(
                error.message ||
                "Imeshindikana kupata watumiaji."
            );


            showToast(
                "Hitilafu",
                error.message ||
                "Imeshindikana kupata watumiaji.",
                "error"
            );

        } finally {

            isLoading = false;
        }
    }


    /* =====================================================
       EXTRACT USERS FROM API RESPONSE
    ===================================================== */

    function extractUsersFromResponse(
        response
    ) {

        if (!response) {
            return [];
        }


        /*
         * Possible backend responses:
         *
         * {
         *   success: true,
         *   data: [...]
         * }
         *
         * OR
         *
         * {
         *   success: true,
         *   data: {
         *      users: [...]
         *   }
         * }
         *
         * OR
         *
         * {
         *   users: [...]
         * }
         */


        if (Array.isArray(response.data)) {

            return response.data;
        }


        if (
            response.data &&
            Array.isArray(response.data.users)
        ) {

            return response.data.users;
        }


        if (Array.isArray(response.users)) {

            return response.users;
        }


        return [];
    }


    /* =====================================================
       NORMALIZE USER
    ===================================================== */

    function normalizeUser(user) {

        return {

            id:
                user.id ??
                user.user_id ??
                user.userId,

            username:
                user.username ??
                "",

            role:
                normalizeRole(
                    user.role
                ),

            status:
                normalizeStatus(
                    user.status
                ),

            created_at:
                user.created_at ??
                user.createdAt ??
                null,

            updated_at:
                user.updated_at ??
                user.updatedAt ??
                null
        };
    }


    /* =====================================================
       ROLE NORMALIZER
    ===================================================== */

    function normalizeRole(role) {

        return String(
            role || ""
        )
            .trim()
            .toUpperCase();
    }


    /* =====================================================
       STATUS NORMALIZER
    ===================================================== */

    function normalizeStatus(status) {

        const normalized =
            String(
                status || ""
            )
                .trim()
                .toUpperCase();


        if (
            normalized === "ACTIVE"
        ) {

            return "ACTIVE";
        }


        if (
            normalized === "INACTIVE"
        ) {

            return "INACTIVE";
        }


        return normalized || "INACTIVE";
    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateStatistics() {

        const total =
            allUsers.length;


        const active =
            allUsers.filter(
                user =>
                    user.status === "ACTIVE"
            ).length;


        const inactive =
            allUsers.filter(
                user =>
                    user.status === "INACTIVE"
            ).length;


        const academicMasters =
            allUsers.filter(
                user =>
                    user.role === "ACADEMIC_MASTER"
            ).length;


        const teachers =
            allUsers.filter(
                user =>
                    user.role === "SUBJECT_TEACHER"
            ).length;


        setText(
            elements.usersTotal,
            total
        );


        setText(
            elements.usersActive,
            active
        );


        setText(
            elements.usersInactive,
            inactive
        );


        setText(
            elements.academicMasterCount,
            academicMasters
        );


        setText(
            elements.teacherCount,
            teachers
        );
    }


    /* =====================================================
       FILTERS
    ===================================================== */

    function handleFilters() {

        const search =
            String(
                elements.userSearch?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const selectedRole =
            normalizeRole(
                elements.roleFilter?.value ||
                ""
            );


        const selectedStatus =
            normalizeStatus(
                elements.statusFilter?.value ||
                ""
            );


        filteredUsers =
            allUsers.filter(
                (user) => {

                    const matchesSearch =
                        !search ||
                        user.username
                            .toLowerCase()
                            .includes(search);


                    const matchesRole =
                        !selectedRole ||
                        selectedRole === "ALL" ||
                        user.role === selectedRole;


                    const matchesStatus =
                        !selectedStatus ||
                        selectedStatus === "ALL" ||
                        user.status === selectedStatus;


                    return (
                        matchesSearch &&
                        matchesRole &&
                        matchesStatus
                    );
                }
            );


        currentPage = 1;

        renderUsers();
    }


    /* =====================================================
       RESET FILTERS
    ===================================================== */

    function resetFilters() {

        if (elements.userSearch) {
            elements.userSearch.value = "";
        }


        if (elements.roleFilter) {
            elements.roleFilter.value = "";
        }


        if (elements.statusFilter) {
            elements.statusFilter.value = "";
        }


        filteredUsers =
            [...allUsers];


        currentPage = 1;

        renderUsers();
    }


    /* =====================================================
       RENDER USERS
    ===================================================== */

    function renderUsers() {

        if (!elements.usersTableBody) {
            return;
        }


        const totalResults =
            filteredUsers.length;


        setText(
            elements.usersResultCount,
            `${totalResults} mtumiaji`
        );


        /*
         * Empty result
         */

        if (totalResults === 0) {

            elements.usersTableBody.innerHTML =
                "";


            showElement(
                elements.usersEmptyState
            );


            updatePagination(
                0,
                0
            );


            return;
        }


        hideElement(
            elements.usersEmptyState
        );


        const totalPages =
            Math.ceil(
                totalResults /
                PAGE_SIZE
            );


        /*
         * Prevent invalid page.
         */

        if (
            currentPage >
            totalPages
        ) {

            currentPage =
                totalPages;
        }


        const startIndex =
            (currentPage - 1) *
            PAGE_SIZE;


        const endIndex =
            startIndex +
            PAGE_SIZE;


        const pageUsers =
            filteredUsers.slice(
                startIndex,
                endIndex
            );


        elements.usersTableBody.innerHTML =
            pageUsers
                .map(
                    renderUserRow
                )
                .join("");


        updatePagination(
            totalResults,
            totalPages
        );


        initializeTableActions();
    }


    /* =====================================================
       USER ROW
    ===================================================== */

    function renderUserRow(user) {

        const id =
            escapeHtml(
                String(
                    user.id ?? ""
                )
            );


        const username =
            escapeHtml(
                user.username
            );


        const roleLabel =
            getRoleLabel(
                user.role
            );


        const statusLabel =
            getStatusLabel(
                user.status
            );


        const createdDate =
            formatDate(
                user.created_at
            );


        return `
            <tr>

                <td>
                    <div class="user-table-user">

                        <div class="user-avatar">
                            ${getInitial(
                                user.username
                            )}
                        </div>

                        <div class="user-table-user-info">

                            <strong>
                                ${username}
                            </strong>

                            <span>
                                ID: ${id}
                            </span>

                        </div>

                    </div>
                </td>


                <td>
                    <span class="user-role-badge role-${user.role.toLowerCase()}">
                        ${roleLabel}
                    </span>
                </td>


                <td>
                    <span class="user-status-badge status-${user.status.toLowerCase()}">

                        <span class="status-dot"></span>

                        ${statusLabel}

                    </span>
                </td>


                <td>
                    ${createdDate}
                </td>


                <td>

                    <div class="user-actions">

                        <button
                            type="button"
                            class="user-action-btn edit"
                            data-user-action="edit"
                            data-user-id="${id}"
                            title="Hariri mtumiaji"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>


                        <button
                            type="button"
                            class="user-action-btn password"
                            data-user-action="password"
                            data-user-id="${id}"
                            title="Badili password"
                        >
                            <i class="fa-solid fa-key"></i>
                        </button>


                        <button
                            type="button"
                            class="user-action-btn status"
                            data-user-action="status"
                            data-user-id="${id}"
                            title="${
                                user.status === "ACTIVE"
                                    ? "Deactivate"
                                    : "Activate"
                            }"
                        >
                            <i class="fa-solid ${
                                user.status === "ACTIVE"
                                    ? "fa-user-slash"
                                    : "fa-user-check"
                            }"></i>
                        </button>

                    </div>

                </td>

            </tr>
        `;
    }


    /* =====================================================
       TABLE ACTIONS
    ===================================================== */

    function initializeTableActions() {

        $$(
            "[data-user-action]"
        ).forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.userAction;


                        const userId =
                            button.dataset.userId;


                        if (!userId) {
                            return;
                        }


                        handleUserAction(
                            action,
                            userId
                        );
                    }
                );
            }
        );
    }


    /* =====================================================
       USER ACTION ROUTER
    ===================================================== */

    function handleUserAction(
        action,
        userId
    ) {

        const user =
            findUserById(
                userId
            );


        if (!user) {

            showToast(
                "Hitilafu",
                "Mtumiaji hakupatikana.",
                "error"
            );

            return;
        }


        selectedUser =
            user;


        switch (action) {

            case "edit":

                openEditUserModal(
                    user
                );

                break;


            case "password":

                openPasswordUserModal(
                    user
                );

                break;


            case "status":

                openStatusUserModal(
                    user
                );

                break;


            default:

                console.warn(
                    "Unknown user action:",
                    action
                );
        }
    }


    /* =====================================================
       FIND USER
    ===================================================== */

    function findUserById(id) {

        return allUsers.find(
            user =>
                String(user.id) ===
                String(id)
        );
    }


    /* =====================================================
       CREATE USER MODAL
    ===================================================== */

    function openCreateUserModal() {

        resetCreateUserForm();

        hideAlert(
            elements.createUserAlert
        );


        showModal(
            elements.createUserModal
        );


        setTimeout(
            () => {

                elements.createUsername
                    ?.focus();

            },
            100
        );
    }


    function closeCreateUserModal() {

        closeModal(
            elements.createUserModal
        );

        resetCreateUserForm();

        hideAlert(
            elements.createUserAlert
        );
    }


    function resetCreateUserForm() {

        if (
            elements.createUserForm
        ) {

            elements.createUserForm.reset();
        }


        if (
            elements.createStatus
        ) {

            elements.createStatus.value =
                "ACTIVE";
        }
    }


    /* =====================================================
       CREATE USER
    ===================================================== */

    async function handleCreateUser(
        event
    ) {

        event.preventDefault();


        const username =
            String(
                elements.createUsername?.value ||
                ""
            )
                .trim();


        const password =
            String(
                elements.createPassword?.value ||
                ""
            );


        const confirmPassword =
            String(
                elements.confirmPassword?.value ||
                ""
            );


        const role =
            normalizeRole(
                elements.createRole?.value ||
                ""
            );


        const status =
            normalizeStatus(
                elements.createStatus?.value ||
                "ACTIVE"
            );


        /*
         * Validation
         */

        if (!username) {

            showAlert(
                elements.createUserAlert,
                "Username inahitajika."
            );

            return;
        }


        if (username.length < 3) {

            showAlert(
                elements.createUserAlert,
                "Username lazima iwe na angalau herufi 3."
            );

            return;
        }


        if (!password) {

            showAlert(
                elements.createUserAlert,
                "Password inahitajika."
            );

            return;
        }


        if (password.length < 8) {

            showAlert(
                elements.createUserAlert,
                "Password lazima iwe na angalau characters 8."
            );

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            showAlert(
                elements.createUserAlert,
                "Password mbili hazifanani."
            );

            return;
        }


        if (
            ![
                "ACADEMIC_MASTER",
                "SUBJECT_TEACHER"
            ].includes(role)
        ) {

            showAlert(
                elements.createUserAlert,
                "Chagua role sahihi."
            );

            return;
        }


        setButtonLoading(
            elements.createUserSubmitButton,
            true,
            "Inatengeneza..."
        );


        try {

            const response =
                await MsongolaAPI.post(
                    "/users",
                    {
                        username,
                        password,
                        role,
                        status
                    }
                );


            if (
                !response ||
                response.success === false
            ) {

                throw new Error(
                    response?.message ||
                    "Imeshindikana kutengeneza user."
                );
            }


            closeCreateUserModal();


            showToast(
                "Imefanikiwa",
                "Mtumiaji ameongezwa kikamilifu.",
                "success"
            );


            await loadUsers();

        } catch (error) {

            console.error(
                "Create user error:",
                error
            );


            showAlert(
                elements.createUserAlert,
                error.message ||
                "Imeshindikana kutengeneza user."
            );

        } finally {

            setButtonLoading(
                elements.createUserSubmitButton,
                false
            );
        }
    }


    /* =====================================================
       EDIT USER MODAL
    ===================================================== */

    function openEditUserModal(
        user
    ) {

        hideAlert(
            elements.editUserAlert
        );


        if (
            elements.editUserId
        ) {

            elements.editUserId.value =
                user.id;
        }


        if (
            elements.editUsername
        ) {

            elements.editUsername.value =
                user.username;
        }


        if (
            elements.editRole
        ) {

            elements.editRole.value =
                user.role;
        }


        showModal(
            elements.editUserModal
        );


        setTimeout(
            () => {

                elements.editUsername
                    ?.focus();

            },
            100
        );
    }


    function closeEditUserModal() {

        closeModal(
            elements.editUserModal
        );

        hideAlert(
            elements.editUserAlert
        );
    }


    /* =====================================================
       EDIT USER
    ===================================================== */

    async function handleEditUser(
        event
    ) {

        event.preventDefault();


        const userId =
            elements.editUserId?.value;


        const username =
            String(
                elements.editUsername?.value ||
                ""
            )
                .trim();


        const role =
            normalizeRole(
                elements.editRole?.value ||
                ""
            );


        if (!userId) {

            showAlert(
                elements.editUserAlert,
                "User ID haijapatikana."
            );

            return;
        }


        if (!username) {

            showAlert(
                elements.editUserAlert,
                "Username inahitajika."
            );

            return;
        }


        if (username.length < 3) {

            showAlert(
                elements.editUserAlert,
                "Username lazima iwe na angalau herufi 3."
            );

            return;
        }


        if (
            ![
                "ACADEMIC_MASTER",
                "SUBJECT_TEACHER"
            ].includes(role)
        ) {

            showAlert(
                elements.editUserAlert,
                "Chagua role sahihi."
            );

            return;
        }


        setButtonLoading(
            elements.editUserSubmitButton,
            true,
            "Inahifadhi..."
        );


        try {

            const response =
                await MsongolaAPI.put(
                    `/users/${encodeURIComponent(userId)}`,
                    {
                        username,
                        role
                    }
                );


            if (
                !response ||
                response.success === false
            ) {

                throw new Error(
                    response?.message ||
                    "Imeshindikana kusasisha user."
                );
            }


            closeEditUserModal();


            showToast(
                "Imefanikiwa",
                "Taarifa za mtumiaji zimesasishwa.",
                "success"
            );


            await loadUsers();

        } catch (error) {

            console.error(
                "Edit user error:",
                error
            );


            showAlert(
                elements.editUserAlert,
                error.message ||
                "Imeshindikana kusasisha user."
            );

        } finally {

            setButtonLoading(
                elements.editUserSubmitButton,
                false
            );
        }
    }


    /* =====================================================
       PASSWORD MODAL
    ===================================================== */

    function openPasswordUserModal(
        user
    ) {

        hideAlert(
            elements.passwordUserAlert
        );


        if (
            elements.passwordUserForm
        ) {

            elements.passwordUserForm.reset();
        }


        if (
            elements.passwordUserId
        ) {

            elements.passwordUserId.value =
                user.id;
        }


        showModal(
            elements.passwordUserModal
        );


        setTimeout(
            () => {

                elements.newUserPassword
                    ?.focus();

            },
            100
        );
    }


    function closePasswordUserModal() {

        closeModal(
            elements.passwordUserModal
        );

        hideAlert(
            elements.passwordUserAlert
        );
    }


    /* =====================================================
       CHANGE PASSWORD
    ===================================================== */

    async function handleChangePassword(
        event
    ) {

        event.preventDefault();


        const userId =
            elements.passwordUserId?.value;


        const password =
            String(
                elements.newUserPassword?.value ||
                ""
            );


        const confirmPassword =
            String(
                elements.confirmNewUserPassword?.value ||
                ""
            );


        if (!userId) {

            showAlert(
                elements.passwordUserAlert,
                "User ID haijapatikana."
            );

            return;
        }


        if (!password) {

            showAlert(
                elements.passwordUserAlert,
                "Password mpya inahitajika."
            );

            return;
        }


        if (password.length < 8) {

            showAlert(
                elements.passwordUserAlert,
                "Password lazima iwe na angalau characters 8."
            );

            return;
        }


        if (
            password !==
            confirmPassword
        ) {

            showAlert(
                elements.passwordUserAlert,
                "Password mbili hazifanani."
            );

            return;
        }


        setButtonLoading(
            elements.passwordUserSubmitButton,
            true,
            "Inabadilisha..."
        );


        try {

            const response =
                await MsongolaAPI.patch(
                    `/users/${encodeURIComponent(userId)}/password`,
                    {
                        password
                    }
                );


            if (
                !response ||
                response.success === false
            ) {

                throw new Error(
                    response?.message ||
                    "Imeshindikana kubadili password."
                );
            }


            closePasswordUserModal();


            showToast(
                "Imefanikiwa",
                "Password imebadilishwa kikamilifu.",
                "success"
            );


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );


            showAlert(
                elements.passwordUserAlert,
                error.message ||
                "Imeshindikana kubadili password."
            );

        } finally {

            setButtonLoading(
                elements.passwordUserSubmitButton,
                false
            );
        }
    }


    /* =====================================================
       STATUS MODAL
    ===================================================== */

    function openStatusUserModal(
        user
    ) {

        selectedUser =
            user;


        const newStatus =
            user.status === "ACTIVE"
                ? "INACTIVE"
                : "ACTIVE";


        if (
            elements.statusUserId
        ) {

            elements.statusUserId.value =
                user.id;
        }


        if (
            elements.statusNewValue
        ) {

            elements.statusNewValue.value =
                newStatus;
        }


        if (
            elements.statusUserModalTitle
        ) {

            elements.statusUserModalTitle.textContent =
                newStatus === "ACTIVE"
                    ? "Activate Mtumiaji"
                    : "Deactivate Mtumiaji";
        }


        if (
            elements.statusUserMessage
        ) {

            elements.statusUserMessage.textContent =
                newStatus === "ACTIVE"

                    ? `Una uhakika unataka kumrudisha "${user.username}" kuwa ACTIVE?`

                    : `Una uhakika unataka kumuweka "${user.username}" kuwa INACTIVE?`;
        }


        showModal(
            elements.statusUserModal
        );
    }


    function closeStatusUserModal() {

        closeModal(
            elements.statusUserModal
        );

        selectedUser =
            null;
    }


    /* =====================================================
       CHANGE STATUS
    ===================================================== */

    async function handleStatusChange() {

        const userId =
            elements.statusUserId?.value;


        const newStatus =
            normalizeStatus(
                elements.statusNewValue?.value ||
                ""
            );


        if (!userId) {

            showToast(
                "Hitilafu",
                "User ID haijapatikana.",
                "error"
            );

            return;
        }


        if (
            ![
                "ACTIVE",
                "INACTIVE"
            ].includes(newStatus)
        ) {

            showToast(
                "Hitilafu",
                "Status sio sahihi.",
                "error"
            );

            return;
        }


        setButtonLoading(
            elements.confirmStatusUserButton,
            true,
            "Inabadilisha..."
        );


        try {

            const response =
                await MsongolaAPI.patch(
                    `/users/${encodeURIComponent(userId)}/status`,
                    {
                        status: newStatus
                    }
                );


            if (
                !response ||
                response.success === false
            ) {

                throw new Error(
                    response?.message ||
                    "Imeshindikana kubadili status."
                );
            }


            closeStatusUserModal();


            showToast(
                "Imefanikiwa",
                newStatus === "ACTIVE"
                    ? "Mtumiaji ame-activate."
                    : "Mtumiaji ame-deactivate.",
                "success"
            );


            await loadUsers();

        } catch (error) {

            console.error(
                "Status change error:",
                error
            );


            showToast(
                "Hitilafu",
                error.message ||
                "Imeshindikana kubadili status.",
                "error"
            );

        } finally {

            setButtonLoading(
                elements.confirmStatusUserButton,
                false
            );
        }
    }


    /* =====================================================
       PAGINATION
    ===================================================== */

    function updatePagination(
        totalResults,
        totalPages
    ) {

        if (
            elements.currentPageNumber
        ) {

            elements.currentPageNumber.textContent =
                totalPages > 0
                    ? currentPage
                    : 0;
        }


        if (
            elements.paginationInfo
        ) {

            if (totalResults === 0) {

                elements.paginationInfo.textContent =
                    "Hakuna watumiaji";

            } else {

                const start =
                    (
                        (currentPage - 1) *
                        PAGE_SIZE
                    ) + 1;


                const end =
                    Math.min(
                        currentPage *
                        PAGE_SIZE,
                        totalResults
                    );


                elements.paginationInfo.textContent =
                    `Inaonyesha ${start}–${end} kati ya ${totalResults}`;
            }
        }


        if (
            elements.previousPageButton
        ) {

            elements.previousPageButton.disabled =
                currentPage <= 1 ||
                totalPages === 0;
        }


        if (
            elements.nextPageButton
        ) {

            elements.nextPageButton.disabled =
                currentPage >= totalPages ||
                totalPages === 0;
        }
    }


    function goToPreviousPage() {

        if (currentPage <= 1) {
            return;
        }


        currentPage--;

        renderUsers();
    }


    function goToNextPage() {

        const totalPages =
            Math.ceil(
                filteredUsers.length /
                PAGE_SIZE
            );


        if (
            currentPage >=
            totalPages
        ) {

            return;
        }


        currentPage++;

        renderUsers();
    }


    /* =====================================================
       MODALS
    ===================================================== */

    function showModal(
        modal
    ) {

        if (!modal) {
            return;
        }


        modal.classList.add(
            "is-open"
        );

        modal.hidden = false;


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "modal-open"
        );
    }


    function closeModal(
        modal
    ) {

        if (!modal) {
            return;
        }


        modal.classList.remove(
            "is-open"
        );

        modal.hidden = true;


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        /*
         * Only remove body class when
         * all modals are closed.
         */

        const openModals =
            document.querySelectorAll(
                ".modal.is-open"
            );


        if (openModals.length === 0) {

            document.body.classList.remove(
                "modal-open"
            );
        }
    }


    /* =====================================================
       PASSWORD TOGGLE
    ===================================================== */

    function togglePassword(
        targetId,
        button
    ) {

        const input =
            document.getElementById(
                targetId
            );


        if (!input) {
            return;
        }


        if (
            input.type ===
            "password"
        ) {

            input.type =
                "text";


            button.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';

        } else {

            input.type =
                "password";


            button.innerHTML =
                '<i class="fa-solid fa-eye"></i>';
        }
    }


    /* =====================================================
       ALERTS
    ===================================================== */

    function showAlert(
        element,
        message
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            message;

        element.hidden = false;


        element.classList.add(
            "show"
        );
    }


    function hideAlert(
        element
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            "";

        element.hidden = true;


        element.classList.remove(
            "show"
        );
    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer = null;


    function showToast(
        title,
        message,
        type = "success"
    ) {

        if (
            !elements.adminToast
        ) {

            return;
        }


        setText(
            elements.toastTitle,
            title
        );


        setText(
            elements.toastMessage,
            message
        );


        elements.adminToast.classList.remove(
            "success",
            "error",
            "warning",
            "info"
        );


        elements.adminToast.classList.add(
            type
        );


        elements.adminToast.classList.add(
            "show"
        );

        elements.adminToast.hidden = false;


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                hideToast,
                5000
            );
    }


    function hideToast() {

        if (
            !elements.adminToast
        ) {

            return;
        }


        elements.adminToast.classList.remove(
            "show"
        );

        elements.adminToast.hidden = true;
    }


    /* =====================================================
       LOADING TABLE
    ===================================================== */

    function showTableLoading() {

        if (
            !elements.usersTableBody
        ) {

            return;
        }


        hideElement(
            elements.usersEmptyState
        );


        elements.usersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-loading-cell"
                >
                    <div class="loading-state">

                        <div class="loading-spinner"></div>

                        <span>
                            Inapakia watumiaji...
                        </span>

                    </div>
                </td>
            </tr>
        `;
    }


    /* =====================================================
       TABLE ERROR
    ===================================================== */

    function showTableError(
        message
    ) {

        if (
            !elements.usersTableBody
        ) {

            return;
        }


        elements.usersTableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="table-error-cell"
                >
                    <div class="empty-state-content">

                        <div class="empty-state-icon">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                        </div>

                        <h3>
                            Imeshindikana kupata data
                        </h3>

                        <p>
                            ${escapeHtml(message)}
                        </p>

                        <button
                            type="button"
                            class="btn btn-primary"
                            id="retryUsersButton"
                        >
                            <i class="fa-solid fa-rotate-right"></i>
                            Jaribu Tena
                        </button>

                    </div>
                </td>
            </tr>
        `;


        const retryButton =
            $("#retryUsersButton");


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadUsers
            );
        }
    }


    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    function setButtonLoading(
        button,
        loading,
        loadingText = "Inapakia..."
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            if (
                !button.dataset.originalText
            ) {

                button.dataset.originalText =
                    button.innerHTML;
            }


            button.disabled =
                true;


            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                ${loadingText}
            `;

        } else {

            button.disabled =
                false;


            if (
                button.dataset.originalText
            ) {

                button.innerHTML =
                    button.dataset.originalText;

                delete button.dataset.originalText;
            }
        }
    }


    /* =====================================================
       UI HELPERS
    ===================================================== */

    function setText(
        element,
        value
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            value ?? "";
    }


    function showElement(
        element
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            false;


        element.style.display =
            "";
    }


    function hideElement(
        element
    ) {

        if (!element) {
            return;
        }


        element.hidden =
            true;
    }


    /* =====================================================
       ROLE LABEL
    ===================================================== */

    function getRoleLabel(
        role
    ) {

        switch (
            normalizeRole(role)
        ) {

            case "ADMIN":
                return "Admin";


            case "ACADEMIC_MASTER":
                return "Academic Master";


            case "SUBJECT_TEACHER":
                return "Subject Teacher";


            default:
                return role || "Unknown";
        }
    }


    /* =====================================================
       STATUS LABEL
    ===================================================== */

    function getStatusLabel(
        status
    ) {

        return normalizeStatus(status) ===
            "ACTIVE"
            ? "Active"
            : "Inactive";
    }


    /* =====================================================
       INITIAL
    ===================================================== */

    function getInitial(
        username
    ) {

        const value =
            String(
                username || "U"
            )
                .trim();


        if (!value) {
            return "U";
        }


        return escapeHtml(
            value
                .charAt(0)
                .toUpperCase()
        );
    }


    /* =====================================================
       DATE
    ===================================================== */

    function formatDate(
        value
    ) {

        if (!value) {
            return "—";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return date.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       CURRENT YEAR
    ===================================================== */

    function setCurrentYear() {

        const year =
            new Date().getFullYear();


        $$(
            "[data-current-year]"
        ).forEach(
            element => {

                element.textContent =
                    year;
            }
        );
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
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


    /* =====================================================
       PUBLIC DEBUG API
    ===================================================== */

    window.MsongolaUsers = {

        reload:
            loadUsers,

        getUsers:
            () => [...allUsers],

        getFilteredUsers:
            () => [...filteredUsers],

        refresh:
            loadUsers

    };

})();