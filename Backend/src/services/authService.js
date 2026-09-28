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

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    };
}

module.exports = {
    loginUser
};