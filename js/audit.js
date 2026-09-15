// =====================================================================
// dashboard.html — Audit Logs view (admin only / BR-A4-10)
// Depends on: supabaseClient.js
// =====================================================================

async function loadAuditLogs() {
  const tbody = document.getElementById("auditTableBody");
  const { data, error } = await supabaseClient
    .from("audit_logs")
    .select("*, user:user_id(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6">No audit entries yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (log) => `<tr>
        <td>${new Date(log.created_at).toLocaleString()}</td>
        <td>${log.user ? log.user.full_name : "System"}</td>
        <td>${log.action}</td>
        <td>${log.module}</td>
        <td>${log.record_id || "-"}</td>
        <td>${log.description || "-"}</td>
      </tr>`
    )
    .join("");
}
