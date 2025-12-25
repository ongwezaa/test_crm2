import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/", (_req, res) => {
  const contacts = db
    .prepare(
      `SELECT contacts.*, companies.name as company_name
       FROM contacts
       JOIN companies ON contacts.company_id = companies.id
       ORDER BY contacts.created_at DESC`
    )
    .all();
  res.json(contacts);
});

router.post("/", (req, res) => {
  const { company_id, first_name, last_name, email, phone, title } = req.body;
  if (!company_id || !first_name || !last_name) {
    return res.status(400).json({ message: "Company, first name, and last name are required" });
  }
  const result = db
    .prepare(
      "INSERT INTO contacts (company_id, first_name, last_name, email, phone, title) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(company_id, first_name, last_name, email ?? null, phone ?? null, title ?? null);

  const contact = db
    .prepare("SELECT * FROM contacts WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(contact);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { company_id, first_name, last_name, email, phone, title } = req.body;
  db.prepare(
    "UPDATE contacts SET company_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, title = ? WHERE id = ?"
  ).run(company_id, first_name, last_name, email, phone, title, id);

  const contact = db
    .prepare("SELECT * FROM contacts WHERE id = ?")
    .get(id);
  res.json(contact);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  res.status(204).send();
});

export default router;
