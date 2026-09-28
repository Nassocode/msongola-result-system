/* =========================================================
   MSONGOLA SECONDARY SCHOOL
   RESULT MANAGEMENT SYSTEM
   AUTH CONTROLLER
   ========================================================= */

const authService =
    require("../services/authService");

const auditLogService =
    require("../services/auditLogService");


/* =========================================================
   LOGIN
   ========================================================= */

async function login(req, res) {

    const username =
        req.body?.username
            ? String(req.body.username).trim()
            : "";

    const password =
        req.body?.password || "";


    /* =====================================================
       BASIC VALIDATION
       ===================================================== */

    if (!username || !password) {

        return res.status(400).json({

            success: false,

            message:
                "Username na password vinahitajika"

        });
    }


    /* =====================================================
       REQUEST INFORMATION
       ===================================================== */

    const ipAddress =
        req.ip ||
        req.socket?.remoteAddress ||
        null;


    const userAgent =
        req.get("User-Agent") ||
        null;


    try {

        /* =================================================
           AUTHENTICATE USER
           ================================================= */

        const result =
            await authService.loginUser(
                username,
                password
            );


        /* =================================================
           SUCCESSFUL LOGIN AUDIT
           ================================================= */

        try {

            await auditLogService.createAuditLog({

                user_id:
                    result.user?.id || null,

                action:
                    "LOGIN_SUCCESS",

                description:
                    `Mtumiaji ${username} ameingia kwenye mfumo kwa mafanikio.`,

                module:
                    "AUTHENTICATION",

                ip_address:
                    ipAddress,

                user_agent:
                    userAgent

            });

        } catch (auditError) {

            /*
             * Audit failure should NOT block
             * a successful login.
             */

            console.error(
                "⚠️ Login audit log failed:",
                auditError.message
            );
        }


        /* =================================================
           LOGIN RESPONSE
           ================================================= */

        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            data:
                result

        });


    } catch (error) {

        /* =================================================
           FAILED LOGIN AUDIT
           ================================================= */

        try {

            await auditLogService.createAuditLog({

                user_id:
                    null,

                action:
                    "LOGIN_FAILED",

                description:
                    `Jaribio la kuingia limekataa kwa username ${username}.`,

                module:
                    "AUTHENTICATION",

                ip_address:
                    ipAddress,

                user_agent:
                    userAgent

            });

        } catch (auditError) {

            console.error(
                "⚠️ Failed login audit log failed:",
                auditError.message
            );
        }


        /* =================================================
           LOGIN ERROR RESPONSE
           ================================================= */

        console.error(
            "Login error:",
            error.message
        );


        return res.status(401).json({

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

    login

};