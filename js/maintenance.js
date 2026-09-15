async function loadMaintenance() {
  const tbody = document.getElementById("maintenanceTableBody");
  const { data, error } = await supabaseClient.from("equipment").select("*").order("code");

  if (error) {
    tbody.innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
    return;
  }

  tbody.innerHTML = data
    .map((eq) => {
      let action = "";
      if (eq.status === "Available") {
        action = `<button class="warning-btn" onclick="setEquipmentStatus('${eq.id}','Maintenance')">Send to Maintenance</button>`;
      } else if (eq.status === "Maintenance" || eq.status === "Damaged") {
        action = `<button class="success-btn" onclick="setEquipmentStatus('${eq.id}','Available')">Mark Available</button>`;
      } else {
        action = `<span style="color:var(--muted);font-size:0.8rem;">Currently ${eq.status}</span>`;
      }
      return `<tr>
        <td>${eq.code}</td>
        <td>${eq.name}</td>
        <td>${statusPill(eq.status)}</td>
        <td>${action}</td>
      </tr>`;
    })
    .join("");
}

async function setEquipmentStatus(equipmentId, status) {
  const { error } = await supabaseClient.from("equipment").update({ status }).eq("id", equipmentId);
  if (error) {
    alert("Action blocked: " + error.message);
    return;
  }
  loadMaintenance();
  loadEquipment();
}
