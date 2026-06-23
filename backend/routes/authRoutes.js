import express from "express";
import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../models/userModel.js";
import { signToken } from "../utils/jwt.js";
import { logAudit } from "../models/auditModel.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "student" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const id = await createUser({ name, email, passwordHash: hash, role });
    const token = signToken({ id, email, role });

    res.status(201).json({ token, user: { id, name, email, role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    if (user.role === "student") {
      await logAudit({
        user_id: user.id,
        action: "Student login",
        module: "auth",
        details: user.email
      });
    }

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;
