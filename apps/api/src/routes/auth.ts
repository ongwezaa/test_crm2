import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db/connection";
import { authenticate, signToken } from "../utils/auth";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = db
    .prepare("SELECT id, name, email, password_hash, role FROM users WHERE email = ?")
    .get(email) as { id: number; name: string; email: string; password_hash: string; role: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id, role: user.role });

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

router.get("/me", authenticate, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email, role FROM users WHERE id = ?")
    .get(req.user?.userId);

  return res.json(user);
});

export default router;
