const express = require("express");
const controller = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(protect);
router.get("/", controller.list);
router.patch("/read-all", controller.markAllRead);
router.patch("/:id/read", controller.markRead);

module.exports = router;
