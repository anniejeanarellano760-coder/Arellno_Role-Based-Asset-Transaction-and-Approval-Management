// =====================================================================
// dashboard.html — App bootstrap
// Handles: auth guard, current user/profile, role-based navigation,
// shared helpers (statusPill, closeModal), logout.
//
// LOAD ORDER MATTERS: this file must be the LAST <script> tag in
// dashboard.html because init() below calls loadEquipment(),
// loadMyRequests(), loadApprovals(), loadTransactions(),
// loadMaintenance(), loadUsers(), loadAuditLogs() — all defined in
// equipment.js / borrowing.js / maintenance.js / users.js / audit.js,
// which must already be loaded and parsed by the time this runs.
//
// NOTE: every restriction here (hiding buttons, disabling nav items) is
// a UI convenience only. The real enforcement is the RLS policies and
// triggers in sql/schema.sql — if a request slips through the UI, the
// database will still reject it. That satisfies "authorization enforced
// at both interface and database levels."
// =====================================================================

let currentUser = null;
let currentProfile = null; // { id, full_name, email, role }

// ---------------------------------------------------------------------
// SHARED HELPERS
// ---------------------------------------------------------------------
function statusPill(status) {
  return `<span class="status-pill status-${status}">${status}</span>`;
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// ---------------------------------------------------------------------
// AUTH GUARD + BOOTSTRAP (TC-A4-10)
// ---------------------------------------------------------------------
(async function init() {
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }
  currentUser = sessionData.session.user;

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error || !profile) {
    alert("Could not load your profile. Please log in again.");
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
    return;
  }
  currentProfile = profile;

  applyRoleVisibility();
  loadEquipment();
  loadMyRequests();

  document.getElementById("userName").textContent = currentProfile.full_name;
  document.getElementById("userEmail").textContent = currentProfile.email;
  document.getElementById("userRole").textContent = currentProfile.role;
})();

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") window.location.href = "index.html";
});

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// ---------------------------------------------------------------------
// ROLE-BASED NAVIGATION
// ---------------------------------------------------------------------
function applyRoleVisibility() {
  const role = currentProfile.role; // 'admin' | 'staff' | 'requester'

  document.querySelectorAll(".role-admin").forEach((el) => {
    el.style.display = role === "admin" ? "" : "none";
  });
  document.querySelectorAll(".role-staff").forEach((el) => {
    el.style.display = role === "admin" || role === "staff" ? "" : "none";
  });

  // "Add Equipment" button uses both classes; only show for staff/admin
  document.querySelectorAll("button.role-staff.role-admin").forEach((el) => {
    el.style.display = role === "admin" || role === "staff" ? "inline-block" : "none";
  });

  if (role === "admin") {
    loadApprovals();
    loadTransactions();
    loadMaintenance();
    loadUsers();
    loadAuditLogs();
  } else if (role === "staff") {
    loadTransactions();
    loadMaintenance();
  }
}

function switchView(viewName) {
  const allowedForRole = {
    admin: ["equipment", "my-requests", "transactions", "maintenance", "approvals", "users", "audit"],
    staff: ["equipment", "my-requests", "transactions", "maintenance"],
    requester: ["equipment", "my-requests"],
  };
  const allowed = allowedForRole[currentProfile.role] || [];
  if (!allowed.includes(viewName)) {
    alert("Access denied: your role does not have permission to view this page.");
    return;
  }

  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");
  document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add("active");

  // refresh data every time a view is opened
  const refreshMap = {
    equipment: loadEquipment,
    "my-requests": loadMyRequests,
    approvals: loadApprovals,
    transactions: loadTransactions,
    maintenance: loadMaintenance,
    users: loadUsers,
    audit: loadAuditLogs,
  };
  if (refreshMap[viewName]) refreshMap[viewName]();
}
