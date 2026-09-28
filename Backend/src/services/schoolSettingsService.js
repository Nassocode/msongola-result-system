const schoolSettingsModel =
    require("../models/schoolSettingsModel");

const userModel =
    require("../models/userModel");


// =========================================================
// ALLOWED STATUS
// =========================================================

const ALLOWED_STATUSES = [
    "ACTIVE",
    "INACTIVE"
];


// =========================================================
// GET SCHOOL SETTINGS
// =========================================================

async function getSchoolSettings() {

    const settings =
        await schoolSettingsModel
            .getSchoolSettings();

    if (!settings) {
        throw new Error(
            "Taarifa za shule hazijapatikana"
        );
    }

    return settings;
}


// =========================================================
// GET SCHOOL SETTINGS BY ID
// =========================================================

async function getSchoolSettingsById(id) {

    const settings =
        await schoolSettingsModel
            .getSchoolSettingsById(id);

    if (!settings) {
        throw new Error(
            "Taarifa za shule hazijapatikana"
        );
    }

    return settings;
}


// =========================================================
// VALIDATE SCHOOL SETTINGS
// =========================================================

async function validateSchoolSettings(data) {

    const {
        school_name,
        email,
        academic_master_user_id,
        status
    } = data;


    // -----------------------------------------------------
    // SCHOOL NAME
    // -----------------------------------------------------

    if (!school_name) {

        throw new Error(
            "Jina la shule linahitajika"
        );
    }

    const cleanSchoolName =
        String(school_name).trim();

    if (cleanSchoolName.length < 3) {

        throw new Error(
            "Jina la shule lazima liwe na angalau characters 3"
        );
    }


    // -----------------------------------------------------
    // EMAIL
    // -----------------------------------------------------

    if (email) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(String(email).trim())) {

            throw new Error(
                "Email ya shule sio sahihi"
            );
        }
    }


    // -----------------------------------------------------
    // STATUS
    // -----------------------------------------------------

    if (
        status &&
        !ALLOWED_STATUSES.includes(status)
    ) {

        throw new Error(
            "Status ya shule sio sahihi"
        );
    }


    // -----------------------------------------------------
    // ACADEMIC MASTER
    // -----------------------------------------------------

    if (academic_master_user_id) {

        const academicMaster =
            await userModel.findUserById(
                academic_master_user_id
            );

        if (!academicMaster) {

            throw new Error(
                "Academic Master account haijapatikana"
            );
        }

        if (
            academicMaster.role !==
            "ACADEMIC_MASTER"
        ) {

            throw new Error(
                "User aliyechaguliwa sio Academic Master"
            );
        }

        if (
            academicMaster.status !==
            "ACTIVE"
        ) {

            throw new Error(
                "Academic Master account haipo ACTIVE"
            );
        }
    }


    // -----------------------------------------------------
    // RETURN CLEAN DATA
    // -----------------------------------------------------

    return {

        school_name:
            cleanSchoolName,

        po_box:
            data.po_box
                ? String(data.po_box).trim()
                : null,

        motto:
            data.motto
                ? String(data.motto).trim()
                : null,

        head_of_school:
            data.head_of_school
                ? String(data.head_of_school).trim()
                : null,

        academic_master_user_id:
            academic_master_user_id || null,

        phone:
            data.phone
                ? String(data.phone).trim()
                : null,

        email:
            email
                ? String(email).trim()
                : null,

        logo_path:
            data.logo_path
                ? String(data.logo_path).trim()
                : null,

        status:
            status || "ACTIVE"
    };
}


// =========================================================
// CREATE SCHOOL SETTINGS
// =========================================================

async function createSchoolSettings(data) {

    const validatedData =
        await validateSchoolSettings(data);


    const existing =
        await schoolSettingsModel
            .getSchoolSettings();


    if (existing) {

        throw new Error(
            "School settings tayari zipo. Tumia update badala ya create."
        );
    }


    const id =
        await schoolSettingsModel
            .createSchoolSettings(
                validatedData
            );


    return await schoolSettingsModel
        .getSchoolSettingsById(id);
}


// =========================================================
// UPDATE CURRENT / ACTIVE SCHOOL SETTINGS
// =========================================================
//
// HII NDIYO FUNCTION MPYA.
//
// Frontend haitumi ID.
// Service inatafuta school settings yenyewe.
// =========================================================

async function updateCurrentSchoolSettings(data) {

    // -----------------------------------------------------
    // GET CURRENT SETTINGS
    // -----------------------------------------------------

    const existing =
        await schoolSettingsModel
            .getSchoolSettings();


    if (!existing) {

        throw new Error(
            "School settings hazijapatikana. Tengeneza school settings kwanza."
        );
    }


    // -----------------------------------------------------
    // MERGE EXISTING DATA + NEW DATA
    // -----------------------------------------------------
    //
    // Hii ni muhimu sana.
    //
    // Frontend yetu inatuma:
    //
    // school_name
    // po_box
    // motto
    // head_of_school
    //
    // Hatutaki fields nyingine kama:
    //
    // email
    // phone
    // logo_path
    // academic_master_user_id
    //
    // zipotee kwa kuwekwa NULL.
    //

    const mergedData = {

        school_name:
            data.school_name !== undefined
                ? data.school_name
                : existing.school_name,

        po_box:
            data.po_box !== undefined
                ? data.po_box
                : existing.po_box,

        motto:
            data.motto !== undefined
                ? data.motto
                : existing.motto,

        head_of_school:
            data.head_of_school !== undefined
                ? data.head_of_school
                : existing.head_of_school,

        academic_master_user_id:
            data.academic_master_user_id !== undefined
                ? data.academic_master_user_id
                : existing.academic_master_user_id,

        phone:
            data.phone !== undefined
                ? data.phone
                : existing.phone,

        email:
            data.email !== undefined
                ? data.email
                : existing.email,

        logo_path:
            data.logo_path !== undefined
                ? data.logo_path
                : existing.logo_path,

        status:
            data.status !== undefined
                ? data.status
                : existing.status
    };


    // -----------------------------------------------------
    // VALIDATE MERGED DATA
    // -----------------------------------------------------

    const validatedData =
        await validateSchoolSettings(
            mergedData
        );


    // -----------------------------------------------------
    // UPDATE USING EXISTING ID
    // -----------------------------------------------------

    await schoolSettingsModel
        .updateSchoolSettings(
            existing.id,
            validatedData
        );


    // -----------------------------------------------------
    // RETURN UPDATED SETTINGS
    // -----------------------------------------------------

    return await schoolSettingsModel
        .getSchoolSettingsById(
            existing.id
        );
}


// =========================================================
// UPDATE SCHOOL SETTINGS BY ID
// =========================================================

async function updateSchoolSettings(
    id,
    data
) {

    const existing =
        await schoolSettingsModel
            .getSchoolSettingsById(id);


    if (!existing) {

        throw new Error(
            "School settings hazijapatikana"
        );
    }


    // -----------------------------------------------------
    // MERGE EXISTING DATA + NEW DATA
    // -----------------------------------------------------

    const mergedData = {

        school_name:
            data.school_name !== undefined
                ? data.school_name
                : existing.school_name,

        po_box:
            data.po_box !== undefined
                ? data.po_box
                : existing.po_box,

        motto:
            data.motto !== undefined
                ? data.motto
                : existing.motto,

        head_of_school:
            data.head_of_school !== undefined
                ? data.head_of_school
                : existing.head_of_school,

        academic_master_user_id:
            data.academic_master_user_id !== undefined
                ? data.academic_master_user_id
                : existing.academic_master_user_id,

        phone:
            data.phone !== undefined
                ? data.phone
                : existing.phone,

        email:
            data.email !== undefined
                ? data.email
                : existing.email,

        logo_path:
            data.logo_path !== undefined
                ? data.logo_path
                : existing.logo_path,

        status:
            data.status !== undefined
                ? data.status
                : existing.status
    };


    // -----------------------------------------------------
    // VALIDATE
    // -----------------------------------------------------

    const validatedData =
        await validateSchoolSettings(
            mergedData
        );


    // -----------------------------------------------------
    // UPDATE
    // -----------------------------------------------------

    await schoolSettingsModel
        .updateSchoolSettings(
            id,
            validatedData
        );


    // -----------------------------------------------------
    // RETURN UPDATED SETTINGS
    // -----------------------------------------------------

    return await schoolSettingsModel
        .getSchoolSettingsById(id);
}


// =========================================================
// UPDATE SCHOOL LOGO
// =========================================================

async function updateSchoolLogo(
    id,
    logo_path
) {

    const existing =
        await schoolSettingsModel
            .getSchoolSettingsById(id);


    if (!existing) {

        throw new Error(
            "School settings hazijapatikana"
        );
    }


    if (!logo_path) {

        throw new Error(
            "Logo path inahitajika"
        );
    }


    const cleanLogoPath =
        String(logo_path).trim();


    if (!cleanLogoPath) {

        throw new Error(
            "Logo path inahitajika"
        );
    }


    await schoolSettingsModel
        .updateSchoolLogo(
            id,
            cleanLogoPath
        );


    return await schoolSettingsModel
        .getSchoolSettingsById(id);
}


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    getSchoolSettings,

    getSchoolSettingsById,

    createSchoolSettings,

    updateCurrentSchoolSettings,

    updateSchoolSettings,

    updateSchoolLogo

};