import express from "express";
import {
  sendAppointmentMessages,
} from "../controllers/whatsappController.js";

const router = express.Router();

router.post("/send-appointments", sendAppointmentMessages);

export default router;