import {
  login,
  getMe,
  getDashboardSummary,
  getDashboardCharts,
  getDeals,
  updateDeal,
  updateDealStage,
  getCompanies,
  getContacts,
  getTasks,
  getToken
} from "./api.js";
import { showToast, formatCurrency, formatDate, setLoading } from "./ui.js";

const state = {
  user: null,
  deals: [],
  companies: [],
  contacts: [],
  tasks: [],
  search: ""
};

const stages = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const charts = {
  dealsStage: null,
  wonLost: null,
  tasksStatus: null
};

const loginView = document.getElementById("login-view");
const mainView = document.getElementById("main-view");
const loginForm = document.getElementById("login-form");
const logoutButton = document.getElementById("logout-button");
const navItems = document.querySelectorAll(".nav-item");
const pageTitle = document.getElementById("page-title");
const globalSearch = document.getElementById("global-search");
const userPill = document.getElementById("user-pill");

const viewSections = {
  dashboard: document.getElementById("dashboard-view"),
  deals: document.getElementById("deals-view"),
  companies: document.getElementById("companies-view"),
  contacts: document.getElementById("contacts-view"),
  tasks: document.getElementById("tasks-view")
};

const metricTotalDeals = document.getElementById("metric-total-deals");
const metricPipeline = document.getElementById("metric-pipeline");
const metricClosing = document.getElementById("metric-closing");
const metricTasks = document.getElementById("metric-tasks");
const metricOverdue = document.getElementById("metric-overdue");

const activityFeed = document.getElementById("activity-feed");
const kanbanBoard = document.getElementById("kanban-board");
const dealsTable = document.getElementById("deals-table");
const companiesList = document.getElementById("companies-list");
const contactsTable = document.getElementById("contacts-table");
const tasksList = document.getElementById("tasks-list");
const kanbanToggle = document.getElementById("kanban-toggle");
const tableToggle = document.getElementById("table-toggle");
const tableBoard = document.getElementById("table-board");

const setActiveView = (view) => {
  Object.entries(viewSections).forEach(([key, section]) => {
    if (!section) return;
    if (key === view) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  navItems.forEach((item) => {
    if (item.dataset.view === view) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  pageTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1);
};

const renderDashboard = async () => {
  const [summary, chartsData] = await Promise.all([
    getDashboardSummary(),
    getDashboardCharts()
  ]);

  metricTotalDeals.textContent = summary.totalDeals;
  metricPipeline.textContent = formatCurrency(summary.pipelineValue);
  metricClosing.textContent = summary.dealsClosingThisMonth;
  metricTasks.textContent = summary.totalTasks;
  metricOverdue.textContent = `${summary.overdueTasks} overdue`;

  const dealsStageCtx = document.getElementById("deals-stage-chart");
  const wonLostCtx = document.getElementById("won-lost-chart");
  const tasksStatusCtx = document.getElementById("tasks-status-chart");

  const dealsStageLabels = chartsData.dealsByStage.map((item) => item.stage);
  const dealsStageValues = chartsData.dealsByStage.map((item) => item.count);

  charts.dealsStage?.destroy();
  charts.dealsStage = new Chart(dealsStageCtx, {
    type: "bar",
    data: {
      labels: dealsStageLabels,
      datasets: [
        {
          label: "Deals",
          data: dealsStageValues,
          backgroundColor: "#6366f1"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  const wonLostLabels = chartsData.wonLost.map((item) => item.stage);
  const wonLostValues = chartsData.wonLost.map((item) => item.count);
  charts.wonLost?.destroy();
  charts.wonLost = new Chart(wonLostCtx, {
    type: "pie",
    data: {
      labels: wonLostLabels,
      datasets: [
        {
          data: wonLostValues,
          backgroundColor: ["#22c55e", "#f97316"]
        }
      ]
    },
    options: {
      responsive: true
    }
  });

  const tasksLabels = chartsData.tasksByStatus.map((item) => item.status);
  const tasksValues = chartsData.tasksByStatus.map((item) => item.count);
  charts.tasksStatus?.destroy();
  charts.tasksStatus = new Chart(tasksStatusCtx, {
    type: "doughnut",
    data: {
      labels: tasksLabels,
      datasets: [
        {
          data: tasksValues,
          backgroundColor: ["#38bdf8", "#facc15", "#4ade80"]
        }
      ]
    },
    options: {
      responsive: true
    }
  });

  activityFeed.innerHTML = "";
  chartsData.recentActivity.forEach((item) => {
    const li = document.createElement("li");
    li.className = "border-b border-slate-100 pb-2";
    li.innerHTML = `<div class="font-medium text-slate-700">${item.actor_name}</div>
      <div>${item.message}</div>
      <div class="text-xs text-slate-400">${new Date(item.created_at).toLocaleString()}</div>`;
    activityFeed.appendChild(li);
  });
};

const renderKanban = () => {
  kanbanBoard.innerHTML = "";
  const filteredDeals = state.deals.filter((deal) =>
    deal.name.toLowerCase().includes(state.search.toLowerCase())
  );

  stages.forEach((stage) => {
    const column = document.createElement("div");
    column.className = "kanban-column";
    column.dataset.stage = stage;
    column.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold">${stage}</h4>
        <span class="text-xs text-slate-400">${
          filteredDeals.filter((deal) => deal.stage === stage).length
        }</span>
      </div>
    `;

    column.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    column.addEventListener("drop", async (event) => {
      event.preventDefault();
      const dealId = event.dataTransfer.getData("text/plain");
      const deal = state.deals.find((item) => String(item.id) === dealId);
      if (!deal || deal.stage === stage) return;
      try {
        setLoading(true);
        await updateDealStage(dealId, {
          stage,
          actor_user_id: state.user.id
        });
        deal.stage = stage;
        renderKanban();
        renderDealsTable();
        showToast(`Deal moved to ${stage}`);
        renderDashboard();
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setLoading(false);
      }
    });

    filteredDeals
      .filter((deal) => deal.stage === stage)
      .forEach((deal) => {
        const card = document.createElement("div");
        card.className = "kanban-card";
        card.draggable = true;
        card.innerHTML = `
          <div class="text-sm font-semibold">${deal.name}</div>
          <div class="text-xs text-slate-500">${deal.company_name}</div>
          <div class="text-sm font-medium mt-2">${formatCurrency(deal.amount)}</div>
          <div class="text-xs text-slate-400">Owner: ${deal.owner_name}</div>
        `;

        card.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text/plain", deal.id);
          card.classList.add("dragging");
        });

        card.addEventListener("dragend", () => {
          card.classList.remove("dragging");
        });

        column.appendChild(card);
      });

    kanbanBoard.appendChild(column);
  });
};

const renderDealsTable = () => {
  dealsTable.innerHTML = "";
  const filteredDeals = state.deals.filter((deal) =>
    deal.name.toLowerCase().includes(state.search.toLowerCase())
  );

  filteredDeals.forEach((deal) => {
    const row = document.createElement("tr");
    row.className = "table-row";

    row.innerHTML = `
      <td contenteditable="true" data-field="name">${deal.name}</td>
      <td>${deal.company_name}</td>
      <td>
        <select data-field="stage" class="rounded border border-slate-200 px-2 py-1">
          ${stages
            .map(
              (stage) =>
                `<option value="${stage}" ${stage === deal.stage ? "selected" : ""}>${stage}</option>`
            )
            .join("")}
        </select>
      </td>
      <td contenteditable="true" data-field="amount">${deal.amount}</td>
      <td>${deal.owner_name}</td>
      <td><input type="date" data-field="close_date" value="${deal.close_date}" class="rounded border border-slate-200 px-2 py-1" /></td>
    `;

    row.querySelectorAll("[contenteditable='true']").forEach((cell) => {
      cell.addEventListener("blur", async (event) => {
        const field = event.target.dataset.field;
        if (!field) return;
        const value = event.target.textContent.trim();
        await handleDealUpdate(deal, field, value);
      });
    });

    const stageSelect = row.querySelector("select");
    stageSelect.addEventListener("change", async (event) => {
      await handleDealUpdate(deal, "stage", event.target.value);
    });

    const dateInput = row.querySelector("input[type='date']");
    dateInput.addEventListener("change", async (event) => {
      await handleDealUpdate(deal, "close_date", event.target.value);
    });

    dealsTable.appendChild(row);
  });
};

const handleDealUpdate = async (deal, field, value) => {
  const updatedDeal = { ...deal, [field]: field === "amount" ? Number(value) : value };
  try {
    setLoading(true);
    await updateDeal(deal.id, {
      company_id: deal.company_id,
      name: updatedDeal.name,
      amount: updatedDeal.amount,
      currency: deal.currency,
      stage: updatedDeal.stage,
      owner_user_id: deal.owner_user_id,
      close_date: updatedDeal.close_date
    });
    Object.assign(deal, updatedDeal);
    renderKanban();
    renderDealsTable();
    showToast("Deal updated");
    renderDashboard();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(false);
  }
};

const renderCompanies = () => {
  companiesList.innerHTML = "";
  const filtered = state.companies.filter((company) =>
    company.name.toLowerCase().includes(state.search.toLowerCase())
  );
  filtered.forEach((company) => {
    const card = document.createElement("div");
    card.className = "border border-slate-200 rounded-xl p-4 bg-slate-50";
    card.innerHTML = `
      <h5 class="font-semibold">${company.name}</h5>
      <p class="text-xs text-slate-500">${company.industry || "Industry"}</p>
      <p class="text-xs text-slate-400 mt-2">${company.website || ""}</p>
      <p class="text-xs text-slate-400">${company.phone || ""}</p>
    `;
    companiesList.appendChild(card);
  });
};

const renderContacts = () => {
  contactsTable.innerHTML = "";
  state.contacts.forEach((contact) => {
    const row = document.createElement("tr");
    row.className = "border-b border-slate-100";
    row.innerHTML = `
      <td class="px-4 py-2">${contact.first_name} ${contact.last_name}</td>
      <td class="px-4 py-2">${contact.company_name}</td>
      <td class="px-4 py-2">${contact.email || "-"}</td>
      <td class="px-4 py-2">${contact.phone || "-"}</td>
      <td class="px-4 py-2">${contact.title || "-"}</td>
    `;
    contactsTable.appendChild(row);
  });
};

const renderTasks = () => {
  tasksList.innerHTML = "";
  const today = new Date();
  state.tasks.forEach((task) => {
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const isOverdue = dueDate && dueDate < today && task.status !== "Done";
    const item = document.createElement("div");
    item.className = `task-item ${isOverdue ? "task-overdue" : ""}`;
    item.innerHTML = `
      <div>
        <p class="font-medium">${task.title}</p>
        <p class="text-xs text-slate-500">${task.deal_name || "No deal linked"}</p>
        <p class="text-xs text-slate-400">Assigned to ${task.assigned_user_name}</p>
      </div>
      <div class="text-right">
        <span class="text-xs font-semibold">${task.status}</span>
        <p class="text-xs text-slate-400">${formatDate(task.due_date)}</p>
      </div>
    `;
    tasksList.appendChild(item);
  });
};

const fetchAllData = async () => {
  const [deals, companies, contacts, tasks] = await Promise.all([
    getDeals(),
    getCompanies(),
    getContacts(),
    getTasks()
  ]);
  state.deals = deals;
  state.companies = companies;
  state.contacts = contacts;
  state.tasks = tasks;
  renderKanban();
  renderDealsTable();
  renderCompanies();
  renderContacts();
  renderTasks();
};

const initApp = async () => {
  if (!getToken()) {
    loginView.classList.remove("hidden");
    mainView.classList.add("hidden");
    return;
  }

  try {
    setLoading(true);
    const user = await getMe();
    state.user = user;
    userPill.textContent = `${user.name} (${user.role})`;
    loginView.classList.add("hidden");
    mainView.classList.remove("hidden");
    setActiveView("dashboard");
    await fetchAllData();
    await renderDashboard();
  } catch (error) {
    showToast(error.message, "error");
    localStorage.removeItem("crm_token");
    loginView.classList.remove("hidden");
    mainView.classList.add("hidden");
  } finally {
    setLoading(false);
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    setLoading(true);
    const result = await login(payload);
    localStorage.setItem("crm_token", result.token);
    state.user = result.user;
    userPill.textContent = `${result.user.name} (${result.user.role})`;
    loginView.classList.add("hidden");
    mainView.classList.remove("hidden");
    setActiveView("dashboard");
    await fetchAllData();
    await renderDashboard();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(false);
  }
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("crm_token");
  loginView.classList.remove("hidden");
  mainView.classList.add("hidden");
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    setActiveView(item.dataset.view);
  });
});

if (globalSearch) {
  globalSearch.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderKanban();
    renderDealsTable();
    renderCompanies();
  });
}

kanbanToggle.addEventListener("click", () => {
  kanbanToggle.classList.add("active");
  tableToggle.classList.remove("active");
  tableBoard.classList.add("hidden");
  kanbanBoard.classList.remove("hidden");
});

tableToggle.addEventListener("click", () => {
  tableToggle.classList.add("active");
  kanbanToggle.classList.remove("active");
  kanbanBoard.classList.add("hidden");
  tableBoard.classList.remove("hidden");
});

initApp();
