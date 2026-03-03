const detailEl = document.getElementById("detail");
const msgEl = document.getElementById("msg");
const card = document.getElementById("detailCard");

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function badgeClass(status) {
  if (status === "Active") return "badge active";
  if (status === "Claimed") return "badge claimed";
  return "badge resolved";
}

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadItem() {
  msgEl.textContent = "";
  msgEl.className = "";

  const res = await fetch(`/api/items/${id}`);
  const it = await res.json();

  if (!res.ok) {
    card.querySelector("h2").textContent = "Item not found";
    msgEl.textContent = it.message || "Error loading item.";
    msgEl.className = "error";
    return;
  }

  card.querySelector("h2").textContent = escapeHtml(it.title);

  detailEl.innerHTML = `
  <div class="kv"><b>Category</b><div>${escapeHtml(it.category)}</div></div>
  <div class="kv"><b>Description</b><div>${escapeHtml(it.description)}</div></div>
  <div class="kv"><b>Location</b><div>${escapeHtml(it.location)}</div></div>
  <div class="kv"><b>Date</b><div>${escapeHtml(it.date)}</div></div>
  <div class="kv"><b>Contact</b><div>${escapeHtml(it.contact)}</div></div>
  <div class="kv"><b>Status</b>
    <div><span class="${badgeClass(it.status)}"><span class="dot"></span>${escapeHtml(it.status)}</span></div>
  </div>

  <div class="hr"></div>

  <h2 style="margin:0 0 10px;">Update Status</h2>
  <div class="row">
    <div>
      <select id="status">
        <option value="Active" ${it.status==="Active"?"selected":""}>Active</option>
        <option value="Claimed" ${it.status==="Claimed"?"selected":""}>Claimed</option>
        <option value="Resolved" ${it.status==="Resolved"?"selected":""}>Resolved</option>
      </select>
    </div>
    <div>
      <button class="btn btn-primary" id="updateBtn">Update</button>
    </div>
  </div>

  <div class="hr"></div>

  <h2 style="margin:0 0 10px;">Delete Report</h2>
  <button class="btn btn-danger" id="deleteBtn">Delete</button>
`;

  document.getElementById("updateBtn").addEventListener("click", updateStatus);
  document.getElementById("deleteBtn").addEventListener("click", deleteItem);
}

async function updateStatus() {
  msgEl.textContent = "";
  msgEl.className = "";

  const status = document.getElementById("status").value;

  const res = await fetch(`/api/items/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  const data = await res.json();

  if (!res.ok) {
    msgEl.textContent = data.message || "Failed to update status.";
    msgEl.className = "error";
    return;
  }

  msgEl.textContent = "Status updated successfully!";
  msgEl.className = "success";
  await loadItem();
}

async function deleteItem() {
  if (!confirm("Are you sure you want to delete this report?")) return;

  const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (!res.ok) {
    msgEl.textContent = data.message || "Failed to delete item.";
    msgEl.className = "error";
    return;
  }

  alert("Deleted successfully!");
  window.location.href = "index.html";
}

if (!id) {
  card.querySelector("h2").textContent = "Missing item id";
} else {
  loadItem();
}