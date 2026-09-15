async function loadEquipment() {
  const tbody = document.getElementById("equipmentTableBody");
  const { data, error } = await supabaseClient
    .from("equipment")
    .select("*")
    .order("code");

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((eq) => {
      const canRequest = eq.status === "Available"; 
      return `<tr>
        <td>${eq.code}</td>
        <td>${eq.name}</td>
        <td>${eq.category || "-"}</td>
        <td>${statusPill(eq.status)}</td>
        <td>
          ${
            canRequest
              ? `<button class="secondary" onclick="openRequestModal('${eq.id}','${eq.name.replace(/'/g, "\\'")}')">Request</button>`
              : `<span style="color:var(--muted);font-size:0.8rem;">Not available</span>`
          }
        </td>
      </tr>`;
    })
    .join("");
}

// ---------------------------------------------------------------------
// ADD EQUIPMENT (staff + admin)
// ---------------------------------------------------------------------
function openAddEquipmentModal() {
  document.getElementById("addEquipmentForm").reset();
  document.getElementById("addEquipmentModal").classList.add("active");
}

document.getElementById("addEquipmentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = document.getElementById("eqCode").value.trim();
  const name = document.getElementById("eqName").value.trim();
  const category = document.getElementById("eqCategory").value.trim();

  const { error } = await supabaseClient.from("equipment").insert({ code, name, category });
  const msgEl = document.getElementById("addEquipmentMsg");
  if (error) {
    msgEl.textContent = error.message;
    msgEl.className = "msg error";
    return;
  }
  closeModal("addEquipmentModal");
  loadEquipment();
});

// ---------------------------------------------------------------------
// SUBMIT BORROWING REQUEST (requester + staff / TC-A4-02)
// ---------------------------------------------------------------------
function openRequestModal(equipmentId, equipmentName) {
  document.getElementById("requestEquipmentId").value = equipmentId;
  document.getElementById("requestEquipmentName").value = equipmentName;
  document.getElementById("requestPurpose").value = "";
  document.getElementById("requestMsg").className = "msg";
  document.getElementById("requestModal").classList.add("active");
}

document.getElementById("requestForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const equipment_id = document.getElementById("requestEquipmentId").value;
  const purpose = document.getElementById("requestPurpose").value.trim();

  const { error } = await supabaseClient.from("borrow_requests").insert({
    equipment_id,
    requester_id: currentUser.id,
    purpose,
    status: "Pending",
  });

  const msgEl = document.getElementById("requestMsg");
  if (error) {
    msgEl.textContent = error.message; // e.g. BR-A4-01 violation surfaces here
    msgEl.className = "msg error";
    return;
  }
  closeModal("requestModal");
  loadEquipment();
  loadMyRequests();
});
