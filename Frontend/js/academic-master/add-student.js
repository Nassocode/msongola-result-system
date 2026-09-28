(() => {
    "use strict";

    const state = {
        classOptions: []
    };

    const sidebar = document.getElementById("sidebar");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const form = document.getElementById("addStudentForm");
    const saveButton = document.getElementById("saveStudentBtn");
    const formMessage = document.getElementById("formMessage");
    const admissionNumber = document.getElementById("admissionNumber");
    const firstName = document.getElementById("firstName");
    const middleName = document.getElementById("middleName");
    const lastName = document.getElementById("lastName");
    const gender = document.getElementById("gender");
    const dateOfBirth = document.getElementById("dateOfBirth");
    const academicYear = document.getElementById("academicYear");
    const studentForm = document.getElementById("studentForm");
    const studentClass = document.getElementById("studentClass");
    const admissionDate = document.getElementById("admissionDate");
    const studentStatus = document.getElementById("studentStatus");
    const editStudentId = new URLSearchParams(window.location.search).get("edit");

    function renderCurrentUser(user) {
        if (!user) return;

        const profileName = document.querySelector(".profile-info strong");
        const topbarName = document.querySelector(".topbar-user-info strong");
        const profileText = document.querySelector(".profile-info span");
        const topbarText = document.querySelector(".topbar-user-info span");

        const displayName = user.full_name || user.name || user.username || "Academic Master";

        if (profileName) profileName.textContent = displayName;
        if (topbarName) topbarName.textContent = displayName;
        if (profileText) profileText.textContent = "Academic Master";
        if (topbarText) topbarText.textContent = "Academic Master";
    }

    function showMessage(message, type = "error") {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.className = `form-message show ${type}`;
        formMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function clearMessage() {
        if (!formMessage) return;
        formMessage.textContent = "";
        formMessage.className = "form-message";
    }

    function setDefaultDateValues() {
        const today = new Date().toISOString().split("T")[0];

        if (admissionDate && !admissionDate.value) {
            admissionDate.value = today;
        }

        if (studentStatus && !studentStatus.value) {
            studentStatus.value = "ACTIVE";
        }
    }

    function validateForm() {
        clearMessage();

        const admission = admissionNumber?.value.trim();
        const first = firstName?.value.trim();
        const last = lastName?.value.trim();
        const selectedGender = gender?.value;
        const selectedYear = academicYear?.value;
        const selectedClass = studentClass?.value;
        const selectedStatus = studentStatus?.value;

        if (!admission) {
            showMessage("Tafadhali weka Admission Number ya mwanafunzi.");
            admissionNumber?.focus();
            return false;
        }

        if (!first) {
            showMessage("Tafadhali weka jina la kwanza.");
            firstName?.focus();
            return false;
        }

        if (!last) {
            showMessage("Tafadhali weka jina la mwisho.");
            lastName?.focus();
            return false;
        }

        if (!selectedGender) {
            showMessage("Tafadhali chagua jinsia.");
            gender?.focus();
            return false;
        }

        if (!selectedYear) {
            showMessage("Tafadhali chagua mwaka wa masomo.");
            academicYear?.focus();
            return false;
        }

        if (!selectedClass) {
            showMessage("Tafadhali chagua darasa.");
            studentClass?.focus();
            return false;
        }

        if (!selectedStatus) {
            showMessage("Tafadhali chagua hali ya mwanafunzi.");
            studentStatus?.focus();
            return false;
        }

        return true;
    }

    function collectStudentData() {
        return {
            admission_number: admissionNumber.value.trim().toUpperCase(),
            first_name: firstName.value.trim(),
            middle_name: middleName.value.trim(),
            last_name: lastName.value.trim(),
            gender: gender.value,
            date_of_birth: dateOfBirth.value || null,
            academic_year: academicYear.value,
            class_name: studentClass.value,
            admission_date: admissionDate.value || null,
            status: studentStatus.value || "ACTIVE"
        };
    }

    function renderClassOptions(items, emptyLabel = "Hakuna madarasa yaliyopatikana") {
        if (!studentClass) return;

        if (!items.length) {
            studentClass.innerHTML = `
                <option value="">${emptyLabel}</option>
            `;
            return;
        }

        const options = [{ value: "", label: "Chagua darasa" }, ...items.map((item) => ({
            value: item.class_name,
            label: `${item.form_name || "Form"} - ${item.class_name}`
        }))];

        studentClass.innerHTML = options.map((item) => `
            <option value="${item.value}">${item.label}</option>
        `).join("");
    }

    async function loadClassOptions() {
        try {
            const response = await MsongolaAPI.get("/students/classes");

            if (!response || !response.success) {
                throw new Error(response?.message || "Class options unavailable");
            }

            state.classOptions = Array.isArray(response.data)
                ? response.data
                : response.data?.classes || response.classes || [];

            renderClassOptions(state.classOptions);
        } catch (error) {
            console.error("Load class options error:", error);
            renderClassOptions([], "Imeshindikana kupakia madarasa. Bonyeza refresh.");
        }
    }

    async function loadStudentForEdit() {
        if (!editStudentId) return;
        try {
            const response = await MsongolaAPI.get(`/students/${encodeURIComponent(editStudentId)}`);
            if (!response?.success || !response.data) throw new Error(response?.message || "Taarifa za mwanafunzi hazikupatikana.");
            const student = response.data;
            document.getElementById("admissionNumber").value = student.admission_number || "";
            document.getElementById("firstName").value = student.first_name || "";
            document.getElementById("middleName").value = student.middle_name || "";
            document.getElementById("lastName").value = student.last_name || "";
            document.getElementById("gender").value = student.gender || "";
            document.getElementById("dateOfBirth").value = student.date_of_birth ? String(student.date_of_birth).slice(0, 10) : "";
            document.getElementById("academicYear").value = student.academic_year || "";
            document.getElementById("studentClass").value = student.class_name || "";
            document.getElementById("admissionDate").value = student.admission_date ? String(student.admission_date).slice(0, 10) : "";
            document.getElementById("studentStatus").value = student.status || "ACTIVE";
            document.title = "Hariri Mwanafunzi | Msongola Result System";
            const heading = document.querySelector(".page-title-area h1");
            if (heading) heading.textContent = "Hariri Mwanafunzi";
            if (saveButton) saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Hifadhi Mabadiliko';
        } catch (error) {
            showMessage(error.message || "Imeshindikana kupakia taarifa za mwanafunzi.");
        }
    }

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("sidebar-open");
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            const confirmed = window.confirm("Una uhakika unataka kutoka kwenye mfumo?");
            if (!confirmed) return;
            MsongolaAuth.logout();
        });
    }

    if (admissionNumber) {
        admissionNumber.addEventListener("input", () => {
            admissionNumber.value = admissionNumber.value.trim().toUpperCase();
        });
    }

    if (studentClass && state.classOptions.length === 0) {
        studentClass.innerHTML = '<option value="">Inapakia darasa...</option>';
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) {
            console.error("Shared auth/API system is not loaded.");
            return;
        }

        const sessionAllowed = await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] });
        if (!sessionAllowed) {
            return;
        }

        const currentUser = MsongolaAuth.getUser();
        renderCurrentUser(currentUser);
        setDefaultDateValues();
        await loadClassOptions();
        await loadStudentForEdit();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!validateForm()) {
                return;
            }

            const payload = collectStudentData();

            saveButton.classList.add("loading");
            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Inahifadhi...
            `;

            try {
                const response = editStudentId
                    ? await MsongolaAPI.put(`/students/${encodeURIComponent(editStudentId)}`, payload)
                    : await MsongolaAPI.post("/students", payload);

                if (!response || !response.success) {
                    throw new Error(response?.message || "Imeshindikana kuhifadhi mwanafunzi.");
                }

                showMessage(editStudentId ? "Mabadiliko ya mwanafunzi yamehifadhiwa." : "Mwanafunzi amehifadhiwa kwa mafanikio.", "success");
                saveButton.innerHTML = `
                    <i class="fa-solid fa-check"></i>
                    Imehifadhiwa
                `;

                setTimeout(() => {
                    window.location.href = "students.html";
                }, 900);
            } catch (error) {
                console.error("Add student error:", error);
                showMessage(error.message || "Kumetokea tatizo wakati wa kuhifadhi mwanafunzi.");

                saveButton.innerHTML = `
                    <i class="fa-solid fa-floppy-disk"></i>
                    Hifadhi Mwanafunzi
                `;
            } finally {
                saveButton.classList.remove("loading");
            }
        });
    }

    if (form) {
        form.addEventListener("reset", () => {
            setTimeout(() => {
                clearMessage();
                setDefaultDateValues();
            }, 0);
        });
    }

    form?.querySelectorAll("input").forEach((input) => {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && input.type !== "textarea") {
                event.preventDefault();
            }
        });
    });
})();
