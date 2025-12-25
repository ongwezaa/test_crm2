const API_BASE = "http://localhost:3000/api";

const getToken = () => localStorage.getItem("crm_token");

const request = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const login = (payload) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const getMe = () => request("/auth/me");

export const getDashboardSummary = () => request("/dashboard/summary");
export const getDashboardCharts = () => request("/dashboard/charts");

export const getDeals = () => request("/deals");
export const updateDeal = (id, payload) =>
  request(`/deals/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const updateDealStage = (id, payload) =>
  request(`/deals/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const getCompanies = () => request("/companies");
export const getContacts = () => request("/contacts");
export const getTasks = () => request("/tasks");

export { getToken };
