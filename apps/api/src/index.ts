import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth";
import companiesRoutes from "./routes/companies";
import contactsRoutes from "./routes/contacts";
import dealsRoutes from "./routes/deals";
import tasksRoutes from "./routes/tasks";
import dashboardRoutes from "./routes/dashboard";
import { authenticate } from "./utils/auth";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

app.use("/api/companies", authenticate, companiesRoutes);
app.use("/api/contacts", authenticate, contactsRoutes);
app.use("/api/deals", authenticate, dealsRoutes);
app.use("/api/tasks", authenticate, tasksRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`CRM API running on http://localhost:${PORT}`);
});
