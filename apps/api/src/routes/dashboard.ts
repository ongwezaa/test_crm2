import { Router } from "express";
import db from "../db/connection.js";

const router = Router();

router.get("/summary", (_req, res) => {
  const totalDeals = db.prepare("SELECT COUNT(*) as count FROM deals").get() as { count: number };
  const pipelineValue = db
    .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deals WHERE stage NOT IN ('Won', 'Lost')")
    .get() as { total: number };
  const dealsClosingThisMonth = db
    .prepare(
      "SELECT COUNT(*) as count FROM deals WHERE strftime('%Y-%m', close_date) = strftime('%Y-%m', 'now')"
    )
    .get() as { count: number };
  const totalTasks = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };
  const overdueTasks = db
    .prepare(
      "SELECT COUNT(*) as count FROM tasks WHERE status != 'Done' AND due_date < date('now')"
    )
    .get() as { count: number };

  res.json({
    totalDeals: totalDeals.count,
    pipelineValue: pipelineValue.total,
    dealsClosingThisMonth: dealsClosingThisMonth.count,
    totalTasks: totalTasks.count,
    overdueTasks: overdueTasks.count
  });
});

router.get("/charts", (_req, res) => {
  const dealsByStage = db
    .prepare("SELECT stage, COUNT(*) as count FROM deals GROUP BY stage ORDER BY count DESC")
    .all();

  const wonLost = db
    .prepare(
      "SELECT stage, COUNT(*) as count FROM deals WHERE stage IN ('Won', 'Lost') GROUP BY stage"
    )
    .all();

  const tasksByStatus = db
    .prepare("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
    .all();

  const recentActivity = db
    .prepare(
      `SELECT activity_logs.*, users.name as actor_name
       FROM activity_logs
       JOIN users ON activity_logs.actor_user_id = users.id
       ORDER BY activity_logs.created_at DESC
       LIMIT 10`
    )
    .all();

  res.json({
    dealsByStage,
    wonLost,
    tasksByStatus,
    recentActivity
  });
});

export default router;
