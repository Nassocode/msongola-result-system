const express = require("express");
const cors = require("cors");


// =========================================================
// ROUTES
// =========================================================

const authRoutes =
    require("./routes/authRoutes");

const userRoutes =
    require("./routes/userRoutes");

const schoolSettingsRoutes =
    require("./routes/schoolSettingsRoutes");

const academicMasterRoutes =
    require("./routes/academicMasterRoutes");

const academicOperationsRoutes =
    require("./routes/academicOperationsRoutes");

const auditLogRoutes =
    require("./routes/auditLogRoutes");

const notificationRoutes =
    require("./routes/notificationRoutes");

const studentRoutes =
    require("./routes/studentRoutes");

const teacherDashboardRoutes =
    require("./routes/teacherDashboardRoutes");

const teacherMarksRoutes =
    require("./routes/teacherMarksRoutes");

const adminCatalogRoutes =
    require("./routes/adminCatalogRoutes");


// =========================================================
// CREATE EXPRESS APP
// =========================================================

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================================================
// API ROUTES
// =========================================================


// ---------------------------------------------------------
// AUTHENTICATION
// ---------------------------------------------------------

app.use(
    "/api/auth",
    authRoutes
);


// ---------------------------------------------------------
// USER MANAGEMENT
// ---------------------------------------------------------

app.use(
    "/api/users",
    userRoutes
);


// ---------------------------------------------------------
// SCHOOL SETTINGS
// ---------------------------------------------------------

app.use(
    "/api/school-settings",
    schoolSettingsRoutes
);


// ---------------------------------------------------------
// AUDIT LOGS
// ---------------------------------------------------------

app.use(
    "/api/audit-logs",
    auditLogRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);


// ---------------------------------------------------------
// ACADEMIC MASTER
// ---------------------------------------------------------

app.use(
    "/api/academic-master",
    academicMasterRoutes
);

app.use(
    "/api/academic-master/operations",
    academicOperationsRoutes
);


// ---------------------------------------------------------
// STUDENTS
// ---------------------------------------------------------

app.use(
    "/api/students",
    studentRoutes
);


// ---------------------------------------------------------
// SUBJECT TEACHER DASHBOARD
// ---------------------------------------------------------

app.use(
    "/api/teacher",
    teacherDashboardRoutes
);

app.use(
    "/api/teacher/marks",
    teacherMarksRoutes
);


// ---------------------------------------------------------
// ADMIN TEACHERS, CLASSES, AND SUBJECTS
// ---------------------------------------------------------

app.use(
    "/api/admin-catalog",
    adminCatalogRoutes
);


// =========================================================
// API ROOT
// =========================================================

app.get("/", (req, res) => {

    res.status(200).json({

        success: true,

        message:
            "Msongola Result System API is running"

    });

});


// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint haijapatikana"

    });

});


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server Error:",
            err
        );


        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);


// =========================================================
// EXPORT APP
// =========================================================

module.exports = app;