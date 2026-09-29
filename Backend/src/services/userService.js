
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

/*
|--------------------------------------------------------------------------
| ALLOWED USER ROLES
|--------------------------------------------------------------------------
|
| Admin ndiye anayeweza ku-create:
| - ACADEMIC_MASTER
| - SUBJECT_TEACHER
|
| Hatutaruhusu Admin ku-create ADMIN mwingine kupitia UI.
|--------------------------------------------------------------------------
*/

const ALLOWED_ROLES = [
    "ACADEMIC_MASTER",
    "SUBJECT_TEACHER"
];

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/
async function createUser(data) {
    const {
        username,
        password,
        role,
        status = "ACTIVE"
    } = data;
    const normalizedRole = String(role || "").trim().toUpperCase();

    if (!username || !password || !role) {
        throw new Error(
            "Username, password na role vinahitajika"
        );
    }

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
        throw new Error(
            "Role hii hairuhusiwi kuundwa na Admin"
        );
    }

    const normalizedStatus = String(status).trim().toUpperCase();

    if (!["ACTIVE", "INACTIVE"].includes(normalizedStatus)) {
        throw new Error("Status sio sahihi");
    }

    const cleanUsername = username.trim();

    if (cleanUsername.length < 3) {
        throw new Error(
            "Username lazima iwe na angalau characters 3"
        );
    }

    if (password.length < 8) {
        throw new Error(
            "Password lazima iwe na angalau characters 8"
        );
    }

    const teacherProfile = {
        teacherNumber: String(data.teacher_number || "").trim().toUpperCase(),
        firstName: String(data.first_name || "").trim(),
        middleName: String(data.middle_name || "").trim() || null,
        lastName: String(data.last_name || "").trim()
    };

    if (normalizedRole === "SUBJECT_TEACHER") {
        if (!teacherProfile.teacherNumber || !teacherProfile.firstName || !teacherProfile.lastName) {
            throw new Error("Teacher number, jina la kwanza na jina la mwisho vinahitajika kwa Subject Teacher.");
        }
    }

    const exists = await userModel.usernameExists(
        cleanUsername
    );

    if (exists) {
        throw new Error(
            "Username tayari inatumika"
        );
    }

    const passwordHash = await bcrypt.hash(
        password,
        12
    );

    const userId = normalizedRole === "SUBJECT_TEACHER"
        ? await userModel.createUserWithTeacher({
            username: cleanUsername,
            passwordHash,
            status: normalizedStatus,
            ...teacherProfile
        })
        : await userModel.createUser({
            username: cleanUsername,
            passwordHash,
            role: normalizedRole,
            status: normalizedStatus
        });

    return await userModel.findUserById(userId);
}

/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
*/
async function getAllUsers() {
    return await userModel.findAllUsers();
}

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/
async function getUserById(id) {
    const user = await userModel.findUserById(id);

    if (!user) {
        throw new Error("Mtumiaji hakupatikana");
    }

    return user;
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
async function updateUser(id, data) {
    const {
        username,
        role
    } = data;

    if (!username || !role) {
        throw new Error(
            "Username na role vinahitajika"
        );
    }

    if (!ALLOWED_ROLES.includes(role)) {
        throw new Error(
            "Role hii hairuhusiwi"
        );
    }

    const cleanUsername = username.trim();

    const existingUser =
        await userModel.findUserById(id);

    if (!existingUser) {
        throw new Error(
            "Mtumiaji hakupatikana"
        );
    }

    const usernameTaken =
        await userModel.usernameExists(
            cleanUsername,
            id
        );

    if (usernameTaken) {
        throw new Error(
            "Username tayari inatumika"
        );
    }

    await userModel.updateUser(
        id,
        cleanUsername,
        role
    );

    return await userModel.findUserById(id);
}

/*
|--------------------------------------------------------------------------
| CHANGE USER STATUS
|--------------------------------------------------------------------------
*/
async function changeUserStatus(id, status) {
    const allowedStatuses = [
        "ACTIVE",
        "INACTIVE"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error(
            "Status sio sahihi"
        );
    }

    const user =
        await userModel.findUserById(id);

    if (!user) {
        throw new Error(
            "Mtumiaji hakupatikana"
        );
    }

    await userModel.updateUserStatus(
        id,
        status
    );

    return await userModel.findUserById(id);
}

/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/
async function changeUserPassword(id, password) {
    if (!password || password.length < 8) {
        throw new Error(
            "Password lazima iwe na angalau characters 8"
        );
    }

    const user =
        await userModel.findUserById(id);

    if (!user) {
        throw new Error(
            "Mtumiaji hakupatikana"
        );
    }

    const passwordHash =
        await bcrypt.hash(password, 12);

    await userModel.updateUserPassword(
        id,
        passwordHash
    );

    return true;
}

async function changeOwnPassword(userId, data) {
    const currentPassword = String(data.current_password || "");
    const newPassword = String(data.new_password || "");

    if (!currentPassword || !newPassword) {
        throw new Error("Password ya sasa na password mpya vinahitajika.");
    }
    if (newPassword.length < 8) {
        throw new Error("Password mpya lazima iwe na angalau characters 8.");
    }
    if (newPassword === currentPassword) {
        throw new Error("Password mpya lazima iwe tofauti na ya sasa.");
    }

    const passwordHash = await userModel.findPasswordHashById(userId);
    if (!passwordHash || !await bcrypt.compare(currentPassword, passwordHash)) {
        throw new Error("Password ya sasa si sahihi.");
    }

    await userModel.updateUserPassword(userId, await bcrypt.hash(newPassword, 12));
    return true;
}

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    changeUserStatus,
    changeUserPassword,
    changeOwnPassword
};
