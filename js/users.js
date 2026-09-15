// =====================================================================
// dashboard.html — Manage Users view (admin only)
// Depends on: supabaseClient.js, app.js globals (currentUser, statusPill)
// =====================================================================

async function loadUsers() {
  const tbody = document.getElementById("usersTableBody");
  const { data, error } = await supabaseClient.from("profiles").select("*").order("full_name");

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (u) => `<tr>
        <td>${u.full_name}</td>
        <td>${u.email}</td>
        <td>${statusPill(u.role)}</td>
        <td>
          <select onchange="changeUserRole('${u.id}', this.value)" ${u.id === currentUser.id ? "disabled" : ""}>
            <option value="requester" ${u.role === "requester" ? "selected" : ""}>Requester</option>
            <option value="staff" ${u.role === "staff" ? "selected" : ""}>Laboratory Staff</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Administrator</option>
          </select>
        </td>
      </tr>`
    )
    .join("");
}

async function changeUserRole(userId, newRole) {
  const { error } = await supabaseClient.from("profiles").update({ role: newRole }).eq("id", userId);
  if (error) {
    alert("Action blocked: " + error.message);
    loadUsers();
    return;
  }
  loadUsers();
}
