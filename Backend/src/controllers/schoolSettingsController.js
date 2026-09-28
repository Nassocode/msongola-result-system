/* =========================================================
   MSONGOLA SECONDARY SCHOOL
   RESULT MANAGEMENT SYSTEM
   SCHOOL SETTINGS CONTROLLER
   ========================================================= */

const schoolSettingsService =
    require("../services/schoolSettingsService");

const auditLogService =
    require("../services/auditLogService");


/* =========================================================
   REQUEST INFORMATION HELPER
   ========================================================= */

function getRequestInfo(req) {

    return {
        user_id:
            req.user?.id || null,

        ip_address:
            req.ip ||
            req.socket?.remoteAddress ||
            null,

        user_agent:
            req.get("User-Agent") ||
            null
    };
}


/* =========================================================
   GET SCHOOL SETTINGS
   ========================================================= */

async function getSchoolSettings(req, res) {

    try {

        const settings =
            await schoolSettingsService
                .getSchoolSettings();

        return res.status(200).json({

            success: true,

            message:
                "Taarifa za shule zimepatikana",

            data:
                settings

        });

    } catch (error) {

        console.error(
            "Get school settings error:",
            error.message
        );

        return res.status(404).json({

            success: false,

            message:
                error.message

        });
    }
}


/* =========================================================
   GET SCHOOL SETTINGS BY ID
   ========================================================= */

async function getSchoolSettingsById(
    req,
    res
) {

    try {

        const { id } =
            req.params;


        const settings =
            await schoolSettingsService
                .getSchoolSettingsById(id);


        return res.status(200).json({

            success: true,

            message:
                "Taarifa za shule zimepatikana",

            data:
                settings

        });

    } catch (error) {

        console.error(
            "Get school settings by ID error:",
            error.message
        );

        return res.status(404).json({

            success: false,

            message:
                error.message

        });
    }
}


/* =========================================================
   CREATE SCHOOL SETTINGS
   ========================================================= */

async function createSchoolSettings(
    req,
    res
) {

    try {

        const settings =
            await schoolSettingsService
                .createSchoolSettings(
                    req.body
                );


        /*
         * AUDIT LOG
         */

        const requestInfo =
            getRequestInfo(req);


        try {

            await auditLogService
                .createAuditLog({

                    ...requestInfo,

                    action:
                        "SCHOOL_SETTINGS_CREATED",

                    description:
                        "Taarifa za shule zimeundwa.",

                    module:
                        "SCHOOL_SETTINGS"

                });

        } catch (auditError) {

            console.error(
                "School settings create audit failed:",
                auditError.message
            );
        }


        return res.status(201).json({

            success: true,

            message:
                "Taarifa za shule zimehifadhiwa",

            data:
                settings

        });

    } catch (error) {

        console.error(
            "Create school settings error:",
            error.message
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
}


/* =========================================================
   UPDATE CURRENT SCHOOL SETTINGS
   ========================================================= */

async function updateCurrentSchoolSettings(
    req,
    res
) {

    try {

        /*
         * Update school settings
         */

        const settings =
            await schoolSettingsService
                .updateCurrentSchoolSettings(
                    req.body
                );


        /* ================================================
           AUDIT LOG
           ================================================ */

        const requestInfo =
            getRequestInfo(req);


        try {

            await auditLogService
                .createAuditLog({

                    ...requestInfo,

                    action:
                        "SCHOOL_SETTINGS_UPDATED",

                    description:
                        "Taarifa za shule zimebadilishwa.",

                    module:
                        "SCHOOL_SETTINGS"

                });

        } catch (auditError) {

            /*
             * Audit failure should not
             * cancel successful settings update.
             */

            console.error(
                "School settings audit failed:",
                auditError.message
            );
        }


        return res.status(200).json({

            success: true,

            message:
                "Taarifa za shule zimebadilishwa",

            data:
                settings

        });

    } catch (error) {

        console.error(
            "Update current school settings error:",
            error.message
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
}


/* =========================================================
   UPDATE SCHOOL SETTINGS BY ID
   ========================================================= */

async function updateSchoolSettings(
    req,
    res
) {

    try {

        const { id } =
            req.params;


        const settings =
            await schoolSettingsService
                .updateSchoolSettings(
                    id,
                    req.body
                );


        /* ================================================
           AUDIT LOG
           ================================================ */

        const requestInfo =
            getRequestInfo(req);


        try {

            await auditLogService
                .createAuditLog({

                    ...requestInfo,

                    action:
                        "SCHOOL_SETTINGS_UPDATED",

                    description:
                        `Taarifa za shule zenye ID ${id} zimebadilishwa.`,

                    module:
                        "SCHOOL_SETTINGS"

                });

        } catch (auditError) {

            console.error(
                "School settings update audit failed:",
                auditError.message
            );
        }


        return res.status(200).json({

            success: true,

            message:
                "Taarifa za shule zimebadilishwa",

            data:
                settings

        });

    } catch (error) {

        console.error(
            "Update school settings error:",
            error.message
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
}


/* =========================================================
   UPDATE SCHOOL LOGO
   ========================================================= */

async function updateSchoolLogo(
    req,
    res
) {

    try {

        const { id } =
            req.params;


        const { logo_path } =
            req.body;


        const settings =
            await schoolSettingsService
                .updateSchoolLogo(
                    id,
                    logo_path
                );


        /* ================================================
           AUDIT LOG
           ================================================ */

        const requestInfo =
            getRequestInfo(req);


        try {

            await auditLogService
                .createAuditLog({

                    ...requestInfo,

                    action:
                        "SCHOOL_LOGO_UPDATED",

                    description:
                        `Logo ya shule yenye ID ${id} imebadilishwa.`,

                    module:
                        "SCHOOL_SETTINGS"

                });

        } catch (auditError) {

            console.error(
                "School logo audit failed:",
                auditError.message
            );
        }


        return res.status(200).json({

            success: true,

            message:
                "Logo ya shule imebadilishwa",

            data:
                settings

        });

    } catch (error) {

        console.error(
            "Update school logo error:",
            error.message
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });
    }
}


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {

    getSchoolSettings,

    getSchoolSettingsById,

    createSchoolSettings,

    updateCurrentSchoolSettings,

    updateSchoolSettings,

    updateSchoolLogo

};