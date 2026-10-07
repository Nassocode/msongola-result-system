(() => {
    "use strict";

    import("./shared-shell.js").catch((error) => {
        console.error("Academic Master shell could not be loaded:", error);
    });

    const elements = {
        sourceYear: document.getElementById("sourceYear"),
        targetYear: document.getElementById("targetYear"),
        sourceClass: document.getElementById("sourceClass"),
        targetClass: document.getElementById("targetClass"),
        academicYearForm: document.getElementById("academicYearForm"),
        activateYear: document.getElementById("activateYear"),
        yearLabel: document.getElementById("newYearLabel"),
        yearStart: document.getElementById("newYearStart"),
        yearEnd: document.getElementById("newYearEnd"),
        message: document.getElementById("promotionMessage"),
        previewButton: document.getElementById("previewPromotion"),
        promoteButton: document.getElementById("runPromotion"),
        previewPanel: document.getElementById("previewPanel"),
        previewTitle: document.getElementById("previewTitle"),
        previewSummary: document.getElementById("previewSummary"),
        previewCount: document.getElementById("previewCount"),
        previewStudents: document.getElementById("previewStudents")
    };

    let years = [];
    let classes = [];
    let preview = null;
    let busy = false;

    const escapeHTML = (value) => {
        const node = document.createElement("div");
        node.textContent = value ?? "";
        return node.innerHTML;
    };

    function showMessage(text, type = "error") {
        elements.message.textContent = text;
        elements.message.className = `promotion-message ${type}`;
        elements.message.hidden = false;
    }

    function clearPreview() {
        preview = null;
        elements.previewPanel.hidden = true;
        elements.previewButton.disabled = busy || !elements.sourceClass.value || !elements.targetClass.value;
        elements.promoteButton.disabled = true;
    }

    function updateClasses() {
        const sourceYearId = elements.sourceYear.value;
        const targetYearId = elements.targetYear.value;
        const sourceClasses = classes.filter((item) =>
            String(item.academic_year_id) === sourceYearId && Number(item.student_count) > 0
        );
        const targetClasses = classes.filter((item) =>
            String(item.academic_year_id) === targetYearId && item.year_status !== "CLOSED"
        );

        elements.sourceClass.innerHTML = sourceClasses.length
            ? `<option value="">Chagua darasa la sasa</option>${sourceClasses.map((item) => {
                const name = `${item.form_name} - ${item.class_name}`;
                return `<option value="${item.id}">${escapeHTML(name)} · ${item.student_count} wanafunzi</option>`;
            }).join("")}`
            : '<option value="">Hakuna darasa lenye wanafunzi hai</option>';
        elements.targetClass.innerHTML = targetClasses.length
            ? `<option value="">Chagua darasa la mwaka mpya</option>${targetClasses.map((item) => {
                const name = `${item.form_name} - ${item.class_name}`;
                return `<option value="${item.id}">${escapeHTML(name)} · ${item.year_label}</option>`;
            }).join("")}`
            : '<option value="">Hakuna madarasa ya mwaka huu</option>';

        elements.sourceClass.disabled = sourceClasses.length === 0;
        elements.targetClass.disabled = targetClasses.length === 0;
        elements.activateYear.disabled = !targetYearId;
        clearPreview();
    }

    async function loadOptions() {
        try {
            const response = await MsongolaAPI.get("/academic-master/promotions/options");
            if (!response?.success) throw new Error(response?.message || "Taarifa za promotion hazikupatikana.");
            years = Array.isArray(response.data?.years) ? response.data.years : [];
            classes = Array.isArray(response.data?.classes) ? response.data.classes : [];

            const sourceYears = years.filter((year) => year.status !== "INACTIVE");
            const destinationYears = years.filter((year) => year.status !== "CLOSED");
            elements.sourceYear.innerHTML = sourceYears.length
                ? `<option value="">Chagua mwaka wa sasa</option>${sourceYears.map((year) =>
                    `<option value="${year.id}">${escapeHTML(year.year_label)}</option>`
                ).join("")}`
                : '<option value="">Hakuna mwaka wa kuanzia</option>';
            elements.targetYear.innerHTML = destinationYears.length
                ? `<option value="">Chagua mwaka mpya</option>${destinationYears.map((year) =>
                    `<option value="${year.id}">${escapeHTML(year.year_label)}</option>`
                ).join("")}`
                : '<option value="">Hakuna mwaka wa kuhamishia</option>';

            const currentYear = sourceYears.find((year) => year.status === "ACTIVE");
            if (currentYear) elements.sourceYear.value = String(currentYear.id);
            updateClasses();
        } catch (error) {
            showMessage(error.message || "Imeshindikana kupakia academic years na madarasa.");
        }
    }

    async function createYear(event) {
        event.preventDefault();
        elements.message.hidden = true;
        const submit = elements.academicYearForm.querySelector('[type="submit"]');
        submit.disabled = true;
        try {
            const response = await MsongolaAPI.post("/academic-master/promotions/years", {
                year_label: elements.yearLabel.value.trim(),
                start_date: elements.yearStart.value,
                end_date: elements.yearEnd.value
            });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuongeza academic year.");
            showMessage(response.message || "Academic year imeongezwa.", "success");
            const newYearId = response.data?.id;
            elements.academicYearForm.reset();
            await loadOptions();
            if (newYearId) elements.targetYear.value = String(newYearId);
            updateClasses();
        } catch (error) {
            showMessage(error.message || "Imeshindikana kuongeza academic year.");
        } finally {
            submit.disabled = false;
        }
    }

    async function activateYear() {
        const year = years.find((item) => String(item.id) === elements.targetYear.value);
        if (!year) return;
        if (!window.confirm(
            `Weka ${year.year_label} kuwa mwaka unaoendelea? Hakikisha wanafunzi wote wamehamishwa au wamewekewa status sahihi, na mitihani ya mwaka wa sasa imefungwa.`
        )) return;
        elements.activateYear.disabled = true;
        try {
            const response = await MsongolaAPI.post("/academic-master/promotions/activate-year", {
                academic_year_id: Number(year.id)
            });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kubadilisha mwaka unaoendelea.");
            showMessage(response.message || "Academic year imebadilishwa.", "success");
            await loadOptions();
        } catch (error) {
            showMessage(error.message || "Imeshindikana kubadilisha mwaka unaoendelea.");
            elements.activateYear.disabled = !elements.targetYear.value;
        }
    }

    async function previewPromotion() {
        elements.message.hidden = true;
        elements.previewButton.disabled = true;
        try {
            const response = await MsongolaAPI.post("/academic-master/promotions/preview", {
                source_class_id: Number(elements.sourceClass.value),
                target_class_id: Number(elements.targetClass.value)
            });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuhakiki promotion.");
            preview = response.data;
            const source = `${preview.source_form} - ${preview.source_class_name} (${preview.source_year})`;
            const target = `${preview.target_form} - ${preview.target_class_name} (${preview.target_year})`;
            elements.previewTitle.textContent = `${source} → ${target}`;
            elements.previewSummary.textContent = "Hawa ndio wanafunzi watakaohamishwa. Admission number na historia yao vitaendelea bila kutengeneza rekodi mpya.";
            elements.previewCount.textContent = `${preview.student_count} wanafunzi`;
            elements.previewStudents.innerHTML = preview.students.map((student, index) => {
                const name = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
                return `<tr><td>${index + 1}</td><td>${escapeHTML(student.admission_number)}</td><td>${escapeHTML(name)}</td></tr>`;
            }).join("");
            elements.previewPanel.hidden = false;
            elements.promoteButton.disabled = busy || !preview.student_count;
        } catch (error) {
            showMessage(error.message || "Imeshindikana kuhakiki promotion.");
            clearPreview();
        } finally {
            elements.previewButton.disabled = busy || !elements.sourceClass.value || !elements.targetClass.value;
        }
    }

    async function runPromotion() {
        if (!preview || busy) return;
        const confirmed = window.confirm(
            `Unataka kuhamisha wanafunzi ${preview.student_count} kutoka ${preview.source_year} kwenda ${preview.target_year}? Mwanafunzi ataendelea kutumia admission number ileile.`
        );
        if (!confirmed) return;

        busy = true;
        elements.previewButton.disabled = true;
        elements.promoteButton.disabled = true;
        try {
            const response = await MsongolaAPI.post("/academic-master/promotions", {
                source_class_id: Number(elements.sourceClass.value),
                target_class_id: Number(elements.targetClass.value)
            });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuhamisha wanafunzi.");
            showMessage(response.message || "Wanafunzi wamehamishwa.", "success");
            elements.previewPanel.hidden = true;
            preview = null;
            await loadOptions();
        } catch (error) {
            showMessage(error.message || "Imeshindikana kuhamisha wanafunzi.");
        } finally {
            busy = false;
            elements.previewButton.disabled = !elements.sourceClass.value || !elements.targetClass.value;
            elements.promoteButton.disabled = !preview;
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        if (!await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] })) return;
        elements.academicYearForm.addEventListener("submit", createYear);
        elements.activateYear.addEventListener("click", activateYear);
        elements.sourceYear.addEventListener("change", updateClasses);
        elements.targetYear.addEventListener("change", updateClasses);
        elements.sourceClass.addEventListener("change", clearPreview);
        elements.targetClass.addEventListener("change", clearPreview);
        elements.previewButton.addEventListener("click", previewPromotion);
        elements.promoteButton.addEventListener("click", runPromotion);
        await loadOptions();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
