(() => {
    "use strict";

    const state = {
        classOptions: [],
        subjectPreviewSequence: 0
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
    const academicStream = document.getElementById("academicStream");
    const academicStreamGroup = document.getElementById("academicStreamGroup");
    const islamicStudies = document.getElementById("islamicStudies");
    const islamicStudiesGroup = document.getElementById("islamicStudiesGroup");
    const scienceSubjectsGroup = document.getElementById("scienceSubjectsGroup");
    const physicsSubject = document.getElementById("physicsSubject");
    const chemistrySubject = document.getElementById("chemistrySubject");
    const eligibleSubjectsGroup = document.getElementById("eligibleSubjectsGroup");
    const eligibleSubjectsPreview = document.getElementById("eligibleSubjectsPreview");
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

        const first = firstName?.value.trim();
        const last = lastName?.value.trim();
        const selectedGender = gender?.value;
        const selectedYear = academicYear?.value;
        const selectedClass = studentClass?.value;
        const selectedStatus = studentStatus?.value;

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

        const selectedClassRecord = state.classOptions.find((item) => String(item.id) === String(selectedClass));
        if ([1, 2, 3, 4].includes(Number(selectedClassRecord?.form_number)) && !academicStream.value) {
            showMessage(`Chagua mkondo wa Arts au Science kwa mwanafunzi wa Form ${selectedClassRecord.form_number}.`);
            academicStream.focus();
            return false;
        }

        if ([3, 4].includes(Number(selectedClassRecord?.form_number)) &&
            academicStream.value === "SCIENCE" &&
            !physicsSubject.checked &&
            !chemistrySubject.checked) {
            showMessage("Chagua angalau somo moja la sayansi: Physics au Chemistry.");
            physicsSubject.focus();
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
        const rawClassValue = String(studentClass?.value || "").trim();
        const parsedClassId = Number(rawClassValue);

        return {
            first_name: firstName.value.trim(),
            middle_name: middleName.value.trim(),
            last_name: lastName.value.trim(),
            gender: gender.value,
            date_of_birth: dateOfBirth.value || null,
            academic_year: academicYear.value,
            class_id: Number.isInteger(parsedClassId) && parsedClassId > 0 ? parsedClassId : null,
            class_name: Number.isInteger(parsedClassId) && parsedClassId > 0 ? "" : rawClassValue,
            academic_stream: academicStream.value || "GENERAL",
            islamic_studies: islamicStudies.checked,
            science_subjects: [physicsSubject, chemistrySubject]
                .filter((subject) => subject.checked)
                .map((subject) => subject.value),
            admission_date: admissionDate.value || null,
            status: studentStatus.value || "ACTIVE"
        };
    }

    function renderSubjectPreview(subjects) {
        eligibleSubjectsGroup.hidden = false;
        eligibleSubjectsPreview.textContent = subjects.length
            ? subjects.map((subject) => subject.subject_name).join(", ")
            : "Hakuna somo lililopatikana.";
    }

    async function refreshSubjectPreview() {
        const sequence = ++state.subjectPreviewSequence;
        const classId = studentClass.value;
        const classRecord = state.classOptions.find((item) => String(item.id) === String(classId));
        const formNumber = Number(classRecord?.form_number);
        const isStreamedForm = [1, 2, 3, 4].includes(formNumber);
        const hasOptionalIslamicStudy = [3, 4].includes(formNumber);
        const hasScienceChoices = hasOptionalIslamicStudy && academicStream.value === "SCIENCE";

        academicStreamGroup.hidden = !isStreamedForm;
        academicStream.required = isStreamedForm;
        islamicStudiesGroup.hidden = !hasOptionalIslamicStudy;
        islamicStudies.disabled = !hasOptionalIslamicStudy;
        scienceSubjectsGroup.hidden = !hasScienceChoices;
        physicsSubject.disabled = !hasScienceChoices;
        chemistrySubject.disabled = !hasScienceChoices;
        if (!hasOptionalIslamicStudy) islamicStudies.checked = false;
        if (!isStreamedForm) academicStream.value = "GENERAL";
        if (!classId) {
            eligibleSubjectsGroup.hidden = true;
            return;
        }
        if (isStreamedForm && !academicStream.value) {
            eligibleSubjectsGroup.hidden = false;
            eligibleSubjectsPreview.textContent = "Chagua mkondo ili kuona masomo.";
            return;
        }
        if (hasScienceChoices && !physicsSubject.checked && !chemistrySubject.checked) {
            eligibleSubjectsGroup.hidden = false;
            eligibleSubjectsPreview.textContent = "Chagua Physics, Chemistry, au masomo yote mawili ili kuona masomo.";
            return;
        }

        eligibleSubjectsGroup.hidden = false;
        eligibleSubjectsPreview.textContent = "Inapakia masomo...";
        const query = new URLSearchParams({
            academic_stream: academicStream.value || "GENERAL",
            islamic_studies: String(islamicStudies.checked),
            science_subjects: [physicsSubject, chemistrySubject]
                .filter((subject) => subject.checked)
                .map((subject) => subject.value)
        });

        try {
            const response = await MsongolaAPI.get(
                `/students/classes/${encodeURIComponent(classId)}/subjects?${query}`
            );
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupata masomo ya mwanafunzi.");
            if (sequence !== state.subjectPreviewSequence) return;
            renderSubjectPreview(response.data?.subjects || []);
        } catch (error) {
            if (sequence !== state.subjectPreviewSequence) return;
            eligibleSubjectsPreview.textContent = error.message || "Imeshindikana kupata masomo.";
        }
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
            value: item.id ?? item.class_id ?? item.class_name ?? "",
            label: `${item.form_name || "Form"} - ${item.class_name || item.name || "Darasa"} (${item.academic_year || item.year_label || ""})`.replace(/\s\(\)/g, "")
        }))];

        studentClass.innerHTML = options.map((item) => `
            <option value="${item.value}">${item.label}</option>
        `).join("");
    }

    async function loadClassOptions() {
        const previousClassId = studentClass.value;
        studentClass.disabled = true;
        studentClass.innerHTML = '<option value="">Inapakia madarasa...</option>';
        try {
            const query = new URLSearchParams();
            if (academicYear.value) query.set("academic_year", academicYear.value);
            const selectedFormNumber = Number(String(studentForm.value || "").replace(/\D/g, ""));
            if (selectedFormNumber) query.set("form_number", String(selectedFormNumber));
            const endpoint = query.size
                ? `/students/classes?${query.toString()}`
                : "/students/classes";
            const response = await MsongolaAPI.get(endpoint);

            if (!response || !response.success) {
                throw new Error(response?.message || "Class options unavailable");
            }

            state.classOptions = Array.isArray(response.data)
                ? response.data
                : response.data?.classes || response.classes || [];

            renderClassOptions(state.classOptions);
            studentClass.value = state.classOptions.some((item) => String(item.id) === previousClassId)
                ? previousClassId
                : "";
        } catch (error) {
            console.error("Load class options error:", error);
            renderClassOptions([], "Imeshindikana kupakia madarasa. Bonyeza refresh.");
            showMessage(error.message || "Imeshindikana kupakia madarasa.");
        } finally {
            studentClass.disabled = false;
        }
    }

    async function loadStudentForEdit() {
        if (!editStudentId) return;
        try {
            const response = await MsongolaAPI.get(`/students/${encodeURIComponent(editStudentId)}`);
            if (!response?.success || !response.data) throw new Error(response?.message || "Taarifa za mwanafunzi hazikupatikana.");
            const student = response.data;
            document.getElementById("academicYear").value = student.academic_year || "";
            studentForm.value = student.form_number ? `FORM_${student.form_number}` : "";
            await loadClassOptions();
            document.getElementById("admissionNumber").value = student.admission_number || "";
            document.getElementById("firstName").value = student.first_name || "";
            document.getElementById("middleName").value = student.middle_name || "";
            document.getElementById("lastName").value = student.last_name || "";
            document.getElementById("gender").value = student.gender || "";
            document.getElementById("dateOfBirth").value = student.date_of_birth ? String(student.date_of_birth).slice(0, 10) : "";
            document.getElementById("studentClass").value = student.class_id || "";
            academicStream.value = student.academic_stream === "GENERAL" ? "" : (student.academic_stream || "");
            islamicStudies.checked = Boolean(student.islamic_studies);
            physicsSubject.checked = student.science_subjects?.includes("PHYSICS") || false;
            chemistrySubject.checked = student.science_subjects?.includes("CHEMISTRY") || false;
            await refreshSubjectPreview();
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
        if (editStudentId) {
            await loadStudentForEdit();
        } else {
            await loadClassOptions();
        }
    }

    academicYear?.addEventListener("change", async () => {
        studentClass.value = "";
        await loadClassOptions();
        await refreshSubjectPreview();
    });
    studentForm?.addEventListener("change", async () => {
        studentClass.value = "";
        await loadClassOptions();
        await refreshSubjectPreview();
    });
    studentClass?.addEventListener("change", () => {
        const classRecord = state.classOptions.find((item) => String(item.id) === String(studentClass.value));
        academicStream.value = [1, 2, 3, 4].includes(Number(classRecord?.form_number)) ? "" : "GENERAL";
        refreshSubjectPreview();
    });
    academicStream?.addEventListener("change", refreshSubjectPreview);
    islamicStudies?.addEventListener("change", refreshSubjectPreview);
    physicsSubject?.addEventListener("change", refreshSubjectPreview);
    chemistrySubject?.addEventListener("change", refreshSubjectPreview);

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

                const successMessage = editStudentId
                    ? "Mabadiliko ya mwanafunzi yamehifadhiwa."
                    : `Mwanafunzi amehifadhiwa kwa mafanikio. Admission Number: ${response.data?.admission_number || "itaonekana kwenye orodha ya wanafunzi."}`;
                showMessage(successMessage, "success");
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
                academicStream.value = "";
                islamicStudies.checked = false;
                physicsSubject.checked = false;
                chemistrySubject.checked = false;
                refreshSubjectPreview();
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
