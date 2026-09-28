(() => {
	"use strict";

	const elements = {
		welcome: document.getElementById("teacherWelcome"),
		assignments: document.getElementById("teacherAssignments"),
		drafts: document.getElementById("teacherDrafts"),
		submitted: document.getElementById("teacherSubmitted"),
		approved: document.getElementById("teacherApproved"),
		loading: document.getElementById("teacherAssignmentsLoading"),
		error: document.getElementById("teacherAssignmentsError"),
		table: document.getElementById("teacherAssignmentsTable"),
		body: document.getElementById("teacherAssignmentsBody"),
		empty: document.getElementById("teacherAssignmentsEmpty"),
		refresh: document.getElementById("refreshTeacherDashboard"),
		logout: document.getElementById("teacherLogout")
	};

	function escapeHTML(value) {
		const container = document.createElement("div");
		container.textContent = value ?? "";
		return container.innerHTML;
	}

	function setText(element, value) {
		if (element) element.textContent = String(value ?? 0);
	}

	function renderAssignments(assignments) {
		elements.loading.hidden = true;
		elements.error.hidden = true;
		elements.empty.hidden = assignments.length > 0;
		elements.table.hidden = assignments.length === 0;

		elements.body.innerHTML = assignments.map((assignment) => `
			<tr>
				<td>${escapeHTML(assignment.class_name || "-")}</td>
				<td>${escapeHTML(assignment.subject_name || "-")}</td>
				<td>${escapeHTML(assignment.academic_year || "-")}</td>
				<td>${escapeHTML(assignment.status || "ACTIVE")}</td>
			</tr>
		`).join("");
	}

	async function loadDashboard() {
		elements.loading.hidden = false;
		elements.error.hidden = true;
		elements.table.hidden = true;
		elements.empty.hidden = true;

		try {
			const response = await MsongolaAPI.get("/teacher/dashboard");

			if (!response || !response.success) {
				throw new Error(response?.message || "Dashboard haipatikani.");
			}

			const data = response.data || {};
			const teacher = data.teacher || {};
			const statistics = data.statistics || {};
			const displayName = [teacher.first_name, teacher.middle_name, teacher.last_name].filter(Boolean).join(" ") || MsongolaAuth.getUser()?.username || "Teacher";

			elements.welcome.textContent = `Karibu, ${displayName}.`;
			setText(elements.assignments, statistics.assignments);
			setText(elements.drafts, statistics.draft_submissions);
			setText(elements.submitted, statistics.submitted_submissions);
			setText(elements.approved, statistics.approved_submissions);
			renderAssignments(Array.isArray(data.assignments) ? data.assignments : []);
		} catch (error) {
			elements.loading.hidden = true;
			elements.error.hidden = false;
			elements.error.textContent = error.message || "Imeshindikana kupakia dashboard.";
		}
	}

	async function initialize() {
		const allowed = await MsongolaAuth.protectPage({ roles: ["SUBJECT_TEACHER"] });
		if (!allowed) return;
		elements.refresh?.addEventListener("click", loadDashboard);
		elements.logout?.addEventListener("click", () => MsongolaAuth.logout());
		await loadDashboard();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initialize, { once: true });
	} else {
		initialize();
	}
})();
