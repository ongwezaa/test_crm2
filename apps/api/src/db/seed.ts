import bcrypt from "bcryptjs";
import db from "./connection";

const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
const taskStatuses = ["Todo", "Doing", "Done"] as const;

const randomItem = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDateString = (date: Date) => date.toISOString().split("T")[0];

const companies = [
  "Northwind Systems",
  "BluePeak Analytics",
  "Harbor Labs",
  "BrightPath Media",
  "Crestline Energy",
  "SummitHealth",
  "Nimbus Cloudware",
  "Lumen Logistics",
  "Horizon Ventures",
  "Cobalt Security",
  "Atlas Build",
  "IronGate Solutions",
  "Evergreen Foods",
  "PulseFit",
  "GoldenLeaf Consulting",
  "Vertex Motors",
  "Skybridge AI",
  "Opal Finance",
  "Riverstone Retail",
  "Stellar Works"
];

const industries = ["Technology", "Healthcare", "Finance", "Logistics", "Media", "Energy", "Manufacturing", "Retail", "Consulting"];

const firstNames = [
  "Ava",
  "Liam",
  "Mia",
  "Noah",
  "Sophia",
  "Ethan",
  "Olivia",
  "Lucas",
  "Isabella",
  "Mason",
  "Charlotte",
  "Elijah",
  "Amelia",
  "Logan",
  "Harper"
];

const lastNames = [
  "Nguyen",
  "Patel",
  "Anderson",
  "Chen",
  "Lopez",
  "Hughes",
  "Baker",
  "Murphy",
  "Rivera",
  "Kim",
  "Reed",
  "Carter",
  "Brooks",
  "Singh",
  "Foster"
];

const titles = ["VP Sales", "Operations Lead", "Marketing Manager", "Product Owner", "Finance Director", "Account Executive"];

const dealNames = [
  "Platform Expansion",
  "Renewal 2025",
  "CRM Modernization",
  "Cloud Migration",
  "Security Upgrade",
  "Data Warehouse",
  "Strategic Partnership",
  "Regional Rollout",
  "Customer Success Retainer",
  "AI Enablement"
];

const taskTitles = [
  "Prepare proposal",
  "Schedule discovery call",
  "Send updated pricing",
  "Review legal terms",
  "Draft implementation plan",
  "Follow up on feedback",
  "Align stakeholders",
  "Confirm scope",
  "Share deck",
  "Update forecast"
];

const noteBodies = [
  "Client wants to see a phased rollout plan.",
  "Budget approved but needs procurement review.",
  "They are comparing us to two competitors.",
  "Great engagement from the executive sponsor.",
  "Timeline is aggressive, needs weekly check-ins.",
  "Asked for a proof of concept before signing."
];

const clearTables = () => {
  db.exec(`
    DELETE FROM activity_logs;
    DELETE FROM notes;
    DELETE FROM tasks;
    DELETE FROM deals;
    DELETE FROM contacts;
    DELETE FROM companies;
    DELETE FROM users;
  `);
};

const seed = () => {
  clearTables();

  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (@name, @email, @password_hash, @role)"
  );

  const users = [
    {
      name: "Alex Morgan",
      email: "admin@localcrm.test",
      password_hash: bcrypt.hashSync("password123", 10),
      role: "Admin"
    },
    {
      name: "Jamie Rivera",
      email: "member@localcrm.test",
      password_hash: bcrypt.hashSync("password123", 10),
      role: "Member"
    }
  ];

  users.forEach((user) => insertUser.run(user));

  const insertCompany = db.prepare(
    "INSERT INTO companies (name, industry, website, phone) VALUES (@name, @industry, @website, @phone)"
  );

  const companyRecords = companies.map((name, index) => {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    return {
      name,
      industry: randomItem(industries),
      website: `https://www.${slug}.com`,
      phone: `+1-555-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`,
      index
    };
  });

  companyRecords.forEach((company) => insertCompany.run(company));

  const insertContact = db.prepare(
    "INSERT INTO contacts (company_id, first_name, last_name, email, phone, title) VALUES (@company_id, @first_name, @last_name, @email, @phone, @title)"
  );

  for (let i = 0; i < 50; i += 1) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const companyId = randomNumber(1, companies.length);
    insertContact.run({
      company_id: companyId,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companies[companyId - 1]
        .toLowerCase()
        .replace(/\s+/g, "")}.com`,
      phone: `+1-555-${randomNumber(100, 999)}-${randomNumber(1000, 9999)}`,
      title: randomItem(titles)
    });
  }

  const insertDeal = db.prepare(
    "INSERT INTO deals (company_id, name, amount, currency, stage, owner_user_id, close_date, created_at, updated_at) VALUES (@company_id, @name, @amount, @currency, @stage, @owner_user_id, @close_date, @created_at, @updated_at)"
  );

  const insertActivity = db.prepare(
    "INSERT INTO activity_logs (entity_type, entity_id, action, message, actor_user_id, created_at) VALUES (@entity_type, @entity_id, @action, @message, @actor_user_id, @created_at)"
  );

  const insertNote = db.prepare(
    "INSERT INTO notes (deal_id, author_user_id, body) VALUES (@deal_id, @author_user_id, @body)"
  );

  const now = new Date();

  for (let i = 0; i < 80; i += 1) {
    const companyId = randomNumber(1, companies.length);
    const stage = randomItem(stages);
    const ownerUserId = randomNumber(1, users.length);
    const amount = randomNumber(5000, 120000);
    const createdAt = addDays(now, -randomNumber(1, 90));
    const closeDate = addDays(now, randomNumber(-20, 60));

    const dealName = `${randomItem(dealNames)} - ${companies[companyId - 1]}`;
    const result = insertDeal.run({
      company_id: companyId,
      name: dealName,
      amount,
      currency: "USD",
      stage,
      owner_user_id: ownerUserId,
      close_date: toDateString(closeDate),
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString()
    });

    const dealId = Number(result.lastInsertRowid);

    insertActivity.run({
      entity_type: "deal",
      entity_id: dealId,
      action: "created",
      message: `Deal created in ${stage} stage.`,
      actor_user_id: ownerUserId,
      created_at: createdAt.toISOString()
    });

    insertActivity.run({
      entity_type: "deal",
      entity_id: dealId,
      action: "stage_change",
      message: `Stage updated to ${stage}.`,
      actor_user_id: ownerUserId,
      created_at: addDays(createdAt, randomNumber(1, 12)).toISOString()
    });

    if (i % 3 === 0) {
      insertNote.run({
        deal_id: dealId,
        author_user_id: ownerUserId,
        body: randomItem(noteBodies)
      });
    }
  }

  const insertTask = db.prepare(
    "INSERT INTO tasks (title, status, due_date, assigned_user_id, deal_id, created_at) VALUES (@title, @status, @due_date, @assigned_user_id, @deal_id, @created_at)"
  );

  for (let i = 0; i < 120; i += 1) {
    const status = randomItem(taskStatuses);
    const assignedUserId = randomNumber(1, users.length);
    const dealId = Math.random() > 0.3 ? randomNumber(1, 80) : null;
    const dueDate = addDays(now, randomNumber(-15, 30));
    const createdAt = addDays(now, -randomNumber(1, 40));

    const result = insertTask.run({
      title: `${randomItem(taskTitles)} (${i + 1})`,
      status,
      due_date: toDateString(dueDate),
      assigned_user_id: assignedUserId,
      deal_id: dealId,
      created_at: createdAt.toISOString()
    });

    if (status === "Done") {
      insertActivity.run({
        entity_type: "task",
        entity_id: Number(result.lastInsertRowid),
        action: "completed",
        message: "Task marked as done.",
        actor_user_id: assignedUserId,
        created_at: addDays(createdAt, randomNumber(1, 8)).toISOString()
      });
    }
  }

  console.log("Seed data inserted.");
};

seed();
