import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/", (_req, res) => {
  const companies = db
    .prepare("SELECT * FROM companies ORDER BY name")
    .all();
  res.json(companies);
});

router.post("/", (req, res) => {
  const { name, industry, website, phone } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  const result = db
    .prepare(
      "INSERT INTO companies (name, industry, website, phone) VALUES (?, ?, ?, ?)"
    )
    .run(name, industry ?? null, website ?? null, phone ?? null);

  const company = db
    .prepare("SELECT * FROM companies WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(company);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, industry, website, phone } = req.body;
  db.prepare(
    "UPDATE companies SET name = ?, industry = ?, website = ?, phone = ? WHERE id = ?"
  ).run(name, industry, website, phone, id);

  const company = db
    .prepare("SELECT * FROM companies WHERE id = ?")
    .get(id);
  res.json(company);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM companies WHERE id = ?").run(id);
  res.status(204).send();
});

export default router;
