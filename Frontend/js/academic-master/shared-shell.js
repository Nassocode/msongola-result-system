(() => {
    "use strict";

    const body = document.body;
    const isCatalogPage = body.classList.contains("catalog-page") && body.dataset.role === "ACADEMIC_MASTER";
    const isOperationsPage = body.classList.contains("academic-ops");
    if (!isCatalogPage && !isOperationsPage) return;

    body.querySelectorAll('.catalog-header a[href="dashboard.html"], .ops-header a[href="dashboard.html"]').forEach((link) => {
        const actions = link.parentElement;
        link.remove();
        if (actions && !actions.children.length) actions.remove();
    });

    body.classList.add("academic-aux");
    body.dataset.role = "ACADEMIC_MASTER";

    const dashboardStyles = document.createElement("link");
    dashboardStyles.rel = "stylesheet";
    dashboardStyles.href = "../../css/academic-master-dashboard.css";
    document.head.appendChild(dashboardStyles);

    const shellStyles = document.createElement("link");
    shellStyles.rel = "stylesheet";
    shellStyles.href = "../../css/academic-master-auxiliary.css?v=20260928-1";
    document.head.appendChild(shellStyles);

    const sourceNodes = [...body.childNodes].filter((node) => !(node.nodeType === 1 && node.tagName === "SCRIPT"));
    const scripts = [...body.querySelectorAll(":scope > script")].filter((script) => script !== document.currentScript);
    const pageTitle = body.querySelector("h1")?.textContent.trim() || "Academic Master";
    const currentPath = window.location.pathname.split("/").pop();

    const navigation = [
        ["dashboard.html", "Dashboard", "fa-chart-pie"],
        ["students.html", "Wanafunzi", "fa-user-graduate"],
        ["teachers.html", "Walimu", "fa-chalkboard-user"],
        ["classes.html", "Madarasa", "fa-school"],
        ["subjects.html", "Masomo", "fa-book-open"],
        ["examinations.html", "Mitihani", "fa-file-pen"],
        ["assignments.html", "Teacher Assignments", "fa-user-check"],
        ["class-teachers.html", "Class Teachers", "fa-person-chalkboard"],
        ["submissions.html", "Mark Submissions", "fa-inbox"],
        ["results.html", "Matokeo", "fa-chart-column"],
        ["reports.html", "Ripoti", "fa-file-lines"],
        ["profile.html", "Wasifu Wangu", "fa-user"],
        ["notifications.html", "Arifa", "fa-bell"]
    ];

    const appShell = document.createElement("div");
    appShell.className = "app-shell academic-aux-shell";
    appShell.innerHTML = `
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <aside class="sidebar" id="sidebar">
            <div class="brand">
                <div class="brand-mark"><i class="fa-solid fa-school"></i></div>
                <div class="brand-text"><h2>MSONGOLA</h2><span>RESULT SYSTEM</span></div>
                <button class="sidebar-close" id="sidebarClose" type="button" aria-label="Funga menyu"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="sidebar-divider"></div>
            <nav class="sidebar-nav" aria-label="Menyu ya Academic Master">
                <p class="nav-label">MUHTASARI</p>
                ${navigation.slice(0, 1).map((item) => `<a href="${item[0]}" class="nav-link"><span class="nav-icon"><i class="fa-solid ${item[2]}"></i></span><span>${item[1]}</span></a>`).join("")}
                <p class="nav-label">USIMAMIZI WA MASOMO</p>
                ${navigation.slice(1, 5).map((item) => `<a href="${item[0]}" class="nav-link"><span class="nav-icon"><i class="fa-solid ${item[2]}"></i></span><span>${item[1]}</span></a>`).join("")}
                <p class="nav-label">MITIHANI & MATOKEO</p>
                ${navigation.slice(5, 11).map((item) => `<a href="${item[0]}" class="nav-link"><span class="nav-icon"><i class="fa-solid ${item[2]}"></i></span><span>${item[1]}</span></a>`).join("")}
                <p class="nav-label">AKAUNTI</p>
                ${navigation.slice(11).map((item) => `<a href="${item[0]}" class="nav-link"><span class="nav-icon"><i class="fa-solid ${item[2]}"></i></span><span>${item[1]}</span></a>`).join("")}
            </nav>
            <div class="sidebar-bottom"><div class="sidebar-user"><div class="user-avatar" data-aux-avatar>AM</div><div class="sidebar-user-info"><strong data-aux-name>Academic Master</strong><span>Academic Master</span></div></div><button class="logout-btn" id="auxLogout" type="button"><i class="fa-solid fa-right-from-bracket"></i><span>Toka kwenye mfumo</span></button></div>
        </aside>
        <div class="main-content">
            <header class="topbar">
                <div class="topbar-left"><button class="menu-toggle" id="menuToggle" type="button" aria-label="Fungua menyu"><i class="fa-solid fa-bars"></i></button><div class="page-heading"><span class="topbar-school-name">MSONGOLA SECONDARY SCHOOL</span><h1>${pageTitle.replace(/[<>&"']/g, "")}</h1></div></div>
                <div class="topbar-right"><div class="topbar-user"><div class="topbar-avatar" data-aux-avatar>AM</div><div class="topbar-user-info"><strong data-aux-name>Academic Master</strong><span>Academic Master</span></div><i class="fa-solid fa-chevron-down"></i></div></div>
            </header>
            <section class="page-content academic-aux-content"></section>
        </div>
    `;

    const content = appShell.querySelector(".academic-aux-content");
    sourceNodes.forEach((node) => content.appendChild(node));
    body.replaceChildren(appShell, ...scripts);

    const activeLink = appShell.querySelector(`.sidebar-nav a[href="${CSS.escape(currentPath)}"]`);
    activeLink?.classList.add("active");

    const user = window.MsongolaAuth?.getUser?.();
    const displayName = user?.full_name || user?.name || user?.username || "Academic Master";
    const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "AM";
    appShell.querySelectorAll("[data-aux-name]").forEach((element) => { element.textContent = displayName; });
    appShell.querySelectorAll("[data-aux-avatar]").forEach((element) => { element.textContent = initials; });

    const sidebar = appShell.querySelector("#sidebar");
    const overlay = appShell.querySelector("#sidebarOverlay");
    const closeSidebar = () => {
        sidebar.classList.remove("sidebar-open");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
    };
    appShell.querySelector("#menuToggle")?.addEventListener("click", () => {
        sidebar.classList.add("sidebar-open");
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
    });
    appShell.querySelector("#sidebarClose")?.addEventListener("click", closeSidebar);
    overlay.addEventListener("click", closeSidebar);
    appShell.querySelector("#auxLogout")?.addEventListener("click", () => window.MsongolaAuth?.logout());
    appShell.querySelectorAll(".sidebar-nav a").forEach((link) => link.addEventListener("click", () => {
        if (window.innerWidth < 901) closeSidebar();
    }));
})();
