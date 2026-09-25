# JavaScript Technical Assessment — Medicine Catalog Search

Build a **searchable** medicine catalog UI (with **optional sorting**) using the provided dataset and starter files.

---

## Time & delivery


| Item                 | Detail                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| **Duration**         | Complete within the time window shared by the interviewer                                                 |
| **Delivery**         | Push your work to a **git branch** and share the **repository URL** (and branch name) before the deadline |



---

## Getting started

1. **Clone** the assessment repository (link provided by the interviewer).
2. Create and check out **your own branch** (do not push directly to `main` / `master`):
  ```bash
   git checkout -b assessment/<your-name>
  ```
3. Open the project folder:
  ```bash
   cd technical_assessment
  ```
4. Start a local static server (Node.js 18+ recommended):
  ```bash
   npm start
  ```
   Then open the URL shown in the terminal (typically `http://localhost:3000`).
   Alternative:
   Opening `index.html` via `file://` will **not** load the JSON via `fetch`. Always use a local server.
5. Implement your solution in the existing files (you may add/rename modules as needed).
6. **Commit** regularly with clear messages, **push** your branch, and send the **repo link + branch name** when done.

---



## The task

You are given medicine records in `data/medicines.json` (50+ rows). Each record includes fields such as:

- `id`, `name`, `generic_name` `category`, `form`, `strength` `manufacturer`, `price`, `stock` `prescription_required`, `expiry_date`



### Required

1. **Load** the JSON and **display** the medicines in a clear UI (table or list).
2. Implement **search / filter across multiple fields** (not only the medicine name). At minimum, users should be able to find medicines using several of: name, generic name, category, form, manufacturer (and optionally others).
3. Keep the UI usable: show how many results match, and handle empty results gracefully.



### Bonus (if time permits)

- **Sorting** by one or more columns/fields (e.g. name, price, stock, category), including ascending / descending.
- Extra filters (e.g. category dropdown, prescription-only toggle, in-stock only).
- Debounced search, keyboard-friendly controls, or responsive layout.



### Out of scope

- Backend / database / authentication
- Changing the JSON schema without documenting why
- Pixel-perfect design systems (clean and readable is enough)

---



## Project structure

```
technical_assessment/
├── README.md                 ← you are here
├── package.json              ← npm start / npm run dev
├── index.html                ← starter page
├── css/
│   └── styles.css            ← starter styles (edit freely)
├── js/
│   └── app.js                ← starter script (implement here)
└── data/
    └── medicines.json        ← medicine dataset (do not invent a new file for data)
```

You may add CSS/JS files, but keep `data/medicines.json` as the source of truth for medicines.

---






## Submission checklist

- [ ] Branch created and pushed (e.g. `assessment/<your-name>`)
- [ ] App runs with `npm start` (or documented alternative)
- [ ] Multi-field search works against `data/medicines.json`
- [ ] (Optional) Sorting / extra filters
- [ ] Repo URL + branch name sent to the interviewer within the time frame

**Submit:** the Git repository link and the branch name containing your solution.

Good luck.