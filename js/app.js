/**
 * Technical Assessment — Medicine Catalog
 *
 * Your task (see README.md for full instructions):
 * 1. Load medicines from ../data/medicines.json
 * 2. Display them in the UI (#medicine-list)
 * 3. Implement search across multiple fields (required)
 * 4. Optional: column / multi-field sorting
 *
 * You may restructure this file, split into modules, or change the HTML/CSS.
 * Do not change the shape of data/medicines.json unless you document why.
 */

const DATA_URL = "./data/medicines.json";

async function loadMedicines() {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to load medicines (${response.status})`);
  }
  return response.json();
}

function renderMedicines(medicines) {
  const listEl = document.getElementById("medicine-list");
  const countEl = document.getElementById("result-count");

  // TODO: replace this placeholder with your table / list UI
  countEl.textContent = `${medicines.length} medicine(s)`;
  listEl.innerHTML = `<p class="placeholder">${medicines.length} records loaded. Implement search & display here.</p>`;
}

async function init() {
  try {
    const medicines = await loadMedicines();
    // Keep a copy of the full dataset for filtering/sorting
    window.__medicines = medicines;
    renderMedicines(medicines);

    // TODO: wire up search input(s), filters, and sort handlers
  } catch (error) {
    console.error(error);
    document.getElementById("medicine-list").innerHTML =
      `<p class="placeholder">Error: ${error.message}. Start a local server (npm start) so fetch can load the JSON.</p>`;
  }
}

init();
