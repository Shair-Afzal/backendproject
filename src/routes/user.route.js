import { Router } from "express";
import { registeruser } from "../controllers/user.js";

const router=Router();

router.route("/api/v1/register").post(registeruser)

export default router