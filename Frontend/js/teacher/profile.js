(() => {
    "use strict";

    const profileMessage = document.getElementById("profileMessage");
    const passwordModal = document.getElementById("passwordModal");
    const changePasswordBtn = document.getElementById("changePasswordBtn");
    const closePasswordModalBtn = document.getElementById("closePasswordModal");
    const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
    const changePasswordForm = document.getElementById("changePasswordForm");
    const passwordMessage = document.getElementById("passwordMessage");

    function formatDate(dateValue) {
        if (!dateValue) return "-";
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return String(dateValue);
        return date.toLocaleString("sw-TZ", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value ?? "-";
        }
    }

    function showProfileMessage(message, error = false) {
        if (!profileMessage) return;
        profileMessage.hidden = false;
        profileMessage.textContent = message;
        profileMessage.classList.toggle("error", error);
    }

    function clearProfileMessage() {
        if (!profileMessage) return;
        profileMessage.hidden = true;
        profileMessage.textContent = "";
        profileMessage.classList.remove("error");
    }

    function showPasswordMessage(message, error = false) {
        if (!passwordMessage) return;
        passwordMessage.textContent = message;
        passwordMessage.className = `password-message ${error ? "error" : "success"}`;
    }

    function clearPasswordMessage() {
        if (!passwordMessage) return;
        passwordMessage.textContent = "";
        passwordMessage.className = "password-message";
    }

    function openPasswordModal() {
        if (!passwordModal) return;
        passwordModal.hidden = false;
        const currentPassword = document.getElementById("currentPassword");
        if (currentPassword) currentPassword.focus();
    }

    function closePasswordModal() {
        if (!passwordModal) return;
        passwordModal.hidden = true;
        if (changePasswordForm) changePasswordForm.reset();
        clearPasswordMessage();
    }

    async function loadProfile() {
        const response = await MsongolaAPI.get("/teacher/dashboard");
        if (!response?.success) {
            throw new Error(response?.message || "Imeshindikana kupakia taarifa za wasifu.");
        }

        const user = MsongolaAuth.getUser() || {};
        const teacher = response.data?.teacher || {};
        const displayName = [teacher.first_name, teacher.middle_name, teacher.last_name].filter(Boolean).join(" ") || user.username || "Mwalimu";
        const role = String(user.role || "SUBJECT_TEACHER").replaceAll("_", " ");
        const status = String(user.status || teacher.status || "ACTIVE").toUpperCase();

        document.getElementById("sidebarUsername")?.replaceChildren(document.createTextNode(displayName));
        document.getElementById("sidebarAvatar")?.replaceChildren(document.createTextNode(displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "T"));
        document.getElementById("profileUsername")?.replaceChildren(document.createTextNode(displayName));
        document.getElementById("profileRole")?.replaceChildren(document.createTextNode(role));
        document.getElementById("accountRole")?.replaceChildren(document.createTextNode(role));
        document.getElementById("accountUsername")?.replaceChildren(document.createTextNode(user.username || displayName));
        document.getElementById("accountTeacherNumber")?.replaceChildren(document.createTextNode(teacher.teacher_number || "-"));
        document.getElementById("accountStatus")?.replaceChildren(document.createTextNode(status));
        document.getElementById("accountTeacherId")?.replaceChildren(document.createTextNode(teacher.id ? String(teacher.id) : "-"));
        document.getElementById("accountCreated")?.replaceChildren(document.createTextNode(formatDate(teacher.account_created_at || user.created_at || teacher.created_at)));
        document.getElementById("accountUpdated")?.replaceChildren(document.createTextNode(formatDate(teacher.account_updated_at || user.updated_at || teacher.updated_at)));
        document.getElementById("profileStatusLabel")?.replaceChildren(document.createTextNode(`Akaunti ${status.toLowerCase()}`));
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) {
            console.error("Shared auth/API is not loaded.");
            return;
        }

        const allowed = await MsongolaAuth.protectPage({ roles: ["SUBJECT_TEACHER"] });
        if (!allowed) return;

        try {
            await loadProfile();
        } catch (error) {
            showProfileMessage(error.message || "Imeshindikana kupakia wasifu wako.", true);
        }

        changePasswordBtn?.addEventListener("click", openPasswordModal);
        closePasswordModalBtn?.addEventListener("click", closePasswordModal);
        cancelPasswordBtn?.addEventListener("click", closePasswordModal);
        passwordModal?.addEventListener("click", (event) => {
            if (event.target === passwordModal) closePasswordModal();
        });

        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            MsongolaAuth.logout();
        });

        document.getElementById("sidebarToggle")?.addEventListener("click", () => {
            const sidebar = document.getElementById("sidebar");
            const overlay = document.getElementById("sidebarOverlay");
            if (!sidebar || !overlay) return;
            const isOpen = sidebar.classList.toggle("open");
            overlay.classList.toggle("active", isOpen);
        });

        document.getElementById("sidebarClose")?.addEventListener("click", () => {
            const sidebar = document.getElementById("sidebar");
            const overlay = document.getElementById("sidebarOverlay");
            if (sidebar) sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("active");
        });

        document.getElementById("sidebarOverlay")?.addEventListener("click", () => {
            const sidebar = document.getElementById("sidebar");
            const overlay = document.getElementById("sidebarOverlay");
            if (sidebar) sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("active");
        });

        changePasswordForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            clearProfileMessage();
            clearPasswordMessage();

            const formData = new FormData(changePasswordForm);
            const currentPassword = String(formData.get("current_password") || "").trim();
            const newPassword = String(formData.get("new_password") || "").trim();
            const confirmPassword = String(formData.get("confirm_password") || "").trim();

            if (!currentPassword || !newPassword || !confirmPassword) {
                showPasswordMessage("Tafadhali jaza sehemu zote za password.", true);
                return;
            }

            if (newPassword.length < 8) {
                showPasswordMessage("Password mpya lazima iwe na angalau characters 8.", true);
                return;
            }

            if (newPassword !== confirmPassword) {
                showPasswordMessage("Password mpya na uthibitisho havilingani.", true);
                return;
            }

            try {
                const response = await MsongolaAPI.patch("/users/me/password", {
                    current_password: currentPassword,
                    new_password: newPassword
                });

                if (!response?.success) {
                    throw new Error(response?.message || "Imeshindikana kubadili password.");
                }

                showPasswordMessage("Password imebadilishwa kwa mafanikio.");
                setTimeout(() => closePasswordModal(), 1200);
            } catch (error) {
                showPasswordMessage(error.message || "Imeshindikana kubadili password.", true);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
