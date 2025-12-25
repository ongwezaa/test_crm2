import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/", (_req, res) => {
  const deals = db
    .prepare(
      `SELECT deals.*, companies.name as company_name, users.name as owner_name
       FROM deals
       JOIN companies ON deals.company_id = companies.id
       JOIN users ON deals.owner_user_id = users.id
       ORDER BY deals.updated_at DESC`
    )
    .all();
  res.json(deals);
});

router.post("/", (req, res) => {
  const { company_id, name, amount, currency, stage, owner_user_id, close_date } = req.body;
  if (!company_id || !name || !amount || !stage || !owner_user_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const now = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO deals (company_id, name, amount, currency, stage, owner_user_id, close_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      company_id,
      name,
      amount,
      currency ?? "USD",
      stage,
      owner_user_id,
      close_date ?? null,
      now,
      now
    );

  const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(deal);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { company_id, name, amount, currency, stage, owner_user_id, close_date } = req.body;
  const updatedAt = new Date().toISOString();

  db.prepare(
    `UPDATE deals
     SET company_id = ?, name = ?, amount = ?, currency = ?, stage = ?, owner_user_id = ?, close_date = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    company_id,
    name,
    amount,
    currency,
    stage,
    owner_user_id,
    close_date,
    updatedAt,
    id
  );

  const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
  res.json(deal);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  res.status(204).send();
});

router.patch("/:id/stage", (req, res) => {
  const { id } = req.params;
  const { stage, actor_user_id } = req.body;
  if (!stage) {
    return res.status(400).json({ message: "Stage is required" });
  }

  const updatedAt = new Date().toISOString();
  db.prepare("UPDATE deals SET stage = ?, updated_at = ? WHERE id = ?").run(stage, updatedAt, id);

  if (actor_user_id) {
    db.prepare(
      "INSERT INTO activity_logs (entity_type, entity_id, action, message, actor_user_id) VALUES (?, ?, ?, ?, ?)"
    ).run("deal", id, "stage_change", `Deal moved to ${stage}.`, actor_user_id);
  }

  const deal = db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
  res.json(deal);
});

export default router;
