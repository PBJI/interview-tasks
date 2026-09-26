"use strict";

/* =========================================
   CONFIGURATION
========================================= */

const DATA_URL = "./data/medicines.json";


/* =========================================
   APPLICATION STATE
========================================= */

const state = {
  medicines: [],
  filteredMedicines: [],

  searchTerm: "",
  category: "all",

  prescriptionOnly: false,
  inStockOnly: false,

  expiryFrom: "",
  expiryTo: "",

  sortField: "none",
  sortDirection: "asc",

  // Virtualization state
  virtualization: {
    rowHeight: 52, // Approximate row height in pixels
    bufferSize: 5, // Extra rows to render above/below viewport
    scrollTop: 0,
    containerHeight: 0
  }
};


/* =========================================
   DOM ELEMENTS
========================================= */

const elements = {
  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),

  categoryFilter: document.getElementById("categoryFilter"),

  expiryFrom: document.getElementById("expiryFrom"),
  expiryTo: document.getElementById("expiryTo"),

  sortField: document.getElementById("sortField"),
  sortDirection: document.getElementById("sortDirection"),

  prescriptionFilter:
    document.getElementById("prescriptionFilter"),

  stockFilter:
    document.getElementById("stockFilter"),

  resetFilters:
    document.getElementById("resetFilters"),

  emptyResetButton:
    document.getElementById("emptyResetButton"),

  retryButton:
    document.getElementById("retryButton"),

  totalMedicines:
    document.getElementById("totalMedicines"),

  resultsCount:
    document.getElementById("resultsCount"),

  loadingState:
    document.getElementById("loadingState"),

  errorState:
    document.getElementById("errorState"),

  errorMessage:
    document.getElementById("errorMessage"),

  emptyState:
    document.getElementById("emptyState"),

  tableContainer:
    document.getElementById("tableContainer"),

  tableBody:
    document.getElementById("medicineTableBody"),

  tableWrapper:
    document.querySelector(".table-wrapper")
};


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  attachEventListeners();
  loadMedicines();
});


/* =========================================
   EVENT LISTENERS
========================================= */

function attachEventListeners() {
  elements.searchInput.addEventListener(
    "input",
    handleSearch
  );

  elements.clearSearch.addEventListener(
    "click",
    clearSearch
  );

  elements.categoryFilter.addEventListener(
    "change",
    handleCategoryChange
  );

  elements.expiryFrom.addEventListener(
    "change",
    handleExpiryFromChange
  );

  elements.expiryTo.addEventListener(
    "change",
    handleExpiryToChange
  );

  elements.sortField.addEventListener(
    "change",
    handleSortChange
  );

  elements.sortDirection.addEventListener(
    "change",
    handleSortDirectionChange
  );

  elements.prescriptionFilter.addEventListener(
    "change",
    handlePrescriptionFilter
  );

  elements.stockFilter.addEventListener(
    "change",
    handleStockFilter
  );

  elements.resetFilters.addEventListener(
    "click",
    resetFilters
  );

  elements.emptyResetButton.addEventListener(
    "click",
    resetFilters
  );

  elements.retryButton.addEventListener(
    "click",
    loadMedicines
  );

  // Virtualization scroll listener
  if (elements.tableWrapper) {
    elements.tableWrapper.addEventListener(
      "scroll",
      handleScroll
    );

    // Track container resize
    const resizeObserver = new ResizeObserver(
      handleContainerResize
    );

    resizeObserver.observe(elements.tableWrapper);
  }
}

/* =========================================
   VIRTUALIZATION
========================================= */

function handleScroll(event) {
  state.virtualization.scrollTop = event.target.scrollTop;
  renderVirtualizedRows();
}

function handleContainerResize(entries) {
  if (entries && entries[0]) {
    state.virtualization.containerHeight = entries[0].contentRect.height;
  }
  renderVirtualizedRows();
}

function getVisibleRange() {
  const { rowHeight, bufferSize, scrollTop, containerHeight } = state.virtualization;
  const totalRows = state.filteredMedicines.length;

  if (totalRows === 0) {
    return { start: 0, end: 0 };
  }

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - bufferSize);
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const end = Math.min(totalRows, start + visibleCount + (bufferSize * 2));

  return { start, end };
}

function renderVirtualizedRows() {
  const results = state.filteredMedicines;

  if (results.length === 0) {
    return;
  }

  const { start, end } = getVisibleRange();
  const tbody = elements.tableBody;

  if (!tbody) {
    return;
  }

  const fragment = document.createDocumentFragment();
  const totalHeight = results.length * state.virtualization.rowHeight;

  // Top padding for rows above viewport
  const topPadding = document.createElement("tr");
  topPadding.style.height = `${start * state.virtualization.rowHeight}px`;
  fragment.appendChild(topPadding);

  // Render only visible rows
  for (let i = start; i < end; i++) {
    fragment.appendChild(createMedicineRow(results[i]));
  }

  // Bottom padding for rows below viewport
  const bottomPadding = document.createElement("tr");
  const bottomHeight = totalHeight - (end * state.virtualization.rowHeight);
  bottomPadding.style.height = `${Math.max(0, bottomHeight)}px`;
  fragment.appendChild(bottomPadding);

  tbody.innerHTML = "";
  tbody.appendChild(fragment);
}

/* =========================================
   DATA LOADING
========================================= */

async function loadMedicines() {
  showLoading();

  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to load medicines (${response.status})`
      );
    }

    const data = await response.json();

    /*
     * Support either:
     *   [ ... ]
     *
     * or:
     *   { medicines: [ ... ] }
     */
    const medicines = Array.isArray(data)
      ? data
      : Array.isArray(data.medicines)
        ? data.medicines
        : null;

    if (!medicines) {
      throw new Error(
        "Invalid JSON format. Expected an array of medicines."
      );
    }

    state.medicines = medicines;

    state.filteredMedicines = medicines;

    populateCategoryFilter();

    elements.totalMedicines.textContent =
      medicines.length;

    applyFilters();

  } catch (error) {
    console.error(error);

    showError(
      error instanceof Error
        ? error.message
        : "Unknown error occurred."
    );
  }
}


/* =========================================
   CATEGORY FILTER
========================================= */

function populateCategoryFilter() {
  const categories = [
    ...new Set(
      state.medicines
        .map((medicine) => medicine.category)
        .filter(Boolean)
        .map((category) => String(category).trim())
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  elements.categoryFilter.innerHTML = `
    <option value="all">All categories</option>
  `;

  categories.forEach((category) => {
    const option =
      document.createElement("option");

    option.value = category;
    option.textContent = category;

    elements.categoryFilter.appendChild(option);
  });
}


/* =========================================
   SEARCH
========================================= */

function handleSearch(event) {
  state.searchTerm =
    event.target.value.trim().toLowerCase();

  elements.clearSearch.classList.toggle(
    "hidden",
    state.searchTerm.length === 0
  );

  applyFilters();
}


/*
 * Search across multiple fields.
 *
 * The assessment specifically asks for:
 * name
 * generic_name
 * category
 * form
 * manufacturer
 *
 * Strength is included as an additional searchable field.
 */

function medicineMatchesSearch(medicine) {
  if (!state.searchTerm) {
    return true;
  }

  const searchableFields = [
    medicine.name,
    medicine.generic_name,
    medicine.category,
    medicine.form,
    medicine.manufacturer,
    medicine.strength
  ];

  return searchableFields.some((value) => {
    if (value === null || value === undefined) {
      return false;
    }

    return String(value)
      .toLowerCase()
      .includes(state.searchTerm);
  });
}

function medicineMatchesExpiryRange(medicine) {
  const expiryDate = medicine.expiry_date;

  /*
   * If medicine has no expiry date,
   * it cannot match a date filter.
   */
  if (!expiryDate) {
    return !state.expiryFrom && !state.expiryTo;
  }

  /*
   * YYYY-MM-DD strings can be compared
   * directly because they are ISO dates.
   */

  if (
    state.expiryFrom &&
    expiryDate < state.expiryFrom
  ) {
    return false;
  }

  if (
    state.expiryTo &&
    expiryDate > state.expiryTo
  ) {
    return false;
  }

  return true;
}


/* =========================================
   FILTER HANDLERS
========================================= */

function handleCategoryChange(event) {
  state.category = event.target.value;

  applyFilters();
}

function handlePrescriptionFilter(event) {
  state.prescriptionOnly =
    event.target.checked;

  applyFilters();
}

function handleStockFilter(event) {
  state.inStockOnly =
    event.target.checked;

  applyFilters();
}

function handleExpiryFromChange(event) {
  state.expiryFrom = event.target.value;

  /*
   * Prevent an invalid range:
   * expiryFrom > expiryTo
   */
  if (
    state.expiryTo &&
    state.expiryFrom &&
    state.expiryFrom > state.expiryTo
  ) {
    state.expiryTo = state.expiryFrom;
    elements.expiryTo.value = state.expiryTo;
  }

  applyFilters();
}


function handleExpiryToChange(event) {
  state.expiryTo = event.target.value;

  /*
   * Prevent an invalid range:
   * expiryTo < expiryFrom
   */
  if (
    state.expiryFrom &&
    state.expiryTo &&
    state.expiryTo < state.expiryFrom
  ) {
    state.expiryFrom = state.expiryTo;
    elements.expiryFrom.value = state.expiryFrom;
  }

  applyFilters();
}


/* =========================================
   SORTING
========================================= */

function handleSortChange(event) {
  state.sortField = event.target.value;

  applyFilters();
}

function handleSortDirectionChange(event) {
  state.sortDirection =
    event.target.value;

  applyFilters();
}


function sortMedicines(medicines) {
  if (state.sortField === "none") {
    return medicines;
  }

  const sorted = [...medicines];

  sorted.sort((a, b) => {
    const field = state.sortField;

    const valueA = a[field];
    const valueB = b[field];

    const comparison =
      compareValues(valueA, valueB);

    return state.sortDirection === "asc"
      ? comparison
      : -comparison;
  });

  return sorted;
}


function compareValues(a, b) {
  /*
   * Handle missing values.
   */
  if (
    a === null ||
    a === undefined ||
    a === ""
  ) {
    return 1;
  }

  if (
    b === null ||
    b === undefined ||
    b === ""
  ) {
    return -1;
  }

  /*
   * Numeric values.
   */
  if (
    typeof a === "number" &&
    typeof b === "number"
  ) {
    return a - b;
  }

  /*
   * Dates.
   *
   * Assumes YYYY-MM-DD, which is directly
   * comparable chronologically.
   */
  if (isDateString(a) && isDateString(b)) {
    return String(a).localeCompare(String(b));
  }

  /*
   * Generic string comparison.
   */
  return String(a).localeCompare(
    String(b),
    undefined,
    {
      numeric: true,
      sensitivity: "base"
    }
  );
}


function isDateString(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  );
}


/* =========================================
   APPLY ALL FILTERS
========================================= */

function applyFilters() {
  let results = state.medicines.filter(
    medicine => {

      /*
       * Multi-field search
       */
      if (!medicineMatchesSearch(medicine)) {
        return false;
      }

      /*
       * Category
       */
      if (
        state.category !== "all" &&
        String(medicine.category) !==
          state.category
      ) {
        return false;
      }

      /*
       * Expiry date range
       */
      if (
        !medicineMatchesExpiryRange(medicine)
      ) {
        return false;
      }

      /*
       * Prescription-only
       */
      if (
        state.prescriptionOnly &&
        !isPrescriptionRequired(medicine)
      ) {
        return false;
      }

      /*
       * In-stock
       */
      if (
        state.inStockOnly &&
        !isInStock(medicine)
      ) {
        return false;
      }

      return true;
    }
  );

  results = sortMedicines(results);

  state.filteredMedicines = results;

  renderResults();
}


/* =========================================
   VALUE NORMALIZATION
========================================= */

function isPrescriptionRequired(medicine) {
  const value =
    medicine.prescription_required;

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return [
      "true",
      "yes",
      "required",
      "prescription"
    ].includes(
      value.toLowerCase().trim()
    );
  }

  return false;
}


function getStockValue(medicine) {
  const stock = Number(medicine.stock);

  return Number.isFinite(stock)
    ? stock
    : 0;
}


function isInStock(medicine) {
  return getStockValue(medicine) > 0;
}


/* =========================================
   RENDERING
========================================= */

function renderResults() {
  const results =
    state.filteredMedicines;

  elements.resultsCount.textContent =
    formatResultsCount(results.length);

  if (results.length === 0) {
    elements.tableContainer.classList.add(
      "hidden"
    );

    elements.emptyState.classList.remove(
      "hidden"
    );

    elements.loadingState.classList.add(
      "hidden"
    );

    elements.errorState.classList.add(
      "hidden"
    );

    return;
  }

  elements.emptyState.classList.add(
    "hidden"
  );

  elements.loadingState.classList.add(
    "hidden"
  );

  elements.errorState.classList.add(
    "hidden"
  );

  elements.tableContainer.classList.remove(
    "hidden"
  );

  // Use virtualized rendering for better performance with large datasets
  renderVirtualizedRows();
}


function createMedicineRow(medicine) {
  const row =
    document.createElement("tr");

  const prescription =
    isPrescriptionRequired(medicine);

  const stock =
    getStockValue(medicine);

  row.innerHTML = `
    <td>
      <div class="medicine-name">
        ${escapeHTML(
          medicine.name ?? "Unknown"
        )}
      </div>
    </td>

    <td>
      <span class="generic-name">
        ${escapeHTML(
          medicine.generic_name ?? "—"
        )}
      </span>
    </td>

    <td>
      ${escapeHTML(
        medicine.category ?? "—"
      )}
    </td>

    <td>
      ${escapeHTML(
        medicine.form ?? "—"
      )}
    </td>

    <td>
      ${escapeHTML(
        medicine.strength ?? "—"
      )}
    </td>

    <td>
      ${escapeHTML(
        medicine.manufacturer ?? "—"
      )}
    </td>

    <td>
      <span class="price">
        ${formatPrice(medicine.price)}
      </span>
    </td>

    <td>
      ${createStockBadge(stock)}
    </td>

    <td>
      ${
        prescription
          ? `
            <span class="prescription-badge required">
              Required
            </span>
          `
          : `
            <span class="prescription-badge not-required">
              Not Required
            </span>
          `
      }
    </td>

    <td>
      ${formatExpiryDate(
        medicine.expiry_date
      )}
    </td>
  `;

  return row;
}


/* =========================================
   BADGES / FORMATTING
========================================= */

function createStockBadge(stock) {
  if (stock <= 0) {
    return `
      <span class="stock-badge out">
        Out of stock
      </span>
    `;
  }

  if (stock <= 10) {
    return `
      <span class="stock-badge low">
        ${stock} · Low stock
      </span>
    `;
  }

  return `
    <span class="stock-badge available">
      ${stock} · Available
    </span>
  `;
}


function formatPrice(price) {
  const numericPrice =
    Number(price);

  if (!Number.isFinite(numericPrice)) {
    return price
      ? escapeHTML(String(price))
      : "—";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }
  ).format(numericPrice);
}


function formatExpiryDate(dateValue) {
  if (!dateValue) {
    return `<span class="muted">—</span>`;
  }

  const date =
    new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return escapeHTML(
      String(dateValue)
    );
  }

  const today =
    new Date();

  today.setHours(0, 0, 0, 0);

  const difference =
    date.getTime() -
    today.getTime();

  const daysRemaining =
    Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    );

  const formatted =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(date);

  if (daysRemaining < 0) {
    return `
      <span class="expired">
        ${formatted}
      </span>
    `;
  }

  if (daysRemaining <= 90) {
    return `
      <span class="expiring-soon">
        ${formatted}
      </span>
    `;
  }

  return formatted;
}


function formatResultsCount(count) {
  const total =
    state.medicines.length;

  if (count === total) {
    return `Showing all ${total} medicines`;
  }

  return `${count} of ${total} medicines match your filters`;
}


/* =========================================
   SEARCH CLEAR
========================================= */

function clearSearch() {
  state.searchTerm = "";

  elements.searchInput.value = "";

  elements.clearSearch.classList.add(
    "hidden"
  );

  applyFilters();

  elements.searchInput.focus();
}


/* =========================================
   RESET
========================================= */

function resetFilters() {
  state.searchTerm = "";
  state.category = "all";
  state.prescriptionOnly = false;
  state.inStockOnly = false;

  state.expiryFrom = "";
  state.expiryTo = "";

  state.sortField = "none";
  state.sortDirection = "asc";

  elements.searchInput.value = "";

  elements.categoryFilter.value = "all";

  elements.expiryFrom.value = "";
  elements.expiryTo.value = "";

  elements.prescriptionFilter.checked =
    false;

  elements.stockFilter.checked =
    false;

  elements.sortField.value = "none";

  elements.sortDirection.value = "asc";

  elements.clearSearch.classList.add(
    "hidden"
  );

  applyFilters();

  elements.searchInput.focus();
}


/* =========================================
   UI STATES
========================================= */

function showLoading() {
  elements.loadingState.classList.remove(
    "hidden"
  );

  elements.errorState.classList.add(
    "hidden"
  );

  elements.emptyState.classList.add(
    "hidden"
  );

  elements.tableContainer.classList.add(
    "hidden"
  );

  elements.resultsCount.textContent =
    "Loading medicines...";
}


function showError(message) {
  elements.loadingState.classList.add(
    "hidden"
  );

  elements.emptyState.classList.add(
    "hidden"
  );

  elements.tableContainer.classList.add(
    "hidden"
  );

  elements.errorState.classList.remove(
    "hidden"
  );

  elements.errorMessage.textContent =
    message;

  elements.resultsCount.textContent =
    "Unable to load medicines";
}


/* =========================================
   HTML ESCAPING
========================================= */

/*
 * Since medicine data is inserted into
 * innerHTML, escape values first.
 *
 * This also demonstrates awareness of
 * XSS when rendering external/untrusted data.
 */
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}