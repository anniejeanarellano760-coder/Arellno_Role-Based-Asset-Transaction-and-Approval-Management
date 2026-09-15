async function loadMyRequests() {
  const tbody = document.getElementById("myRequestsTableBody");
  const { data, error } = await supabaseClient
    .from("borrow_requests")
    .select("*, equipment:equipment_id(code,name)")
    .eq("requester_id", currentUser.id)
    .order("requested_at", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">No requests yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map(
      (r) => `<tr>
        <td>${r.equipment ? r.equipment.code + " - " + r.equipment.name : "-"}</td>
        <td>${r.purpose || "-"}</td>
        <td>${statusPill(r.status)}</td>
        <td>${new Date(r.requested_at).toLocaleString()}</td>
        <td>${r.notes || (r.damaged ? "Returned damaged" : "-")}</td>
      </tr>`
    )
    .join("");
}

// ---------------------------------------------------------------------
// APPROVALS (admin only / BR-A4-02, BR-A4-03 / TC-A4-03, TC-A4-04)
// ---------------------------------------------------------------------
async function loadApprovals() {
  const tbody = document.getElementById("approvalsTableBody");
  const { data, error } = await supabaseClient
    .from("borrow_requests")
    .select("*, equipment:equipment_id(code,name), requester:requester_id(full_name,email)")
    .eq("status", "Pending")
    .order("requested_at");

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    return;
  }

  const countEl = document.getElementById("pendingCount");
  if (data.length) {
    countEl.textContent = data.length;
    countEl.style.display = "inline-block";
  } else {
    countEl.style.display = "none";
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">No pending requests.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((r) => {
      const isOwn = r.requester_id === currentUser.id; // BR-A4-02
      return `<tr>
        <td>${r.requester ? r.requester.full_name : "-"}</td>
        <td>${r.equipment ? r.equipment.code + " - " + r.equipment.name : "-"}</td>
        <td>${r.purpose || "-"}</td>
        <td>${new Date(r.requested_at).toLocaleString()}</td>
        <td>
          ${
            isOwn
              ? `<span style="color:var(--muted);font-size:0.8rem;">Cannot approve own request</span>`
              : `<button class="success-btn" onclick="decideRequest('${r.id}','Approved')">Approve</button>
                 <button class="danger" onclick="decideRequest('${r.id}','Rejected')">Reject</button>`
          }
        </td>
      </tr>`;
    })
    .join("");
}

async function decideRequest(requestId, decision) {
  const { error } = await supabaseClient
    .from("borrow_requests")
    .update({ status: decision })
    .eq("id", requestId);

  if (error) {
    alert("Action blocked: " + error.message);
    return;
  }
  loadApprovals();
  loadTransactions();
  if (typeof loadAuditLogs === "function") loadAuditLogs();
}

// ---------------------------------------------------------------------
// PROCESS TRANSACTIONS: release + return (staff+admin / BR-A4-04..08)
// ---------------------------------------------------------------------
async function loadTransactions() {
  const tbody = document.getElementById("transactionsTableBody");
  const { data, error } = await supabaseClient
    .from("borrow_requests")
    .select("*, equipment:equipment_id(code,name), requester:requester_id(full_name)")
    .in("status", ["Approved", "Released"])
    .order("requested_at");

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    return;
  }
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">Nothing to process right now.</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((r) => {
      let actionCell = "";
      if (r.status === "Approved") {
        actionCell = `<button class="secondary" onclick="releaseRequest('${r.id}')">Release</button>`;
      } else if (r.status === "Released") {
        actionCell = `<button class="secondary" onclick="openReturnModal('${r.id}')">Return</button>`;
      }
      const dateShown = r.status === "Released" ? r.released_at : r.approved_at;
      return `<tr>
        <td>${r.requester ? r.requester.full_name : "-"}</td>
        <td>${r.equipment ? r.equipment.code + " - " + r.equipment.name : "-"}</td>
        <td>${statusPill(r.status)}</td>
        <td>${dateShown ? new Date(dateShown).toLocaleString() : "-"}</td>
        <td>${actionCell}</td>
      </tr>`;
    })
    .join("");
}

async function releaseRequest(requestId) {
  const { error } = await supabaseClient
    .from("borrow_requests")
    .update({ status: "Released" })
    .eq("id", requestId);

  if (error) {
    alert("Action blocked: " + error.message); // e.g. BR-A4-07 rejected-request guard
    return;
  }
  loadTransactions();
  loadEquipment();
  if (typeof loadAuditLogs === "function") loadAuditLogs();
}

function openReturnModal(requestId) {
  document.getElementById("returnRequestId").value = requestId;
  document.getElementById("returnDamaged").checked = false;
  document.getElementById("returnMsg").className = "msg";
  document.getElementById("returnModal").classList.add("active");
}

document.getElementById("returnForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const requestId = document.getElementById("returnRequestId").value;
  const damaged = document.getElementById("returnDamaged").checked;

  const { error } = await supabaseClient
    .from("borrow_requests")
    .update({ status: "Returned", damaged })
    .eq("id", requestId);

  const msgEl = document.getElementById("returnMsg");
  if (error) {
    msgEl.textContent = error.message; // e.g. BR-A4-08 double-return guard
    msgEl.className = "msg error";
    return;
  }
  closeModal("returnModal");
  loadTransactions();
  loadEquipment();
  loadMyRequests();
  if (typeof loadAuditLogs === "function") loadAuditLogs();
});
