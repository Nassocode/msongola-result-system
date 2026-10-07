const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");
const generateToken = require("../utils/generateToken");

async function loginUser(username, password) {

    const user = await userModel.findUserByUsername(username);

    if (!user) {
        throw new Error("Username au password sio sahihi");
    }

    if (user.status !== "ACTIVE") {
        throw new Error("Akaunti hii haipo active");
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordMatch) {
        throw new Error("Username au password sio sahihi");
    }

    const normalizedUser = {
        ...user,
        role: user.role === "TEACHER" ? "SUBJECT_TEACHER" : user.role
    };
    const token = generateToken(normalizedUser);

    return {
        token,
        user: {
            id: normalizedUser.id,
            username: normalizedUser.username,
            role: normalizedUser.role
        }
    };
}

module.exports = {
    loginUser
};