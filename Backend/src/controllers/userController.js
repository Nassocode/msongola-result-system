
const userService = require("../services/userService");

// ============================================================
// CREATE USER
// POST /api/users
// ============================================================
async function createUser(req, res) {
    try {
        const { username, password, role, status, teacher_number, first_name, middle_name, last_name } = req.body;

        const user = await userService.createUser({
            username,
            password,
            role,
            status,
            teacher_number,
            first_name,
            middle_name,
            last_name
        });

        return res.status(201).json({
            success: true,
            message: "Mtumiaji ameundwa successfully",
            data: user
        });

    } catch (error) {
        console.error("Create user error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ============================================================
// GET ALL USERS
// GET /api/users
// ============================================================
async function getAllUsers(req, res) {
    try {
        const users = await userService.getAllUsers();

        return res.status(200).json({
            success: true,
            message: "Watumiaji wamepatikana",
            data: users
        });

    } catch (error) {
        console.error("Get users error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Imeshindikana kupata watumiaji"
        });
    }
}


// ============================================================
// GET USER BY ID
// GET /api/users/:id
// ============================================================
async function getUserById(req, res) {
    try {
        const { id } = req.params;

        const user = await userService.getUserById(id);

        return res.status(200).json({
            success: true,
            message: "Mtumiaji amepatikana",
            data: user
        });

    } catch (error) {
        console.error("Get user error:", error.message);

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}


// ============================================================
// UPDATE USER
// PUT /api/users/:id
// ============================================================
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { username, role } = req.body;

        const user = await userService.updateUser(
            id,
            {
                username,
                role
            }
        );

        return res.status(200).json({
            success: true,
            message: "Taarifa za mtumiaji zimebadilishwa",
            data: user
        });

    } catch (error) {
        console.error("Update user error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ============================================================
// CHANGE USER STATUS
// PATCH /api/users/:id/status
// ============================================================
async function changeUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const user = await userService.changeUserStatus(
            id,
            status
        );

        return res.status(200).json({
            success: true,
            message: "Status ya mtumiaji imebadilishwa",
            data: user
        });

    } catch (error) {
        console.error("Change status error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}


// ============================================================
// CHANGE USER PASSWORD
// PATCH /api/users/:id/password
// ============================================================
async function changeUserPassword(req, res) {
    try {
        const { id } = req.params;
        const { password } = req.body;

        await userService.changeUserPassword(
            id,
            password
        );

        return res.status(200).json({
            success: true,
            message: "Password imebadilishwa successfully"
        });

    } catch (error) {
        console.error("Change password error:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

async function changeOwnPassword(req, res) {
    try {
        await userService.changeOwnPassword(req.user.id, req.body || {});
        return res.status(200).json({
            success: true,
            message: "Password yako imebadilishwa successfully."
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Imeshindikana kubadilisha password."
        });
    }
}


// ============================================================
// EXPORT
// ============================================================
module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    changeUserStatus,
    changeUserPassword,
    changeOwnPassword
};
