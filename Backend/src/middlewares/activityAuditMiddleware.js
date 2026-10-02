const auditLogService = require("../services/auditLogService");

const controllerAuditedPrefixes = [
    "/api/auth",
    "/api/users",
    "/api/school-settings",
    "/api/admin-catalog",
    "/api/audit-logs"
];

function getAuditModule(pathname) {
    if (pathname.startsWith("/api/academic-master/operations/reports")) return "REPORTS";
    if (pathname.startsWith("/api/teacher/marks")) return "MARKS";
    if (pathname.startsWith("/api/academic-master/operations")) return "ACADEMIC_OPERATIONS";
    if (pathname.startsWith("/api/students")) return "STUDENTS";
    if (pathname.startsWith("/api/notifications")) return "NOTIFICATIONS";
    return "SYSTEM_ACTIVITY";
}

function getAuditAction(method, pathname, moduleName) {
    if (pathname.endsWith("/exports/pdf") || pathname.endsWith("/exports/excel")) return "REPORT_EXPORTED";
    if (pathname.endsWith("/marks/submit")) return "MARKS_SUBMITTED";
    if (pathname.endsWith("/marks/draft")) return "MARKS_DRAFT_SAVED";
    if (/\/submissions\/\d+\/review$/.test(pathname)) return "SUBMISSION_REVIEWED";
    if (/\/examinations\/\d+\/status$/.test(pathname)) return "EXAMINATION_STATUS_UPDATED";
    if (pathname.endsWith("/examinations") && method === "POST") return "EXAMINATION_CREATED";
    if (pathname.endsWith("/profile/password")) return "PASSWORD_CHANGED";
    if (pathname.endsWith("/notifications/read-all")) return "NOTIFICATIONS_MARKED_READ";
    if (/\/notifications\/\d+\/read$/.test(pathname)) return "NOTIFICATION_MARKED_READ";

    const suffix = method === "POST"
        ? "CREATED"
        : method === "DELETE"
            ? "DELETED"
            : "UPDATED";
    return `${moduleName}_${suffix}`;
}

function activityAuditMiddleware(req, res, next) {
    const method = req.method.toUpperCase();
    const pathname = String(req.originalUrl || req.url || "").split("?")[0];
    const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const alreadyAudited = controllerAuditedPrefixes.some((prefix) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

    if (!pathname.startsWith("/api/") || !isMutation || alreadyAudited) {
        return next();
    }

    res.once("finish", () => {
        const userId = req.user?.id ?? req.user?.user_id ?? req.user?.userId;
        if (!userId || res.statusCode < 200 || res.statusCode >= 400) return;

        const moduleName = getAuditModule(pathname);
        const safePath = pathname.replace(/\/\d+(?=\/|$)/g, "/:id");
        const recordMatch = pathname.match(/\/(\d+)(?:\/|$)/);

        auditLogService.createAuditLog({
            user_id: userId,
            action: getAuditAction(method, pathname, moduleName),
            module: moduleName,
            record_id: recordMatch ? Number(recordMatch[1]) : null,
            description: `Successful ${method} ${safePath} (HTTP ${res.statusCode})`,
            new_values: {
                method,
                path: safePath,
                status_code: res.statusCode
            },
            ip_address: req.ip || req.socket?.remoteAddress || null,
            user_agent: req.get("User-Agent") || null
        }).catch((error) => {
            console.error("Activity audit write failed:", error.message);
        });
    });

    return next();
}

module.exports = activityAuditMiddleware;