import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/", (_req, res) => {
  const tasks = db
    .prepare(
      `SELECT tasks.*, users.name as assigned_user_name, deals.name as deal_name
       FROM tasks
       JOIN users ON tasks.assigned_user_id = users.id
       LEFT JOIN deals ON tasks.deal_id = deals.id
       ORDER BY tasks.due_date ASC`
    )
    .all();
  res.json(tasks);
});

router.post("/", (req, res) => {
  const { title, status, due_date, assigned_user_id, deal_id } = req.body;
  if (!title || !status || !assigned_user_id) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const result = db
    .prepare(
      "INSERT INTO tasks (title, status, due_date, assigned_user_id, deal_id) VALUES (?, ?, ?, ?, ?)"
    )
    .run(title, status, due_date ?? null, assigned_user_id, deal_id ?? null);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(task);
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, status, due_date, assigned_user_id, deal_id } = req.body;
  db.prepare(
    "UPDATE tasks SET title = ?, status = ?, due_date = ?, assigned_user_id = ?, deal_id = ? WHERE id = ?"
  ).run(title, status, due_date, assigned_user_id, deal_id, id);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(task);
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  res.status(204).send();
});

export default router;
