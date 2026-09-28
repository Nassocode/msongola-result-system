(() => {
    "use strict";
    import("./shared-shell.js").catch((error) => console.error("Academic shell unavailable:", error));

    const message = document.getElementById("profileMessage");
    const form = document.getElementById("passwordForm");

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value || "-";
    }

    function showMessage(text, error = false) {
        message.textContent = text;
        message.classList.toggle("error", error);
        message.hidden = false;
    }

    async function loadProfile() {
        const response = await MsongolaAPI.get("/academic-master/operations/profile");
        if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia wasifu.");
        const { user, school } = response.data || {};
        setText("profileUsername", user?.username);
        setText("profileRole", user?.role);
        setText("profileStatus", user?.status);
        setText("profileCreated", user?.created_at ? new Date(user.created_at).toLocaleDateString("sw-TZ") : "-");
        setText("profileSchool", school?.school_name);
        setText("profileHead", school?.head_of_school);
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        if (!await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] })) return;
        try { await loadProfile(); } catch (error) { showMessage(error.message, true); }
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            message.hidden = true;
            const data = Object.fromEntries(new FormData(form));
            if (data.new_password !== data.confirm_password) {
                showMessage("Password mpya na uthibitisho havilingani.", true);
                return;
            }
            try {
                const response = await MsongolaAPI.patch("/academic-master/operations/profile/password", {
                    current_password: data.current_password,
                    new_password: data.new_password
                });
                if (!response?.success) throw new Error(response?.message || "Imeshindikana kubadili password.");
                form.reset();
                showMessage("Password imebadilishwa kwa mafanikio.");
            } catch (error) {
                showMessage(error.message || "Imeshindikana kubadili password.", true);
            }
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
