document.addEventListener("DOMContentLoaded", async () => {

    const TOKEN_KEY = "msongola_token";
    const USER_KEY = "msongola_user";

    const token =
        sessionStorage.getItem(TOKEN_KEY);

    const storedUser =
        sessionStorage.getItem(USER_KEY);


    /* ===============================
       AUTH CHECK
    =============================== */

    if (!token || !storedUser) {

        window.location.href =
            "../login.html";

        return;
    }


    let user;

    try {

        user = JSON.parse(storedUser);

    } catch (error) {

        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);

        window.location.href =
            "../login.html";

        return;
    }


    if (user.role !== "ADMIN") {

        alert(
            "Huna ruhusa ya kufungua ukurasa huu."
        );

        window.location.href =
            "dashboard.html";

        return;
    }

    try {
        const response = await MsongolaAPI.get(`/users/${encodeURIComponent(user.id)}`);
        if (!response?.success || !response.data) {
            throw new Error(response?.message || "Taarifa za wasifu hazikupatikana.");
        }
        user = { ...user, ...response.data };
    } catch (error) {
        const message = document.getElementById("profileMessage");
        message.textContent = error.message || "Imeshindikana kupakia wasifu kutoka kwenye mfumo.";
        message.classList.add("error");
        message.hidden = false;
    }


    /* ===============================
       USER DATA
    =============================== */

    const username =
        user.username || "Admin";


    const sidebarUsername = document.getElementById("sidebarUsername");
    if (sidebarUsername) sidebarUsername.textContent = username;


    document.getElementById(
        "topbarUsername"
    ).textContent = username;


    document.getElementById(
        "profileUsername"
    ).textContent = username;

    document.getElementById("profileRole").textContent = String(user.role || "ADMIN").replaceAll("_", " ");
    document.getElementById("accountRole").textContent = String(user.role || "ADMIN");
    document.getElementById("accountStatus").textContent = String(user.status || "UNKNOWN");
    document.getElementById("accountStatus").classList.toggle("active-text", user.status === "ACTIVE");
    document.getElementById("profileStatusLabel").textContent = `Akaunti ${String(user.status || "UNKNOWN").toLowerCase()}`;


    document.getElementById(
        "accountUsername"
    ).textContent = username;


    document.getElementById(
        "accountUserId"
    ).textContent =
        user.id || "—";


    document.getElementById(
        "accountCreated"
    ).textContent =
        user.created_at
            ? formatDate(user.created_at)
            : "Haijapatikana";


    document.getElementById(
        "accountUpdated"
    ).textContent =
        user.updated_at
            ? formatDate(user.updated_at)
            : "Haijapatikana";


    /* ===============================
       DATE FORMAT
    =============================== */

    function formatDate(dateValue) {

        const date =
            new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString(
            "sw-TZ",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    }

    const usernameModal =
        document.getElementById("usernameModal");
    const usernameForm =
        document.getElementById("changeUsernameForm");
    const usernameMessage =
        document.getElementById("usernameMessage");

    function showUsernameMessage(message, type) {
        usernameMessage.textContent = message;
        usernameMessage.className = `password-message ${type}`;
    }

    function closeUsernameModal() {
        usernameModal.hidden = true;
        usernameForm.reset();
        usernameMessage.textContent = "";
        usernameMessage.className = "password-message";
    }

    document.getElementById("changeUsernameBtn")?.addEventListener("click", () => {
        document.getElementById("newUsername").value = user.username || "";
        usernameModal.hidden = false;
        document.getElementById("newUsername").focus();
    });
    document.getElementById("closeUsernameModal")?.addEventListener("click", closeUsernameModal);
    document.getElementById("cancelUsernameBtn")?.addEventListener("click", closeUsernameModal);
    usernameModal?.addEventListener("click", (event) => {
        if (event.target === usernameModal) closeUsernameModal();
    });

    usernameForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        usernameMessage.textContent = "";
        usernameMessage.className = "password-message";

        const form = event.currentTarget;
        const submitButton = form.querySelector('[type="submit"]');
        const newUsername = document.getElementById("newUsername").value.trim();
        const currentPassword = document.getElementById("usernameCurrentPassword").value;

        if (newUsername.length < 3 || newUsername.length > 50) {
            showUsernameMessage("Username lazima iwe na herufi 3 hadi 50.", "error");
            return;
        }
        if (!currentPassword) {
            showUsernameMessage("Weka password yako ya sasa kuthibitisha.", "error");
            return;
        }

        submitButton.disabled = true;
        try {
            const response = await MsongolaAPI.patch("/users/me/username", {
                username: newUsername,
                current_password: currentPassword
            });
            if (!response?.success || !response.data) {
                throw new Error(response?.message || "Imeshindikana kubadilisha username.");
            }

            user = { ...user, ...response.data };
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
            const sidebarUsername = document.getElementById("sidebarUsername");
            if (sidebarUsername) sidebarUsername.textContent = user.username;
            const topbarUsername = document.getElementById("topbarUsername");
            if (topbarUsername) topbarUsername.textContent = user.username;
            const profileUsername = document.getElementById("profileUsername");
            if (profileUsername) profileUsername.textContent = user.username;
            const accountUsername = document.getElementById("accountUsername");
            if (accountUsername) accountUsername.textContent = user.username;
            const accountUpdated = document.getElementById("accountUpdated");
            if (accountUpdated) {
                accountUpdated.textContent =
                    user.updated_at ? formatDate(user.updated_at) : "Haijapatikana";
            }
            showUsernameMessage(response.message || "Username imebadilishwa kwa mafanikio.", "success");
            usernameForm.reset();
            document.getElementById("newUsername").value = user.username;
        } catch (error) {
            showUsernameMessage(error.message || "Imeshindikana kubadilisha username.", "error");
        } finally {
            submitButton.disabled = false;
        }
    });


    /* ===============================
       PASSWORD MODAL
    =============================== */

    const passwordModal =
        document.getElementById(
            "passwordModal"
        );

    const changePasswordBtn =
        document.getElementById(
            "changePasswordBtn"
        );

    const closePasswordModal =
        document.getElementById(
            "closePasswordModal"
        );

    const cancelPasswordBtn =
        document.getElementById(
            "cancelPasswordBtn"
        );


    function openPasswordModal() {

        passwordModal.hidden = false;

        document
            .getElementById(
                "currentPassword"
            )
            ?.focus();
    }


    function closePassword() {

        passwordModal.hidden = true;

        document
            .getElementById(
                "changePasswordForm"
            )
            ?.reset();

        clearPasswordMessage();
    }


    changePasswordBtn?.addEventListener(
        "click",
        openPasswordModal
    );


    closePasswordModal?.addEventListener(
        "click",
        closePassword
    );


    cancelPasswordBtn?.addEventListener(
        "click",
        closePassword
    );


    passwordModal?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                passwordModal
            ) {
                closePassword();
            }
        }
    );


    /* ===============================
       PASSWORD MESSAGE
    =============================== */

    const passwordMessage =
        document.getElementById(
            "passwordMessage"
        );


    function showPasswordMessage(
        message,
        type
    ) {

        passwordMessage.textContent =
            message;

        passwordMessage.className =
            `password-message ${type}`;
    }


    function clearPasswordMessage() {

        passwordMessage.textContent =
            "";

        passwordMessage.className =
            "password-message";
    }


    /* ===============================
       CHANGE PASSWORD
    =============================== */

    document
        .getElementById(
            "changePasswordForm"
        )
        ?.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                clearPasswordMessage();


                const currentPassword =
                    document.getElementById(
                        "currentPassword"
                    ).value;


                const newPassword =
                    document.getElementById(
                        "newPassword"
                    ).value;


                const confirmPassword =
                    document.getElementById(
                        "confirmPassword"
                    ).value;


                if (
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                ) {

                    showPasswordMessage(
                        "Jaza sehemu zote.",
                        "error"
                    );

                    return;
                }


                if (
                    newPassword.length < 8
                ) {

                    showPasswordMessage(
                        "Password mpya lazima iwe na angalau characters 8.",
                        "error"
                    );

                    return;
                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    showPasswordMessage(
                        "Password mpya hazifanani.",
                        "error"
                    );

                    return;
                }


                const form = event.currentTarget;
                const submitButton = form.querySelector('[type="submit"]');
                submitButton.disabled = true;

                try {
                    const response = await MsongolaAPI.patch("/users/me/password", {
                        current_password: currentPassword,
                        new_password: newPassword
                    });
                    if (!response?.success) {
                        throw new Error(response?.message || "Imeshindikana kubadilisha password.");
                    }
                    showPasswordMessage(response.message || "Password imebadilishwa.", "success");
                    form.reset();
                } catch (error) {
                    showPasswordMessage(error.message || "Imeshindikana kubadilisha password.", "error");
                } finally {
                    submitButton.disabled = false;
                }

            }
        );

});