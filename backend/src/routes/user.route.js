import express from "express";

import {
  registerUser,
  fetchUsers
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/", registerUser);
router.get("/", fetchUsers);

export default router;

