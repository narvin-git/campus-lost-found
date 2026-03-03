const listEl = document.getElementById("list");
const listTitle = document.getElementById("listTitle");
const listMsg = document.getElementById("listMsg");
const formMsg = document.getElementById("formMsg");
const statTotal = document.getElementById("statTotal");
const statLost = document.getElementById("statLost");
const statFound = document.getElementById("statFound");
const statActive = document.getElementById("statActive");
const searchEl = document.getElementById("search");

let allItems = [];
let searchText = "";

let currentFilter = "All";

function badgeClass(status) {
  if (status === "Active") return "badge active";
  if (status === "Claimed") return "badge claimed";
  return "badge resolved";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function updateStats(items) {
  statTotal.textContent = items.length;

  const lost = items.filter(i => i.category === "Lost").length;
  const found = items.filter(i => i.category === "Found").length;
  const active = items.filter(i => i.status === "Active").length;

  statLost.textContent = lost;
  statFound.textContent = found;
  statActive.textContent = active;
}

function applyClientFilter(items) {
  let filtered = items;

  if (currentFilter !== "All") {
    filtered = filtered.filter(i => i.category === currentFilter);
  }

  const q = searchText.toLowerCase();
  if (q) {
    filtered = filtered.filter(i =>
      (i.title || "").toLowerCase().includes(q) ||
      (i.location || "").toLowerCase().includes(q) ||
      (i.description || "").toLowerCase().includes(q)
    );
  }

  return filtered;
}

async function fetchItems() {
  listMsg.textContent = "";
  listMsg.className = "";

  const res = await fetch("/api/items");
  const items = await res.json();

  if (!Array.isArray(items)) {
    listMsg.textContent = items.message || "Failed to load items.";
    listMsg.className = "error";
    return;
  }

  allItems = items;
  updateStats(allItems);

  const shown = applyClientFilter(allItems);

  listEl.innerHTML = "";
  if (shown.length === 0) {
    listEl.innerHTML = `<div class="item"><p>No matching reports found.</p></div>`;
    return;
  }

  for (const it of shown) {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <h3>${escapeHtml(it.title)}</h3>
        <p>${escapeHtml(it.location)} • <small>${escapeHtml(it.date)}</small></p>
        <small>${escapeHtml(it.category)} • 
          <span class="${badgeClass(it.status)}"><span class="dot"></span>${escapeHtml(it.status)}</span>
        </small>
      </div>
      <div style="display:flex; align-items:center;">
        <a class="btn btn-ghost" href="item.html?id=${it.id}">View</a>
      </div>
    `;
    listEl.appendChild(div);
  }
}

function setFilter(filter) {
  currentFilter = filter;
  updateFilterButtons();
  listTitle.textContent = filter === "All" ? "All Reports" : `${filter} Reports`;
  fetchItems();
}

searchEl.addEventListener("input", () => {
  searchText = searchEl.value.trim();
  fetchItems();
});

document.getElementById("filterAll").addEventListener("click", () => setFilter("All"));
document.getElementById("filterLost").addEventListener("click", () => setFilter("Lost"));
document.getElementById("filterFound").addEventListener("click", () => setFilter("Found"));

document.getElementById("itemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";
  formMsg.className = "";

  const payload = {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    category: document.getElementById("category").value,
    location: document.getElementById("location").value.trim(),
    date: document.getElementById("date").value,
    contact: document.getElementById("contact").value.trim()
  };

  // Basic JS validation (server-side validation still exists)
  if (payload.title.length < 3) {
    formMsg.textContent = "Title must be at least 3 characters.";
    formMsg.className = "error";
    return;
  }
  if (!payload.date) {
    formMsg.textContent = "Please select a date.";
    formMsg.className = "error";
    return;
  }

  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    formMsg.textContent = data.message || "Failed to create item.";
    formMsg.className = "error";
    return;
  }

  formMsg.textContent = "Report submitted successfully!";
  formMsg.className = "success";
  e.target.reset();
  await fetchItems();
});

function updateFilterButtons() {
  document.getElementById("filterAll").classList.toggle("active", currentFilter === "All");
  document.getElementById("filterLost").classList.toggle("active", currentFilter === "Lost");
  document.getElementById("filterFound").classList.toggle("active", currentFilter === "Found");
}

fetchItems();