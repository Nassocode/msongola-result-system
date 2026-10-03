(() => {
    "use strict";

    const elements = {
        assignment: document.getElementById("assignmentSelect"),
        examination: document.getElementById("examinationSelect"),
        info: document.getElementById("assignmentInfo"),
        summary: document.getElementById("rosterSummary"),
        status: document.getElementById("submissionStatus"),
        message: document.getElementById("pageMessage"),
        loading: document.getElementById("loadingMessage"),
        table: document.getElementById("marksTable"),
        rows: document.getElementById("marksRows"),
        empty: document.getElementById("emptyMessage"),
        save: document.getElementById("saveDraftButton"),
        submit: document.getElementById("submitMarksButton"),
        refresh: document.getElementById("refreshRosterButton"),
        logout: document.getElementById("logoutButton")
    };

    let assignments = [];
    let context = null;

    function escapeHTML(value) {
        const node = document.createElement("div");
        node.textContent = value ?? "";
        return node.innerHTML;
    }

    function showMessage(text, isError = false) {
        elements.message.textContent = text;
        elements.message.classList.toggle("error", isError);
        elements.message.hidden = false;
    }

    function enableExamSelection(enabled) {
        elements.examination.disabled = !enabled;
        elements.examination.title = enabled ? "Chagua mtihani" : "Hakuna mtihani uliofunguliwa";
    }

    function setBusy(busy) {
        const eligibleCount = context?.students?.filter((student) => Boolean(Number(student.subject_eligible))).length || 0;
        elements.save.disabled = busy || !eligibleCount || ["SUBMITTED", "APPROVED"].includes(context?.submission?.status);
        elements.submit.disabled = busy || !eligibleCount || ["SUBMITTED", "APPROVED"].includes(context?.submission?.status);
        elements.assignment.disabled = busy;
        elements.examination.disabled = busy || !elements.examination.options.length;
        elements.refresh.disabled = busy || !elements.assignment.value || !elements.examination.value;
    }

    function populateAssignments(items) {
        assignments = items;
        elements.assignment.innerHTML = items.length
            ? `<option value="">Chagua assignment</option>${items.map((item) => `<option value="${item.id}">${escapeHTML(item.form_name ? `${item.form_name} - ${item.class_name}` : item.class_name)} / ${escapeHTML(item.subject_name)} / ${escapeHTML(item.academic_year)}</option>`).join("")}`
            : '<option value="">Hakuna assignment active</option>';
    }

    function renderRoster(data) {
        const saved = new Map((data.marks || []).map((mark) => [Number(mark.student_id), mark]));
        const locked = ["SUBMITTED", "APPROVED"].includes(data.submission?.status);
        elements.rows.innerHTML = data.students.map((student, index) => {
            const mark = saved.get(Number(student.id));
            const name = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
            const eligible = Boolean(Number(student.subject_eligible));
            const markField = eligible
                ? `<input class="mark-input" type="number" min="0" max="100" step="0.01" inputmode="decimal" data-student-id="${student.id}" value="${mark ? escapeHTML(mark.marks) : ""}" ${locked ? "disabled" : ""} aria-label="Alama za ${escapeHTML(name)}">`
                : '<span>Hasomi somo hili</span>';
            return `<tr><td>${index + 1}</td><td>${escapeHTML(student.admission_number)}</td><td><strong>${escapeHTML(name)}</strong></td><td>${markField}</td><td>${eligible ? escapeHTML(mark?.status || "Haijaingizwa") : "Hastahili"}</td></tr>`;
        }).join("");
        elements.table.hidden = data.students.length === 0;
        elements.empty.hidden = data.students.length > 0;
        elements.loading.hidden = true;
        const classLabel = data.assignment.form_name
            ? `${data.assignment.form_name} - ${data.assignment.class_name}`
            : data.assignment.class_name;
        const eligibleCount = data.students.filter((student) => Boolean(Number(student.subject_eligible))).length;
        elements.summary.textContent = `${data.students.length} wanafunzi katika ${classLabel}; ${eligibleCount} wanasoma ${data.assignment.subject_name}`;
        elements.info.textContent = `${data.assignment.subject_name} · ${data.assignment.academic_year}`;
        elements.status.textContent = data.submission ? `Hali: ${data.submission.status}` : "Hali: Draft";
        elements.save.disabled = locked || eligibleCount === 0;
        elements.submit.disabled = locked || eligibleCount === 0;
        elements.refresh.disabled = false;
    }

    async function loadContext() {
        const assignmentId = elements.assignment.value;
        if (!assignmentId) {
            context = null;
            elements.examination.innerHTML = '<option value="">Chagua assignment kwanza</option>';
            elements.examination.disabled = true;
            elements.refresh.disabled = true;
            elements.rows.innerHTML = "";
            elements.table.hidden = true;
            elements.empty.hidden = false;
            elements.empty.textContent = "Chagua assignment na mtihani ili kuanza.";
            elements.save.disabled = true;
            elements.submit.disabled = true;
            elements.summary.textContent = "Chagua assignment ili kuona wanafunzi.";
            elements.info.textContent = "";
            elements.status.textContent = "";
            return;
        }

        elements.loading.hidden = false;
        elements.empty.hidden = true;
        elements.table.hidden = true;
        elements.message.hidden = true;
        try {
            const response = await MsongolaAPI.get(`/teacher/marks/entry?assignment_id=${encodeURIComponent(assignmentId)}`);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia taarifa.");
            const data = response.data || {};
            const exams = Array.isArray(data.examinations) ? data.examinations : [];

            elements.examination.innerHTML = exams.length
                ? `<option value="">Chagua mtihani</option>${exams.map((exam) => `<option value="${exam.id}">${escapeHTML(exam.exam_name)}${exam.term ? ` - ${escapeHTML(exam.term)}` : ""}</option>`).join("")}`
                : '<option value="">Hakuna mtihani uliofunguliwa</option>';

            enableExamSelection(exams.length > 0);
            context = null;
            elements.rows.innerHTML = "";
            elements.table.hidden = true;
            elements.empty.hidden = false;
            elements.empty.textContent = exams.length ? "Inapakia mtihani..." : "Hakuna mtihani uliofunguliwa kwa mwaka wa assignment hii.";

            if (exams.length) {
                const preferredExam = exams.find((exam) => String(exam.id) === String(elements.examination.value)) || exams[0];
                elements.examination.value = String(preferredExam.id);
                await loadExamRoster();
                return;
            }

            const classLabel = data.assignment.form_name
                ? `${data.assignment.form_name} - ${data.assignment.class_name}`
                : data.assignment.class_name;
            elements.info.textContent = `${classLabel} · ${data.assignment.subject_name} · ${data.assignment.academic_year}`;
            elements.loading.hidden = true;
        } catch (error) {
            elements.loading.hidden = true;
            showMessage(error.message, true);
        }
    }

    async function loadExamRoster() {
        const assignmentId = elements.assignment.value;
        const examinationId = elements.examination.value;
        if (!assignmentId || !examinationId) {
            context = null;
            elements.refresh.disabled = true;
            elements.rows.innerHTML = "";
            elements.table.hidden = true;
            elements.empty.hidden = false;
            elements.empty.textContent = "Chagua mtihani ili kuonyesha wanafunzi.";
            return;
        }
        elements.loading.hidden = false;
        elements.refresh.disabled = true;
        elements.table.hidden = true;
        elements.message.hidden = true;
        try {
            const response = await MsongolaAPI.get(`/teacher/marks/entry?assignment_id=${encodeURIComponent(assignmentId)}&examination_id=${encodeURIComponent(examinationId)}`);
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia wanafunzi.");
            context = response.data;
            renderRoster(context);
            elements.loading.hidden = true;
            elements.empty.hidden = true;
        } catch (error) {
            elements.loading.hidden = true;
            elements.table.hidden = true;
            elements.refresh.disabled = false;
            elements.empty.hidden = false;
            elements.empty.textContent = error.message || "Imeshindikana kupakia wanafunzi.";
            showMessage(error.message, true);
        }
    }

    async function refreshRoster() {
        if (!context) return;
        const savedMarks = new Map((context.marks || []).map((mark) => [Number(mark.student_id), String(mark.marks ?? "")]));
        const hasUnsavedMarks = [...document.querySelectorAll(".mark-input")].some((input) =>
            input.value !== (savedMarks.get(Number(input.dataset.studentId)) || "")
        );
        if (hasUnsavedMarks && !window.confirm("Kuna alama ambazo hazijahifadhiwa. Ukisasisha, mabadiliko haya yatapotea. Endelea?")) return;
        await loadExamRoster();
    }

    function collectMarks() {
        const inputs = [...document.querySelectorAll(".mark-input")];
        const invalid = inputs.find((input) => input.value !== "" && (!Number.isFinite(Number(input.value)) || Number(input.value) < 0 || Number(input.value) > 100));
        if (invalid) throw new Error("Kila alama lazima iwe kati ya 0 na 100.");
        return inputs.filter((input) => input.value !== "").map((input) => ({ student_id: Number(input.dataset.studentId), marks: Number(input.value) }));
    }

    async function saveDraft() {
        if (!context) return;
        try {
            const marks = collectMarks();
            if (!marks.length) throw new Error("Ingiza angalau alama moja kabla ya kuhifadhi.");
            setBusy(true);
            const response = await MsongolaAPI.put("/teacher/marks/draft", {
                assignment_id: context.assignment.id,
                examination_id: context.examination_id,
                marks
            });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kuhifadhi draft.");
            showMessage(response.message || "Alama zimehifadhiwa.");
            await loadExamRoster();
        } catch (error) {
            showMessage(error.message, true);
        } finally {
            setBusy(false);
        }
    }

    async function submitMarks() {
        if (!context) return;
        if (!window.confirm("Una uhakika unataka kutuma alama hizi kwa mapitio? Baada ya kutuma hutaweza kuzibadilisha.")) return;
        try {
            const marks = collectMarks();
            const eligibleStudents = context.students.filter((student) => Boolean(Number(student.subject_eligible)));
            const missing = eligibleStudents.length - marks.length;
            if (missing > 0) throw new Error(`Jaza alama za wanafunzi wote. Bado ${missing} hazijaingizwa.`);
            setBusy(true);
            const saveResponse = await MsongolaAPI.put("/teacher/marks/draft", {
                assignment_id: context.assignment.id,
                examination_id: context.examination_id,
                marks
            });
            if (!saveResponse?.success) throw new Error(saveResponse?.message || "Imeshindikana kuhifadhi alama.");
            const response = await MsongolaAPI.post("/teacher/marks/submit", {
                assignment_id: context.assignment.id,
                examination_id: context.examination_id
            });
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kutuma alama.");
            showMessage(response.message || "Alama zimetumwa.");
            await loadExamRoster();
        } catch (error) {
            showMessage(error.message, true);
        } finally {
            setBusy(false);
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        if (!await MsongolaAuth.protectPage({ roles: ["SUBJECT_TEACHER"] })) return;
        elements.assignment.addEventListener("change", loadContext);
        elements.examination.addEventListener("change", loadExamRoster);
        elements.refresh.addEventListener("click", refreshRoster);
        elements.save.addEventListener("click", saveDraft);
        elements.submit.addEventListener("click", submitMarks);
        elements.logout.addEventListener("click", () => MsongolaAuth.logout());
        try {
            const response = await MsongolaAPI.get("/teacher/dashboard");
            if (!response?.success) throw new Error(response?.message || "Assignments hazikupatikana.");
            populateAssignments(response.data?.assignments || []);
        } catch (error) {
            elements.assignment.innerHTML = `<option value="">${escapeHTML(error.message)}</option>`;
        }
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
