const express = require("express");

const userController = require("../controllers/userController");
const {
    protect,
    authorize
} = require("../middlewares/authMiddleware");

const router = express.Router();

 

router.post(
    "/",
    protect,
    authorize("ADMIN"),
    userController.createUser
);

router.get(
    "/",
    protect,
    authorize("ADMIN"),
    userController.getAllUsers
);

router.patch(
    "/me/password",
    protect,
    authorize("ADMIN", "ACADEMIC_MASTER", "SUBJECT_TEACHER"),
    userController.changeOwnPassword
);

router.patch(
    "/me/username",
    protect,
    authorize("ADMIN"),
    userController.changeOwnUsername
);

router.get(
    "/:id",
    protect,
    authorize("ADMIN"),
    userController.getUserById
);

router.put(
    "/:id",
    protect,
    authorize("ADMIN"),
    userController.updateUser
);

router.patch(
    "/:id/status",
    protect,
    authorize("ADMIN"),
    userController.changeUserStatus
);

router.patch(
    "/:id/password",
    protect,
    authorize("ADMIN"),
    userController.changeUserPassword
);

module.exports = router;