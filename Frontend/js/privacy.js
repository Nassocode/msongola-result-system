(() => {
    "use strict";

    async function initialize() {
        if (!window.MsongolaAuth) {
            console.error("MsongolaAuth haijapatikana; ukurasa wa faragha hauwezi kulindwa.");
            return;
        }

        const allowed = await MsongolaAuth.protectPage({
            roles: ["ACADEMIC_MASTER", "SUBJECT_TEACHER"]
        });
        if (!allowed) return;

        const user = MsongolaAuth.getUser();
        const dashboard = document.getElementById("privacyBack");
        if (dashboard && user?.role === "SUBJECT_TEACHER") {
            dashboard.href = "../teacher/dashboard.html";
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
