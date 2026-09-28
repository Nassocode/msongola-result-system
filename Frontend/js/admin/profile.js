document.addEventListener("DOMContentLoaded", () => {

    const TOKEN_KEY = "msongola_token";
    const USER_KEY = "msongola_user";

    const token =
        localStorage.getItem(TOKEN_KEY);

    const storedUser =
        localStorage.getItem(USER_KEY);


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

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

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


    /* ===============================
       USER DATA
    =============================== */

    const username =
        user.username || "Admin";


    document.getElementById(
        "sidebarUsername"
    ).textContent = username;


    document.getElementById(
        "topbarUsername"
    ).textContent = username;


    document.getElementById(
        "profileUsername"
    ).textContent = username;


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


    /* ===============================
       SIDEBAR
    =============================== */

    const sidebar =
        document.getElementById("sidebar");

    const mobileMenuBtn =
        document.getElementById("mobileMenuBtn");

    const sidebarClose =
        document.getElementById("sidebarClose");

    const sidebarOverlay =
        document.getElementById("sidebarOverlay");


    function openSidebar() {

        sidebar?.classList.add(
            "sidebar-open"
        );

        sidebarOverlay?.classList.add(
            "active"
        );
    }


    function closeSidebar() {

        sidebar?.classList.remove(
            "sidebar-open"
        );

        sidebarOverlay?.classList.remove(
            "active"
        );
    }


    mobileMenuBtn?.addEventListener(
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


    /* ===============================
       LOGOUT
    =============================== */

    function logout() {

        const confirmed =
            confirm(
                "Una uhakika unataka kutoka kwenye mfumo?"
            );

        if (!confirmed) {
            return;
        }

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            USER_KEY
        );

        window.location.href =
            "../login.html";
    }


    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    document
        .getElementById("profileLogoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


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


                /*
                    BACKEND INAKUJA:

                    PATCH
                    /api/users/:id/password

                    Kwa sasa hatutumii
                    API mpaka backend endpoint
                    iwe tayari.
                */


                showPasswordMessage(
                    "Password endpoint bado haijaunganishwa na backend.",
                    "error"
                );

            }
        );

});