(() => {
    "use strict";

    const list = document.getElementById("notificationList");
    const counter = document.getElementById("notificationCounter");
    const emptyState = document.getElementById("emptyState");
    const errorBox = document.getElementById("pageError");
    const refreshButton = document.getElementById("refreshNotifications");
    const markAllReadButton = document.getElementById("markAllReadButton");
    const logoutButton = document.getElementById("logoutButton");

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
    }

    function showError(message) {
        if (!errorBox) return;
        errorBox.textContent = message || "Imeshindikana kupakia arifa.";
        errorBox.classList.add("show");
    }

    function hideError() {
        if (!errorBox) return;
        errorBox.textContent = "";
        errorBox.classList.remove("show");
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value || "Hivi karibuni";
        return date.toLocaleString("sw-TZ", { dateStyle: "medium", timeStyle: "short" });
    }

    function renderNotifications(items) {
        const notifications = Array.isArray(items) ? items : [];
        counter.textContent = String(notifications.length);

        if (!notifications.length) {
            list.innerHTML = "";
            emptyState.hidden = false;
            return;
        }

        emptyState.hidden = true;
        list.innerHTML = notifications.map((notification) => {
            const isRead = Boolean(notification.is_read);
            return `
                <li class="notify-item" style="opacity:${isRead ? 0.8 : 1};">
                    <div class="notify-icon"><i class="fa-solid ${isRead ? "fa-envelope-open-text" : "fa-bell"}"></i></div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                            <strong>${escapeHTML(notification.title || "Arifa")}</strong>
                            <span style="font-size:12px; color:${isRead ? "#627d98" : "#0b294b"}; font-weight:700;">${isRead ? "Imesomwa" : "Mpya"}</span>
                        </div>
                        <div style="margin-top:6px; color:#627d98;">${escapeHTML(notification.message || "Hakuna ujumla")}</div>
                        <div class="notify-time">${escapeHTML(formatDate(notification.created_at))}</div>
                        ${isRead ? "" : `<div style="margin-top:10px;"><button type="button" class="ghost-btn" data-mark-read="${notification.id}"><i class="fa-solid fa-check"></i> Tia alama imesomwa</button></div>`}
                    </div>
                </li>
            `;
        }).join("");

        list.querySelectorAll("[data-mark-read]").forEach((button) => {
            button.addEventListener("click", async () => {
                const id = button.dataset.markRead;
                if (!id) return;
                try {
                    const response = await MsongolaAPI.patch(`/notifications/${id}/read`, {});
                    if (!response || !response.success) {
                        throw new Error(response?.message || "Imeshindikana kuweka arifa imesomwa.");
                    }
                    await loadNotifications();
                } catch (error) {
                    showError(error.message || "Imeshindikana kuweka arifa imesomwa.");
                }
            });
        });
    }

    async function loadNotifications() {
        try {
            hideError();
            const response = await MsongolaAPI.get("/notifications");
            if (!response || !response.success) {
                throw new Error(response?.message || "Arifa hazipatikani.");
            }

            const data = response.data || {};
            const notifications = Array.isArray(data.notifications) ? data.notifications : (Array.isArray(data) ? data : []);
            renderNotifications(notifications);
        } catch (error) {
            list.innerHTML = "";
            emptyState.hidden = false;
            emptyState.textContent = error.message || "Imeshindikana kupakia arifa.";
            showError(error.message || "Imeshindikana kupakia arifa.");
        }
    }

    async function markAllRead() {
        try {
            hideError();
            const response = await MsongolaAPI.patch("/notifications/read-all", {});
            if (!response || !response.success) {
                throw new Error(response?.message || "Imeshindikana kusoma arifa zote.");
            }
            await loadNotifications();
        } catch (error) {
            showError(error.message || "Imeshindikana kusoma arifa zote.");
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        const allowed = await MsongolaAuth.protectPage({ roles: ["SUBJECT_TEACHER"] });
        if (!allowed) return;

        refreshButton?.addEventListener("click", loadNotifications);
        markAllReadButton?.addEventListener("click", markAllRead);
        logoutButton?.addEventListener("click", () => MsongolaAuth.logout());

        await loadNotifications();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }
})();
