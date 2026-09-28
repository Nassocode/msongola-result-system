(() => {
    "use strict";

    const state = {
        students: [],
        currentUser: null
    };

    const sidebar =
        document.getElementById("sidebar");

    const menuToggle =
        document.getElementById("menuToggle");

    const sidebarClose =
        document.getElementById("sidebarClose");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");

    const logoutBtn =
        document.getElementById("logoutBtn");


    const currentYear =
        document.getElementById("currentYear");

    function renderCurrentUser(user) {
        if (!user) {
            return;
        }

        state.currentUser = user;

        const sidebarUsername = document.getElementById("sidebarUsername");
        const topbarUsername = document.getElementById("topbarUsername");
        const sidebarAvatar = document.getElementById("sidebarAvatar");
        const topbarAvatar = document.getElementById("topbarAvatar");

        const displayName = user.full_name || user.name || user.username || "Academic Master";
        const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "AM";

        if (sidebarUsername) {
            sidebarUsername.textContent = displayName;
        }

        if (topbarUsername) {
            topbarUsername.textContent = displayName;
        }

        if (sidebarAvatar) {
            sidebarAvatar.textContent = initials;
        }

        if (topbarAvatar) {
            topbarAvatar.textContent = initials;
        }
    }

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       SIDEBAR
    ===================================================== */

    function openSidebar() {

        sidebar?.classList.add(
            "sidebar-open"
        );

        sidebarOverlay?.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeSidebar() {

        sidebar?.classList.remove(
            "sidebar-open"
        );

        sidebarOverlay?.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "";
    }


    menuToggle?.addEventListener(
        "click",
        openSidebar
    );


    sidebarClose?.addEventListener(
        "click",
        closeSidebar
    );


    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    document
        .querySelectorAll(".sidebar .nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <= 900
                    ) {

                        closeSidebar();

                    }

                }
            );

        });


    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth > 900) {

                closeSidebar();

            }

        }
    );


    /* =====================================================
       LOGOUT
    ===================================================== */

    logoutBtn?.addEventListener(
        "click",
        () => {

            const confirmed =
                confirm(
                    "Unataka kutoka kwenye mfumo?"
                );


            if (!confirmed) {

                return;

            }


            MsongolaAuth.logout();

        }
    );


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    const formFilter =
        document.getElementById(
            "formFilter"
        );


    const genderFilter =
        document.getElementById(
            "genderFilter"
        );


    const clearFiltersBtn =
        document.getElementById(
            "clearFiltersBtn"
        );


    const emptyClearBtn =
        document.getElementById(
            "emptyClearBtn"
        );


    const refreshStudentsBtn =
        document.getElementById(
            "refreshStudentsBtn"
        );


    const studentsTableBody =
        document.getElementById(
            "studentsTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyState"
        );


    const loading =
        document.getElementById(
            "loading"
        );


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    const errorText =
        document.getElementById(
            "errorText"
        );


    const closeErrorBtn =
        document.getElementById(
            "closeErrorBtn"
        );


    const successMessage =
        document.getElementById(
            "successMessage"
        );


    const successText =
        document.getElementById(
            "successText"
        );


    const closeSuccessBtn =
        document.getElementById(
            "closeSuccessBtn"
        );


    /* =====================================================
       MODALS
    ===================================================== */

    const addStudentModal =
        document.getElementById(
            "addStudentModal"
        );


    const viewStudentModal =
        document.getElementById(
            "viewStudentModal"
        );


    const openAddStudentBtn =
        document.getElementById(
            "openAddStudentBtn"
        );


    const addStudentForm =
        document.getElementById(
            "addStudentForm"
        );


    /* =====================================================
       API LAYER
    ===================================================== */

    async function loadStudents() {
        try {
            const response = await MsongolaAPI.get("/students");

            if (!response || !response.success) {
                throw new Error(response?.message || "Students data unavailable");
            }

            state.students = Array.isArray(response.data) ? response.data : [];
            renderStudents();
            updateStatistics();
        } catch (error) {
            console.error("Load students error:", error);
            state.students = [];
            emptyState.hidden = false;
            showError(error.message || "Imeshindikana kupakua wanafunzi.");
        }
    }

    async function createStudentRecord(studentData) {
        const response = await MsongolaAPI.post("/students", studentData);

        if (!response || !response.success) {
            throw new Error(response?.message || "Student creation failed");
        }

        return response.data;
    }


    /* =====================================================
       MODAL FUNCTIONS
    ===================================================== */

    function openModal(modal) {

        if (!modal) return;

        modal.hidden = false;

        document.body.style.overflow =
            "hidden";

    }


    function closeModal(modal) {

        if (!modal) return;

        modal.hidden = true;

        document.body.style.overflow =
            "";

    }


    openAddStudentBtn?.addEventListener(
        "click",
        () => {

            addStudentForm?.reset();

            openModal(
                addStudentModal
            );

            setTimeout(() => {

                document
                    .getElementById(
                        "firstName"
                    )
                    ?.focus();

            }, 100);

        }
    );


    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const modalId =
                        button.dataset
                            .closeModal;

                    const modal =
                        document.getElementById(
                            modalId
                        );

                    closeModal(modal);

                }
            );

        });


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {

                return;

            }


            closeModal(
                addStudentModal
            );

            closeModal(
                viewStudentModal
            );

        }
    );


    /* =====================================================
       ALERT FUNCTIONS
    ===================================================== */

    function showError(message) {

        if (errorText) {

            errorText.textContent =
                message;

        }


        if (errorMessage) {

            errorMessage.hidden =
                false;

        }

    }


    function hideError() {

        if (errorMessage) {

            errorMessage.hidden =
                true;

        }

    }


    function showSuccess(message) {

        if (successText) {

            successText.textContent =
                message;

        }


        if (successMessage) {

            successMessage.hidden =
                false;

        }


        setTimeout(
            hideSuccess,
            3500
        );

    }


    function hideSuccess() {

        if (successMessage) {

            successMessage.hidden =
                true;

        }

    }


    closeErrorBtn?.addEventListener(
        "click",
        hideError
    );


    closeSuccessBtn?.addEventListener(
        "click",
        hideSuccess
    );


    /* =====================================================
       HELPER FUNCTIONS
    ===================================================== */

    function getFullName(student) {

        return [
            student.first_name,
            student.middle_name,
            student.last_name
        ]
            .filter(Boolean)
            .join(" ");

    }


    function formatForm(form) {
        const value = String(form || "").trim();

        const forms = {
            FORM_1: "Form One",
            FORM_2: "Form Two",
            FORM_3: "Form Three",
            FORM_4: "Form Four",
            1: "Form One",
            2: "Form Two",
            3: "Form Three",
            4: "Form Four"
        };

        if (value && forms[value]) {
            return forms[value];
        }

        if (value && value.toUpperCase().includes("FORM_")) {
            return forms[value.toUpperCase()] || value;
        }

        return value || "—";
    }


    function formatGender(gender) {

        if (gender === "FEMALE") {

            return "Female";

        }


        if (gender === "MALE") {

            return "Male";

        }


        return gender || "—";

    }


    function getInitials(student) {

        const first =
            student.first_name
                ?.charAt(0)
                .toUpperCase() || "";


        const last =
            student.last_name
                ?.charAt(0)
                .toUpperCase() || "";


        return (
            first + last
        ) || "S";

    }


    /* =====================================================
       FILTER STUDENTS
    ===================================================== */

    function getFilteredStudents() {

        const search =
            (
                searchInput?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const selectedForm =
            formFilter?.value || "";


        const selectedGender =
            genderFilter?.value || "";


        return state.students.filter((student) => {
            const fullName = getFullName(student).toLowerCase();
            const admission = String(student.admission_number || "").toLowerCase();
            const formValue = String(student.form_number || student.form_name || "").match(/\d+/)?.[0] || "";
            const selectedFormNumber = String(selectedForm).match(/\d+/)?.[0] || "";
            const genderValue = String(student.gender || "").toUpperCase();

            const matchesSearch = !search || fullName.includes(search) || admission.includes(search);
            const matchesForm = !selectedForm || formValue === selectedFormNumber;
            const matchesGender = !selectedGender || genderValue === selectedGender;

            return matchesSearch && matchesForm && matchesGender;
        });

    }


    /* =====================================================
       RENDER STUDENTS
    ===================================================== */

    function renderStudents() {

        if (!studentsTableBody) {

            return;

        }


        const filteredStudents =
            getFilteredStudents();


        studentsTableBody.innerHTML =
            "";


        if (
            filteredStudents.length === 0
        ) {

            emptyState.hidden =
                false;

            updatePaginationInfo(0);

            return;

        }


        emptyState.hidden =
            true;


        filteredStudents.forEach(
            (student, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const fullName =
                    getFullName(student);


                const genderClass =
                    student.gender ===
                    "FEMALE"
                        ? "female"
                        : "male";


                const genderIcon =
                    student.gender ===
                    "FEMALE"
                        ? "fa-venus"
                        : "fa-mars";


                const statusClass =
                    student.status ===
                    "ACTIVE"
                        ? "active"
                        : "inactive";


                const statusText =
                    student.status ===
                    "ACTIVE"
                        ? "Active"
                        : "Inactive";


                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        <strong class="admission-number">
                            ${escapeHTML(
                                student.admission_number
                            )}
                        </strong>
                    </td>

                    <td>

                        <div class="student-name-cell">

                            <div class="student-avatar ${genderClass}">
                                ${escapeHTML(
                                    getInitials(student)
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        fullName
                                    )}
                                </strong>

                                <span>
                                    Mwanafunzi
                                </span>

                            </div>

                        </div>

                    </td>

                    <td>

                        <span class="gender-badge ${genderClass}">

                            <i class="fa-solid ${genderIcon}"></i>

                            ${formatGender(
                                student.gender
                            )}

                        </span>

                    </td>

                    <td>
                        ${formatForm(
                            student.form_name || student.form_number || ""
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            student.class_name || "—"
                        )}
                    </td>

                    <td>

                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>

                    </td>

                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="action-button view"
                                title="Angalia"
                                data-action="view"
                                data-id="${student.id}"
                            >
                                <i class="fa-solid fa-eye"></i>
                            </button>

                            <button
                                type="button"
                                class="action-button edit"
                                title="Hariri"
                                data-action="edit"
                                data-id="${student.id}"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="action-button delete"
                                title="Deactivate"
                                data-action="delete"
                                data-id="${student.id}"
                            >
                                <i class="fa-solid fa-user-slash"></i>
                            </button>

                        </div>

                    </td>

                `;


                studentsTableBody.appendChild(
                    row
                );

            }
        );


        updatePaginationInfo(
            filteredStudents.length
        );

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value ?? "";


        return div.innerHTML;

    }


    /* =====================================================
       PAGINATION INFO
    ===================================================== */

    function updatePaginationInfo(total) {

        const showingCount = document.getElementById("showingCount");

        if (showingCount) {
            showingCount.textContent = total;
        }

        const showingFrom =
            document.getElementById(
                "showingFrom"
            );


        const showingTo =
            document.getElementById(
                "showingTo"
            );


        const showingTotal =
            document.getElementById(
                "showingTotal"
            );


        if (showingTotal) {

            showingTotal.textContent =
                total;

        }


        if (total === 0) {

            if (showingFrom) {

                showingFrom.textContent =
                    "0";

            }


            if (showingTo) {

                showingTo.textContent =
                    "0";

            }

            return;

        }


        if (showingFrom) {

            showingFrom.textContent =
                "1";

        }


        if (showingTo) {

            showingTo.textContent =
                total;

        }

    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateStatistics() {

        const total = state.students.length;

        const formOne = state.students.filter((item) => {
            const form = String(item.form_name || item.form_number || "").toUpperCase();
            return form.includes("FORM 1") || form === "FORM_1" || Number(item.form_number) === 1;
        }).length;

        const formTwo = state.students.filter((item) => {
            const form = String(item.form_name || item.form_number || "").toUpperCase();
            return form.includes("FORM 2") || form === "FORM_2" || Number(item.form_number) === 2;
        }).length;

        const formThree = state.students.filter((item) => {
            const form = String(item.form_name || item.form_number || "").toUpperCase();
            return form.includes("FORM 3") || form === "FORM_3" || Number(item.form_number) === 3;
        }).length;

        const formFour = state.students.filter((item) => {
            const form = String(item.form_name || item.form_number || "").toUpperCase();
            return form.includes("FORM 4") || form === "FORM_4" || Number(item.form_number) === 4;
        }).length;


        setText(
            "totalStudents",
            total
        );


        setText(
            "formOneStudents",
            formOne
        );


        setText(
            "formTwoStudents",
            formTwo
        );


        setText(
            "formThreeStudents",
            formThree
        );


        setText(
            "formFourStudents",
            formFour
        );

    }


    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (element) {

            element.textContent =
                value;

        }

    }


    /* =====================================================
       VIEW STUDENT
    ===================================================== */

    function viewStudent(id) {

        const student =
            state.students.find(
                item =>
                    Number(item.id) === Number(id)
            );


        if (!student) {

            showError(
                "Taarifa za mwanafunzi hazijapatikana."
            );

            return;

        }


        setText(
            "viewStudentName",
            getFullName(student)
        );


        setText(
            "viewStudentAdmission",
            student.admission_number
        );


        setText(
            "viewStudentGender",
            formatGender(
                student.gender
            )
        );


        setText(
            "viewStudentDOB",
            student.date_of_birth || "—"
        );


        setText(
            "viewStudentForm",
            formatForm(
                student.form_name || student.form_number || ""
            )
        );


        setText(
            "viewStudentClass",
            student.class_name || "—"
        );


        setText(
            "viewGuardianName",
            student.guardianName ||
            "—"
        );


        setText(
            "viewGuardianPhone",
            student.guardianPhone ||
            "—"
        );


        const avatar =
            document.getElementById(
                "viewStudentAvatar"
            );


        if (avatar) {

            avatar.textContent =
                getInitials(student);

        }


        openModal(
            viewStudentModal
        );

    }


    /* =====================================================
       DELETE / DEACTIVATE
    ===================================================== */

    async function deactivateStudent(id) {

        const student =
            state.students.find(
                item =>
                    Number(item.id) === Number(id)
            );


        if (!student) {

            return;

        }


        const confirmed =
            confirm(
                `Unataka kum-deactivate ${getFullName(student)}?`
            );


        if (!confirmed) {

            return;

        }


        try {
            const response = await MsongolaAPI.patch(`/students/${id}/status`, { status: "INACTIVE" });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kubadilisha status.");
            await loadStudents();
            showSuccess("Mwanafunzi amewekwa inactive.");
        } catch (error) {
            showError(error.message || "Imeshindikana kubadilisha status ya mwanafunzi.");
        }

    }


    /* =====================================================
       TABLE ACTIONS
    ===================================================== */

    studentsTableBody?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            const id =
                Number(
                    button.dataset.id
                );


            if (action === "view") {

                viewStudent(id);

            }


            if (action === "edit") {
                window.location.href = `add-student.html?edit=${encodeURIComponent(id)}`;

            }


            if (action === "delete") {

                deactivateStudent(id);

            }

        }
    );


    /* =====================================================
       SEARCH
    ===================================================== */

    searchInput?.addEventListener(
        "input",
        renderStudents
    );


    formFilter?.addEventListener(
        "change",
        renderStudents
    );


    genderFilter?.addEventListener(
        "change",
        renderStudents
    );


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    function clearFilters() {

        if (searchInput) {

            searchInput.value = "";

        }


        if (formFilter) {

            formFilter.value = "";

        }


        if (genderFilter) {

            genderFilter.value = "";

        }


        renderStudents();

    }


    clearFiltersBtn?.addEventListener(
        "click",
        clearFilters
    );


    emptyClearBtn?.addEventListener(
        "click",
        clearFilters
    );


    /* =====================================================
       ADD STUDENT
    ===================================================== */

    addStudentForm?.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            hideError();

            const formData = new FormData(addStudentForm);

            const student = {
                admission_number: String(formData.get("admissionNumber") || "").trim().toUpperCase(),
                first_name: String(formData.get("firstName") || "").trim(),
                middle_name: String(formData.get("middleName") || "").trim(),
                last_name: String(formData.get("lastName") || "").trim(),
                gender: String(formData.get("gender") || "").trim(),
                date_of_birth: String(formData.get("dateOfBirth") || "").trim() || null,
                academic_year: String(formData.get("academicYear") || "").trim(),
                class_name: String(formData.get("studentClass") || "").trim(),
                admission_date: String(formData.get("admissionDate") || "").trim() || null,
                status: String(formData.get("studentStatus") || "ACTIVE").trim() || "ACTIVE"
            };

            if (!student.admission_number || !student.first_name || !student.last_name || !student.gender || !student.academic_year || !student.class_name) {
                showError("Tafadhali jaza sehemu zote zenye alama *.");
                return;
            }

            try {
                const createdStudent = await createStudentRecord(student);
                addStudentForm.reset();
                await loadStudents();
                showSuccess("Mwanafunzi amesajiliwa kwa mafanikio.");
                closeModal(addStudentModal);
                if (createdStudent) {
                    viewStudent(createdStudent.id);
                }
            } catch (error) {
                console.error("Create student failed:", error);
                showError(error.message || "Imeshindikana kuhifadhi mwanafunzi.");
            }
        }
    );


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    async function initializePage() {
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

        document.getElementById("topbarNotificationButton")?.addEventListener("click", () => {
            window.location.href = "notifications.html";
        });

        try {
            const notificationResponse = await MsongolaAPI.get("/notifications");
            if (notificationResponse?.success) {
                const badge = document.getElementById("notificationBadge");
                const unreadCount = Number(notificationResponse.data?.unread_count || 0);
                if (badge) {
                    badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
                    badge.style.display = unreadCount === 0 ? "none" : "flex";
                }
            }
        } catch (error) {
            console.warn("Notification count could not be loaded:", error.message);
        }

        if (refreshStudentsBtn) {
            refreshStudentsBtn.addEventListener("click", async () => {
                refreshStudentsBtn.disabled = true;
                const icon = refreshStudentsBtn.querySelector("i");
                icon?.classList.add("fa-spin");

                try {
                    await loadStudents();
                    showSuccess("Orodha ya wanafunzi ime-refresh.");
                } finally {
                    refreshStudentsBtn.disabled = false;
                    icon?.classList.remove("fa-spin");
                }
            });
        }

        updateStatistics();
        renderStudents();
        await loadStudents();
        console.log("✅ Academic Master Students page initialized");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializePage);
    } else {
        initializePage();
    }
})();