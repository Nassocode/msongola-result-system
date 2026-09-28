const express = require("express");

const authController = require("../controllers/authController");

const {
    protect,
    authorize
} = require("../middlewares/authMiddleware");

const router = express.Router();


// ==============================
// LOGIN
// ==============================

router.post("/login", authController.login);


// ==============================
// TEST AUTHENTICATION
// ==============================

router.get("/me", protect, (req, res) => {

    res.status(200).json({
        success: true,
        message: "Authenticated successfully",
        user: req.user
    });

});


// ==============================
// TEST ADMIN ROLE
// ==============================

router.get(
    "/admin-test",
    protect,
    authorize("ADMIN"),
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "Admin access granted",
            user: req.user
        });

    }
);


module.exports = router;