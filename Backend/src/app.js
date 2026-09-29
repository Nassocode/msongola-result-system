
const express = require("express");
const cors = require("cors");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const schoolSettingsRoutes = require("./routes/schoolSettingsRoutes");
const academicMasterRoutes = require("./routes/academicMasterRoutes");
const academicOperationsRoutes = require("./routes/academicOperationsRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherDashboardRoutes = require("./routes/teacherDashboardRoutes");
const teacherMarksRoutes = require("./routes/teacherMarksRoutes");
const adminCatalogRoutes = require("./routes/adminCatalogRoutes");

// Reports
const reportRoutes = require("./routes/reportRoutes");


// =====================================================
// APP
// =====================================================

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/school-settings",
    schoolSettingsRoutes
);

app.use(
    "/api/audit-logs",
    auditLogRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
    "/api/students",
    studentRoutes
);

app.use(
    "/api/teacher",
    teacherDashboardRoutes
);

app.use(
    "/api/teacher/marks",
    teacherMarksRoutes
);

app.use(
    "/api/admin-catalog",
    adminCatalogRoutes
);


// =====================================================
// ACADEMIC MASTER
// =====================================================

app.use(
    "/api/academic-master",
    academicMasterRoutes
);


// =====================================================
// REPORTS
// IMPORTANT:
// This must come before the general operations route.
// =====================================================

app.use(
    "/api/academic-master/operations/reports",
    reportRoutes
);


// =====================================================
// OTHER ACADEMIC OPERATIONS
// =====================================================

app.use(
    "/api/academic-master/operations",
    academicOperationsRoutes
);


// =====================================================
// ROOT API
// =====================================================

app.get(
    "/",
    (req, res) => {

        return res.status(200).json({

            success: true,

            message:
                "Msongola Result System API is running"

        });

    }
);


// =====================================================
// 404 HANDLER
// =====================================================

app.use(
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                "API endpoint haijapatikana"

        });

    }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server Error:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = app;