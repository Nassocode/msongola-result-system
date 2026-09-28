(() => {
    "use strict";
    import("./shared-shell.js").catch((error) => console.error("Academic shell unavailable:", error));

    const list = document.getElementById("notificationList");
    const empty = document.getElementById("notificationEmpty");
    const errorBox = document.getElementById("notificationError");
    const count = document.getElementById("notificationCount");

    function escapeHTML(value) {
        const node = document.createElement("span");
        node.textContent = value ?? "";
        return node.innerHTML;
    }

    function formatDate(value) {
        if (!value) return "";
        return new Intl.DateTimeFormat("sw-TZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    }

    function render(data) {
        const items = data.notifications || [];
        count.textContent = `${data.unread_count || 0} hazijasomwa · ${items.length} jumla`;
        empty.hidden = items.length > 0;
        list.innerHTML = items.map((item) => `
            <article class="notice-item${item.is_read ? "" : " unread"}">
                <div class="notice-icon"><i class="fa-solid ${item.is_read ? "fa-envelope-open" : "fa-envelope"}"></i></div>
                <div class="notice-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><time>${escapeHTML(formatDate(item.created_at))}${item.sender_username ? ` · ${escapeHTML(item.sender_username)}` : ""}</time></div>
                ${item.is_read ? "" : `<button class="ops-button secondary" type="button" data-mark-read="${item.id}">Weka kuwa limesomwa</button>`}
            </article>
        `).join("");
    }

    async function load() {
        errorBox.hidden = true;
        try {
            const response = await MsongolaAPI.get("/notifications");
            if (!response?.success) throw new Error(response?.message || "Imeshindikana kupakia arifa.");
            render(response.data || {});
        } catch (error) {
            errorBox.textContent = error.message || "Imeshindikana kupakia arifa.";
            errorBox.hidden = false;
        }
    }

    async function initialize() {
        if (!window.MsongolaAuth || !window.MsongolaAPI) return;
        if (!await MsongolaAuth.protectPage({ roles: ["ACADEMIC_MASTER"] })) return;
        document.getElementById("refreshNotifications").addEventListener("click", load);
        document.getElementById("markAllRead").addEventListener("click", async () => {
            try {
                const response = await MsongolaAPI.patch("/notifications/read-all", {});
                if (!response?.success) throw new Error(response?.message || "Imeshindikana kusoma arifa.");
                await load();
            } catch (error) {
                errorBox.textContent = error.message;
                errorBox.hidden = false;
            }
        });
        list.addEventListener("click", async (event) => {
            const button = event.target.closest("[data-mark-read]");
            if (!button) return;
            button.disabled = true;
            try {
                const response = await MsongolaAPI.patch(`/notifications/${button.dataset.markRead}/read`, {});
                if (!response?.success) throw new Error(response?.message || "Imeshindikana kusoma arifa.");
                await load();
            } catch (error) {
                errorBox.textContent = error.message;
                errorBox.hidden = false;
                button.disabled = false;
            }
        });
        await load();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
    else initialize();
})();
