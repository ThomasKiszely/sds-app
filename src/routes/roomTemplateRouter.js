const express = require("express");
const router = express.Router();
const roomTemplateController = require("../controllers/roomTemplateController");
const { requireAdmin } = require("../middlewares/requireAdmin");
const { validateRoomTemplate } = require("../middlewares/validateRoomTemplate");
const { validateObjectId } = require("../middlewares/validateObjectId");

router.get("/page", requireAdmin, roomTemplateController.showRoomTemplatePage);
router.get("/new", requireAdmin, roomTemplateController.showCreateForm);
router.post("/", requireAdmin, validateRoomTemplate, roomTemplateController.createRoomTemplate);
router.get("/edit/:id", requireAdmin, validateObjectId('id'), roomTemplateController.showEditForm);
router.post("/edit/:id", requireAdmin, validateObjectId('id'), validateRoomTemplate, roomTemplateController.updateRoomTemplate);
router.post("/delete/:id", requireAdmin, validateObjectId('id'), roomTemplateController.deleteRoomTemplate);


module.exports = router;
