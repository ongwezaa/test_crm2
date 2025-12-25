export const showToast = (message, type = "success") => {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.style.background = type === "error" ? "#dc2626" : "#111827";
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value || 0);

export const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export const setLoading = (isLoading) => {
  document.body.style.cursor = isLoading ? "progress" : "default";
};
