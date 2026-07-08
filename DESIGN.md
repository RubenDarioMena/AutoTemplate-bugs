# Bugs Template Tool — Design Document

Status: DRAFT v0.1
Author: Hermes Agent (in collaboration with Rubén)
Last update: 2026-07-01

---

## 1. Purpose

Internal tool to help QA testers write structured bug reports and
regression notes by:

1. Filling a form with fields (some free-text, some dropdowns
   with autocomplete).
2. Validating inputs against business rules in real time.
3. Generating a formatted bug/regression text block ready to copy
   into the ticket system.
4. Letting the QA database team maintain the source-of-truth lists
   (maps, POIs, modes, regions, platforms, bug types, regression
   statuses, validation rules) via a familiar Excel file.

The tool runs entirely in the browser, reads/writes files from the
local share folder, and requires NO installation, NO server, NO
network calls, NO third-party runtime libraries.

---

## 2. Distribution & Security Model

### Distribution

A single shared network folder contains:

  /Bugs-template/
    bug_tool.html              # the monolith (self-contained)
    bug_data.csv               # source of truth for lists & rules
    bug_session.json           # optional, auto-saved session state
    README.md                  # short usage instructions

Testers and DB editors open `bug_tool.html` by double-click.
The HTML loads `bug_data.csv` from the same folder (via a manual
"Load" button pointing to the share path, or via the standard file
picker — see § 6 for the loading flow).

### Security posture (deliberately exaggerated)

  * No network calls. The HTML never fetches anything from a URL.
  * No CDN, no Google Fonts, no remote scripts. Everything is inline.
  * No eval / no dynamic code injection.
  * No third-party libraries. The CSV parser, the validator, and
    the keyword overlap checker are all written in plain JS in
    <script> tags inside the HTML.
  * No persistent storage outside what the user explicitly saves
    to disk (download as file).
  * No telemetry, no analytics, no error reporting to a server.
  * The only file the HTML reads automatically is `bug_data.csv`
    in the same folder as itself (resolved via a relative file://
    fetch when allowed by the browser; otherwise via a file picker
    that defaults to the last-used path).
  * The HTML never writes anywhere unless the user clicks an
    explicit "Save" or "Download" button.

### Why this is acceptable to the team

  * Nothing is installed.
  * Nothing runs outside the browser.
  * All source is human-readable (one .html, one .csv, one .json).
  * DB edits happen in Excel — the tool they already use.

---

## 3. File Layout

### 3.1 `bug_data.csv` (source of truth, edited in Excel)

A single flat CSV with three columns: `category`, `key`, `value`.

| category | key        | value                          |
|----------|------------|--------------------------------|
| list     | regions    | NA                             |
| list     | regions    | EU                             |
| list     | regions    | APAC                           |
| list     | regions    | LATAM                          |
| list     | platforms  | PC(MSS)                        |
| list     | platforms  | PC(Bnet)                       |
| list     | platforms  | PS5                            |
| list     | platforms  | Xbox Series X                  |
| list     | modes      | MP                             |
| list     | modes      | BR                             |
| list     | modes      | WZ                             |
| list     | modes      | Ranked                         |
| list     | bugTypes   | Visual                         |
| list     | bugTypes   | Logic                          |
| list     | bugTypes   | Audio                          |
| list     | bugTypes   | Crash                          |
| list     | bugTypes   | Performance                    |
| list     | bugTypes   | Network                        |
| list     | bugTypes   | HUD                            |
| list     | bugTypes   | Animation                      |
| list     | regressionStatuses | Verificado Corregido   |
| list     | regressionStatuses | Regresado               |
| list     | regressionStatuses | No Reproducible         |
| map      | -          | Highrise                       |
| map      | -          | Terminal                       |
| map      | -          | Scrapyard                      |
| poi      | Highrise   | Office A                       |
| poi      | Highrise   | Office B                       |
| poi      | Highrise   | Helipad                        |
| poi      | Terminal   | Check-in                       |
| poi      | Terminal   | Gate 7                         |
| tier     | T1         | Gameplay                       |
| tier     | T2         | Multiplayer                    |
| tier     | T3         | Campaign                       |
| rule     | kw_count   | 5                              |
| rule     | coord_fmt  | (X, Y, Z) (X, Y, Z)            |
| rule     | coord_re   | ^\(\d+,\s*\d+,\s*\d+\)\s*\(\d+,\s*\d+,\s*\d+\)$ |

Editing workflow for DB team:
  1. Open `bug_data.csv` in Excel.
  2. Add/remove/edit rows.
  3. "Save As" → keep the same filename, keep CSV format.
  4. Multiple editors can have the file open simultaneously; whoever
     saves last wins for the conflicting rows (acceptable trade-off,
     explicit and visible).

### 3.2 `bug_tool.html`

The monolith. Contains inline CSS, inline JS, and the full UI.
Self-contained: opening it on a machine with no internet works.

### 3.3 `bug_session.json` (optional, auto-managed by the tool)

Stores the in-progress state of every open bug/regression tab so
the tester can close the browser and resume. Created/updated only
when the tester clicks "Save session".

---

## 4. UI Architecture

### 4.1 Window layout (Notepad++ inspired)

```
+--------------------------------------------------------------+
| [Bug] [Regression] [Data]            <-- top tabs (fixed)    |
+--------------------------------------------------------------+
| [Bug 1 ×] [Bug 2 ×] [+]            <-- instance tabs (left)  |
+----------------------------------+---------------------------+
|                                  |                           |
|   Form panel (scrollable)        |   Output panel            |
|   - dropdowns / text inputs      |   - generated textarea     |
|   - validation messages          |   - copy buttons          |
|                                  |                           |
+----------------------------------+---------------------------+
```

  * Top tabs: 3 fixed tabs (Bug, Regression, Data). Switching
    changes the right panel and re-uses the same instance tab bar.
  * Instance tabs: one per open bug/regression. Each tab has an
    ×  to close (with confirm if dirty). The trailing [+] creates
    a new empty instance, numbered sequentially.
  * Default state: 3 instance tabs (Bug 1, Bug 2, Bug 3) on the
    Bug top-tab. Switching to Regression shows the same set, but
    each instance remembers its top-tab kind separately.

### 4.2 Form panel — shared widgets

Each field is one of:

  * TextInput        — free text, single line
  * TextArea         — free text, multi line
  * Dropdown         — fixed list, click to open
  * Autocomplete     — text input + filtered dropdown, opens while
                       typing, keyboard arrow nav
  * Coordinates      — special widget: two `(X, Y, Z)` groups,
                       validated against the `coord_re` rule
  * Keywords         — chip input, exactly N chips, no duplicates,
                       none of them may appear in the rest of the
                       bug body

Field appearance on validation failure:
  * 1.5px red border around the field
  * 4px red outer glow (box-shadow)
  * On focus / hover, a small red tooltip appears next to the field
    with the error message ("Keywords must be exactly 5", "Coordinate
    format: (X, Y, Z) (X, Y, Z) with integers", etc.)
  * Glow clears as soon as the field becomes valid

### 4.3 Output panel

  * A non-editable preview at the top (rendered HTML, in monospace
    inside a <pre>), updated live as the form changes.
  * An editable textarea below (always available for last-mile
    tweaks by the tester before copy).
  * Action buttons row:
      [ Copy summary ]
      [ Copy description ]
      [ Copy full report ]
      [ Copy viewpos ]
      [ Copy media name ]
      [ Download .md ]
      [ Download .txt ]
      [ Clear instance ]

Each "Copy X" button only copies the relevant chunk (see § 5.2 for
the chunks).

### 4.4 The "Data" tab (DB editor)

Two-pane editor:
  * Left: category list (regions, platforms, modes, bugTypes, maps,
    pois, tiers, regressionStatuses, rules).
  * Right: a table of rows for the selected category.
  * Toolbar: [+ Add row] [Delete selected] [Revert] [Save & export
    `bug_data.csv`].
  * Edits stay in memory until the tester clicks "Save & export".
    On save, the HTML prompts a download of `bug_data.csv` — the
    user manually drops it in the share folder, replacing the old
    one. This keeps the network write explicit and visible.

The Data tab does NOT require the share-folder write permission;
the user always controls the save.

---

## 5. Bug Report — Data Model

### 5.1 Form fields (Bug tab)

Header (Summary line, in this exact order):

  [team] - [region] - [version] - platform(client) - [mode] -
  [map] - [poi] - [bugType] - [shortDescription] - Cuando
  [narrativeCondition] ([coords])

Field list:

  | field              | widget         | source / validation                       |
  |--------------------|----------------|-------------------------------------------|
  | team               | TextInput      | free text                                 |
  | region             | Dropdown       | regions list                              |
  | version            | TextInput      | free text                                 |
  | platform           | Dropdown       | platforms list                            |
  | client             | TextInput      | free text (e.g. "MSS", "Bnet")            |
  | mode               | Dropdown       | modes list                                |
  | map                | Autocomplete   | maps list                                 |
  | poi                | Autocomplete   | filtered by selected map (pois)           |
  | bugType            | Dropdown       | bugTypes list                             |
  | shortDescription   | TextInput      | free text, short                          |
  | narrativeCondition | TextArea       | free text, 1-3 sentences                  |
  | coords             | Coordinates    | regex from rules: ^\(\d+,\s*\d+,\s*\d+\) |
  |                    |                |  \(\d+,\s*\d+,\s*\d+\)$                   |
  | description        | TextArea       | free text, the long paragraph             |
  | variables          | TextArea       | one per line                              |
  | buildInfo          | Group          | see § 5.3                                 |
  | reproSteps         | TextArea       | numbered list, one per line               |
  | results            | TextArea       | "Expected / Actual" paragraphs            |
  | notes              | Group          | see § 5.4                                 |
  | keywords           | Keywords       | exactly `kw_count` chips, no overlap with |
  |                    |                | summary/description/notes text            |

### 5.2 Output chunks (for selective copy)

  * `summary`     — the single-line header
  * `description` — narrativeCondition paragraph (the part that goes
                    inside the body, before "Pasos para Reproducir")
  * `viewpos`     — the coordinates chunk, formatted: `Posición de
                    vista: (X, Y, Z) (X, Y, Z)`
  * `mediaName`   — derived from map + poi + bugType slug
                    (e.g. `Highrise_OfficeA_Visual`), shown in notes
  * `full`        — the entire report (header + body), ready to paste

### 5.3 Build info group

  | sub-field         | widget       | source / validation       |
  |-------------------|--------------|---------------------------|
  | cod               | TextInput    | numeric                   |
  | cl                | TextInput    | numeric (the "normal" CL) |
  | bspCl             | TextInput    | numeric OR "N/A" (the BSP |
  |                   |              | change list — different   |
  |                   |              | from cl, must not be the  |
  |                   |              | same value)               |
  | package           | TextInput    | free text                 |
  | ccs               | TextInput    | free text                 |
  | bsp               | TextInput    | "N/A" allowed             |
  | buildUrl          | TextInput    | starts with `getbuild://` |

Notes:
  * `cl` and `bspCl` are two distinct change lists. The tool must
    reject the case where they hold the same numeric value, with
    the message "BSP CL must differ from CL".
  * `bspCl` defaults to "N/A" when not applicable (same convention
    as `bsp`).
  * These populate the "+Información de Compilación+" block.

### 5.4 Notes group

  | sub-field         | widget       | source / validation       |
  |-------------------|--------------|---------------------------|
  | reproduction      | TextInput    | "X/Y" pattern, e.g. 5/5   |
  | profile           | TextInput    | free text                 |
  | timestamp         | TextInput    | HH:MM:SS                  |
  | tz                | TextInput    | default "CST"             |
  | onlineOrLan       | Dropdown     | Online / LAN              |
  | executable        | TextInput    | free text                 |
  | viewpos           | Coordinates  | same as summary coords    |
  | material          | TextInput    | free text                 |
  | model             | TextInput    | free text                 |
  | ccs               | TextInput    | free text (can duplicate |
  |                   |              | buildInfo.ccs)             |
  | bsp               | TextInput    | free text                 |
  | buildUrl          | TextInput    | starts with `getbuild://` |

These populate the "+Notas+" block.

### 5.5 Validation rules (initial set)

  * summary: all header fields non-empty (except narrativeCondition
    may be 1-char "Cuando" with full body)
  * coords: matches the regex from `rule.coord_re` (default
    `^\(\d+,\s*\d+,\s*\d+\)\s*\(\d+,\s*\d+,\s*\d+\)$`)
  * keywords.count: from `rule.kw_count` (default 5)
  * keywords.uniqueness: each chip unique
  * keywords.noOverlap: no chip may appear as a substring inside
    the concatenation of summary + description + notes text.
    The comparison is **case-insensitive** (Jira search is
    case-insensitive, so the tool follows the same convention to
    prevent search-noise collisions).
  * buildInfo.cl: numeric
  * buildInfo.bspCl: numeric OR "N/A"
  * buildInfo.cl != buildInfo.bspCl: enforced when bspCl is
    numeric. Error: "BSP CL must differ from CL".
  * buildUrl: starts with `getbuild://`
  * executable: non-empty
  * All other fields: non-empty (per-field), with the exception of
    `bsp` (N/A allowed)

---

## 6. Regression Tab — Data Model

Mirrors the example given by the user.

### 6.1 Form fields

  | field              | widget         | source / validation        |
  |--------------------|----------------|----------------------------|
  | platform           | Dropdown       | platforms list             |
  | client             | TextInput      | e.g. "Bnet"                |
  | regressionStatus   | Dropdown       | regressionStatuses list    |
  | cl                 | TextInput      | numeric                    |
  | verifiedBy         | TextInput      | free text                  |
  | location           | TextInput      | free text                  |
  | description        | TextInput      | free text (the line about  |
  |                    |                | the voice, etc.)           |
  | reproductionRate   | TextInput      | "X/Y" pattern              |
  | regressedIn        | TextInput      | free text (e.g. test.exe)  |
  | profile            | TextInput      | free text                  |
  | timestamp          | TextInput      | HH:MM:SS                   |
  | tz                 | TextInput      | default "CST"              |
  | cod                | TextInput      | numeric                    |
  | ccsFfotd           | TextInput      | free text                  |
  | bsp                | TextInput      | "N/A" allowed              |
  | buildUrl           | TextInput      | starts with `getbuild://`  |

### 6.2 Output chunks

  * `regression.full` — the entire regression note, ready to paste
  * No selective chunks needed for regressions (the whole thing is
    one block)

### 6.3 Validation rules

  * All fields non-empty (except `bsp` which accepts N/A)
  * reproductionRate matches `\d+/\d+`
  * buildUrl starts with `getbuild://`

---

## 7. Data Tab — Editor

### 7.1 Categories

  * `list` — flat lists (regions, platforms, modes, bugTypes,
    regressionStatuses)
  * `map` — list of map names
  * `poi` — pairs (map, poi). When a map is removed, all its POIs
    are flagged in red and the user must delete them explicitly
  * `tier` — pairs (tier_id, tier_name)
  * `rule` — single key/value entries (kw_count, coord_fmt, coord_re)

### 7.2 Edit operations

  * Add row → appends with sensible defaults
  * Edit cell → live, in-place
  * Delete row → removes from in-memory copy
  * Revert → reloads from disk
  * Save & export → triggers download of `bug_data.csv` (same
    column schema, original header order preserved)

### 7.3 Safety

  * Before "Save & export", the tool shows a diff summary:
    "You are about to change 12 rows (+3, -2, ~7). Continue?"
  * The download is a normal browser download — user chooses where
    to save (typically overwrites the share-folder copy).

---

## 8. CSV Loading Flow

Two-step process, fully manual, no surprise network reads:

  1.  On startup, the HTML tries a relative fetch of
      `bug_data.csv` next to itself. If the browser blocks it
      (some browsers block `file://` fetches), the user is shown a
      yellow banner: "Click here to load the latest data from
      <path>."
  2.  Clicking the banner opens the native file picker, pre-pointed
      to the share folder (path remembered from last session via
      `bug_session.json`). Once selected, the CSV is parsed in
      pure JS and the dropdowns populate.

The "Load latest" button is always available, so re-loading is
one click.

### 8.1 CSV parser (in plain JS)

  * Supports quoted fields with embedded commas.
  * Supports `""` as an escaped quote.
  * Ignores empty lines and lines starting with `#`.
  * Trims whitespace around fields.
  * Validates the header row; if it doesn't match
    `category,key,value`, shows an error in the banner.

### 8.2 Grouping logic

  * Rows with the same `category` are grouped into a list under
    their `key` (e.g. all `category=list, key=regions` rows form
    the regions dropdown).
  * Rows with `category=poi` form a `Map<String, List<String>>`
    indexed by `key` (the map name).
  * Rows with `category=rule` form a flat `Map<String, String>`.

---

## 9. Session Management

The tool is designed for long-running test sessions (a tester may
work on the same shift on several bugs across multiple builds,
consoles, or shifts). State must survive a browser close, a tab
close, or even a machine restart, so the user can resume from
exactly where they left off.

### 9.1 What is persisted

  * The full set of open instances (kind: bug or regression) and
    their order
  * For each instance:
      * All form field values
      * The free-form output textarea contents
      * The validation error map (recomputed on load, not stored)
      * The "dirty" flag (whether the user has unsaved local
        changes vs. the last manual save)
  * The Data tab edits (in-memory copy of the loaded CSV), if any
  * The "don't ask again" preference for the close-confirm dialog
  * The last-used path for the CSV file picker (so re-loads land
    in the same share folder)

### 9.2 Storage backend: localStorage

  * **All progress is auto-saved to `localStorage` on every form
    change** (debounced ~300ms). This is the "user can keep going
    from where they left off" guarantee.
  * Storage key: `bug_tool_state_v1`. Versioned to allow future
    migrations without losing data.
  * `localStorage` is local to the browser profile that opened
    the file. Two different testers on the same machine using
    different browser profiles will have independent state. This
    is acceptable: testers are not sharing in-progress drafts
    with each other.
  * There is NO silent network write. `localStorage` is a
    browser-internal sandbox and never leaves the machine. The
    "exaggerated security" posture is preserved: no data is
    exfiltrated.
  * A small visual indicator in the top-right corner shows the
    auto-save state: "Saved" (green dot) | "Saving..." (yellow
    dot) | "Unsaved" (red dot). This makes the persistence
    behavior visible to the user — no surprises.

### 9.3 Explicit save/load (in addition to auto-save)

  * **Save session as file** — serializes the full state to
    `bug_session.json` and triggers a download. Used to back up
    state, or to move state between machines.
  * **Load session from file** — reads a `bug_session.json` via
    the file picker and replaces the current state. Shows a
    confirm dialog if the current state is dirty.
  * **Clear local state** — wipes `localStorage` and resets the
    tool to the default 3 instance tabs. Requires a typed
    confirmation ("type CLEAR to confirm") to prevent accidents.

### 9.4 Confirm-on-close

  When the user clicks the × on an instance tab:
  * If the instance is clean (no unsaved changes relative to the
    last manual save), close immediately.
  * If the instance is dirty, show a confirm dialog:
      "Discard changes to [Bug 2]?"
        [ Cancel ]  [ Discard ]
  * If the user previously checked "Don't ask again" (checkbox
    in the dialog), skip the confirm and close immediately. The
    preference is stored in `localStorage` under
    `bug_tool_prefs.dontAskOnClose` and can be reset from a
    settings menu.

### 9.5 Data tab edits persistence

  Edits in the Data tab are auto-saved to `localStorage` separately
  (under `bug_tool_pending_data_v1`). They do NOT touch
  `bug_data.csv` on disk until the user clicks "Save & export".
  This means: a tester can experiment with the data tab, close
  the browser, come back, and find their work-in-progress still
  there. Only "Save & export" makes the change visible to the
  rest of the team.

---

## 10. Tech Choices

  * HTML5 + CSS3 (Grid + Flexbox) + vanilla ES2020 JS.
  * No build step, no bundler, no package.json.
  * No framework. The UI is small enough (~6 components) that a
    framework would add weight without benefit.
  * A small `state` object is the single source of truth; views
    re-render on `state` changes.
  * The full monolith should fit in a single .html file under
    ~1500 lines (target), readable by any developer with no
    special tooling.

---

## 11. Out of Scope (v1)

  * Direct write to the share folder (would require a backend).
  * Multi-user concurrent editing of the same instance (not a
    real use case; the DB team is the only multi-editor).
  * Cloud sync, telemetry, login, audit log.
  * Custom templates per project / per team (the format is fixed
    for v1; future versions can support project-specific
    templates by adding a `template` category to the CSV).
  * Localization (UI is Spanish/English mixed, matching the
    team's current practice; full i18n is a future enhancement).
  * Server-side validation, anti-tamper, or signed CSV files. The
    tool trusts whatever CSV it loads. If the DB team mis-edits
    it, the tool will show a parse error and refuse to load —
    it will NOT silently fall back to defaults.

---

## 12. Resolved Decisions

  | # | Decision                                                                   |
  |---|----------------------------------------------------------------------------|
  | 1 | `cl` and `bspCl` are two distinct fields. `bspCl` accepts numeric or       |
  |   | "N/A". The tool rejects the case where both are the same numeric value.    |
  | 2 | `bugType` (TIPO) is the summary header field, sourced from the CSV list    |
  |   | `bugTypes`. No separate "classification" field — they are the same.       |
  | 3 | All progress is auto-saved to `localStorage` on every change (debounced    |
  |   | ~300ms). The user can resume exactly where they left off after a browser   |
  |   | close or a machine restart. `bug_session.json` file save/load is for      |
  |   | backup or cross-machine transfer, not for normal auto-save.               |
  | 4 | The close-confirm dialog includes a "Don't ask again" checkbox. The       |
  |   | preference is stored in `localStorage` and is reset from a settings menu. |
  | 5 | Filenames: `bug_tool.html`, `bug_data.csv`, `bug_session.json`            |
  |   | (lowercase + underscore). Confirmed.                                      |
  | 6 | Keyword overlap check is **case-insensitive**, matching Jira's search     |
  |   | behavior.                                                                 |

---

## 13. Milestones (proposed)

  M0 — Approval of this design doc
  M1 — CSV schema + sample data file (no UI)
  M2 — HTML skeleton with tabs, instance bar, and empty panels
  M3 — Bug tab: form + validation + output
  M4 — Regression tab: form + validation + output
  M5 — Data tab: in-app editor + CSV export
  M6 — CSV load flow + session save/load + localStorage auto-save
  M7 — Polish: tooltips, glow, copy buttons, download .md/.txt
  M8 — Real data from the team, integration testing on the share
        folder

---

## 14. Glossary

  * Bug       — a defect ticket
  * Regression — a verification note saying a previously-fixed bug
                 is back (or not reproducible)
  * Verify    — synonym for regression in this context
  * POI       — Point of Interest (a named location on a map)
  * CL        — Change List (a code commit identifier)
  * BSP       — Binary Space Partition (map geometry identifier)
  * CCS / FFOTD — build content identifier (project-specific)
  * Tier      — broad category grouping (e.g. T1 = Gameplay)
  * CST       — Central Standard Time (used as the default tz label)

---

# ADDENDUM — v2 (2026-07-04): herramienta schema-driven

La v1 tenía los formularios Bug/Regression escritos a mano en el JS.
La v2 los convierte en DATOS: el monolito se edita a sí mismo.

## Arquitectura

  * **Bloque `<script type="application/json" id="vanillaConfig">`**
    dentro del HTML: contiene `data` (listas, mapas, POIs, tiers,
    reglas) y `schema` (formularios → secciones → campos). Es la
    "config vanilla" del archivo distribuido, legible y editable.
  * Al abrir, el JS captura el HTML prístino (`outerHTML` antes de
    renderizar). **"Exportar herramienta"** reemplaza el bloque
    vanilla por la config actual y descarga un `bug_tool.html` nuevo
    (estilo TiddlyWiki). Ese archivo va al sharefolder.
  * El día a día se guarda en `localStorage`
    (`bug_tool_v2_config` + `bug_tool_v2_session`, debounce 300 ms).
    Si la config local difiere de la vanilla, se muestra el chip
    "Config modificada".

## Schema

  * Formulario → secciones (`mode: joined|lines`, `heading`, `sep`,
    `noGap`) → campos.
  * Campo: `id, label, type (text|textarea|autocomplete|keywords|
    mirror), source, size (full|half|third), template ("{value}"),
    sep, joinPrev, perLine, rows, required, regex, regexMsg,
    default, emptyAs, omitValue, help`.
  * Prefijo `@` = referencia a `data.rules` (ej. `regex: "@coord_re"`,
    `default: "@default_tz"`).
  * El output se genera recorriendo secciones/campos en orden; no
    queda NINGÚN texto de formato fijo en el código.

## UI nueva respecto a v1

  * Modo edición (toggle "✎ Editar formulario"): ▲▼ para reordenar
    (= orden del output), ✎ editor de campo/sección en modal, ✕ con
    confirmación, "+ campo" y "+ Agregar sección".
  * Dropdowns: fila "+ Agregar «...»" para sumar opciones y ✕ por
    opción para borrarlas (con confirmación). Escriben en DATA.
  * Botones del output en columna vertical a la derecha (más espacio
    vertical para el textarea).
  * Tiles de validación arriba (verde = listo; rojos clickeables por
    campo con error) — base de los futuros tiles configurables.
  * Pestaña **Rules**: tabla editable de required/regex/mensaje/
    default por campo + reglas globales. Preparada para condiciones
    entre campos (futuro).
  * Pestañas superiores dinámicas: una por formulario del schema.

## CSVs

  * `bug_data.csv` — igual que v1 (`category,key,value`); las listas
    con `key` nueva se crean solas.
  * `bug_fields.csv` — NUEVO: serializa el schema completo (filas
    `form` / `section` / campo, 20 columnas). Import valida todo y
    no aplica nada si hay errores. Token `NONE` en la columna `sep`
    = sin separador (campo pegado al anterior).
  * Ambos con import/export desde el menú "Datos CSV".

## Iteración 2 (2026-07-05): condiciones, media editable, chips por campo

  * **Condiciones entre campos** (`form.rules`, editables en RULES y
    en `bug_fields.csv` como filas `type=cond`):
    `{ when: {field, op, value}, then: {action, field, value} }`.
    Ops: empty/notEmpty/equals/notEquals/matches(regex|@regla)/
    equalsField/notEqualsField (comparan contra otro campo, ambos
    no vacíos). Acciones: show/hide/disable/setDefault(si vacío)/
    error(mensaje). Campos con `hidden: true` solo aparecen si una
    condición los muestra (caso "LOD number"). Ocultos/bloqueados no
    validan ni salen al output. Se evalúan al salir de cada campo
    (re-render solo si cambió el estado). La validación v1
    cl != bspCl volvió como condición vanilla con acción error.
  * **Media editable**: textbox Key (clave del ticket, por instancia)
    + filas generadas solas desde la lista `mediaTypes` (DATA) con la
    regla `media_fmt` — placeholders {type}, {key}, {platform} y
    cualquier id de campo. Ya no hay keys manuales por tipo de media.
  * **Chips por campo**: `kwCount` (número o @regla; vacío = libre) y
    `kwOverlap` (prohibir aparición en el cuerpo). Un chips nuevo ya
    no exige 5 por default.
  * `\n` y `<br>` en template/sep/heading = salto de línea real.
  * Botones de output: Copiar todo / summary (1.ª sección unida) /
    description (el resto). CSV de campos: 23 columnas
    (+hidden, +kwcount, +kwoverlap) y filas cond.

## Iteración 3 (2026-07-07): expresiones booleanas, media por sección

  * **Motor de expresiones booleanas** para las condiciones entre
    campos. La condición dejó de ser `when: {field, op, value}` y pasó
    a `whenExpr: "<texto>"`. Gramática (may/min indistinto): `AND`/`&&`,
    `OR`/`||`, `NOT`/`!`, paréntesis, y comparaciones
    `campo empty|notEmpty`, `campo = "v"` (`==`), `campo != "v"`
    (`<>`), `campo matches @regla|regex` (`~`) y `campoA = campoB`
    (dos campos por id). Un `@nombre` suelto evalúa esa regla de DATA
    como sub-expresión booleana y permite concatenarlas
    (`@esLod OR @esVlod`); hay guardia anti-ciclos. Pipeline:
    `tokenizeExpr` → `parseExpr` (descenso recursivo → AST) →
    `evalAst`, que reusa `evalCondition` por comparación (misma
    semántica de siempre). `ruleWhenTrue` acepta la forma nueva o una
    `when` vieja. Sintaxis inválida → mensaje legible (`exprError`).
  * **Migración automática** `migrateRulesToExpr` (en boot, sobre
    vanilla y config): convierte cada `when` vieja a texto con
    `whenToExpr` y borra el objeto. Los HTML/CSV ya distribuidos se
    completan solos al abrir.
  * **Pestaña Rules**: las tres columnas (campo/operador/valor) se
    reemplazaron por UN input de expresión monospace con validación en
    vivo (borde rojo + mensaje bajo el campo). El CSV `type=cond` lleva
    la expresión en la columna `source` (ver bug_fields.README.md); el
    formato viejo op/valor se sigue leyendo al importar.
  * **Media por sección**: `form.media = { source, fmt }` permite que
    cada formulario (bug, regression...) use su propia lista de tipos y
    su propia regla de nombre — p. ej. regresión con prefijo `Open_`.
    Sin override usa la lista `mediaTypes` y la regla global
    `media_fmt`. Se edita con el lápiz ✎ del panel de media (solo en
    modo edición); el editor guarda la config COMPLETA (lista+regla),
    no el diff contra el global, para que el export sea autodescriptivo.
    Un checkbox "volver al global" borra el override. `mediaTypes()`,
    `mediaFormat()` y `mediaSource()` ahora reciben el formulario.
  * **Autocomplete**: el tipo de media usa el mismo widget autocomplete
    que los campos (agregar/borrar opciones in situ) en vez del
    `datalist`. El dropdown se abre hacia arriba (`drop-up`) cuando no
    cabe abajo dentro de su contenedor scrolleable
    (`positionAutocomplete` / `nearestScrollParent`), navegar con
    flechas hace scroll solo dentro del dropdown, y la flecha ▼ abre la
    lista completa (enfoca primero, luego renderiza).

## Iteración 4 (2026-07-07): listas correlacionadas como árbol unificado

  * **Modelo unificado en árbol.** Se retiró el par built-in Mapa/POI
    (`data.maps`/`data.pois`) y los pares `data.linkedLists`
    (padre+hijo empaquetados). Ahora:
    - `data.lists  = { id: [valores] }` — listas raíz (planas).
    - `data.childLists = { id: { parent, values:{pv:[...]} } }` —
      dependientes; `values` indexado por el valor del padre y `parent`
      apunta a CUALQUIER lista (raíz o dependiente).
    - `data.listMeta = { id: { label } }` — etiqueta visible opcional.
    Cualquier lista puede ser padre de varias dependientes, y una
    dependiente puede ser padre de otra → profundidad arbitraria
    (Región → Mapa → POI → …). Hijas siempre nuevas, un solo padre.
  * **Resolución** (`optionsForField`, `parseSource`): fuente de campo
    `<id>` (raíz) o `child:<hija>:<campoPadre>` (lee el valor del campo
    padre y hace lookup en `childLists[hija].values[pv]` — por eso los
    niveles encadenan sin lógica extra). Los hijos se indexan por el
    STRING del valor del padre (dos padres homónimos comparten hijos, por
    decisión de diseño). `getLinks()`/kind "parent" eliminados.
  * **Migración automática** `migrateListsToTree` (boot, sobre vanilla y
    config; idempotente): Mapa/POI → raíz `map` + dependiente `poi`;
    cada `linkedLists` viejo → raíz + dependiente (`x_hijo`); reescribe
    las fuentes de los campos (`parent:map`→`map`, `child:map:f`→
    `child:poi:f`, etc.). `normalizeFieldSources` hace lo mismo al
    importar un `bug_fields.csv` anterior.
  * **Pestaña DATA**: una categoría por lista (raíz o dependiente,
    rotulada "hija de …"). Editar un valor de una lista padre arrastra
    en cascada los buckets de sus hijas (`renameParentValue`). El ✕
    borra la lista y TODO su subárbol (`cascadeDeleteList`, con aviso).
    "+ Lista correlacionada" (`addChildList`) crea una dependiente NUEVA
    bajo la lista seleccionada. El editor de campo ofrece las hijas de
    la lista a la que está atado cada campo (`sourceOptions`), habilitando
    encadenar.
  * **CSV `bug_data.csv`**: categorías nuevas `childlist` (id→padre),
    `childval` (id → `padre :: valor`) y `listlabel` (id→etiqueta); las
    raíces siguen como `list`. El formato viejo (`map`/`poi`/`link`/
    `linkparent`/`linkchild`) se sigue leyendo al importar (se migra) y
    se reescribe al exportar. Ver bug_data.README.md.

## Iteración 5 (2026-07-07): tiles personalizados

  * **Modelo.** Nueva capa `form.tiles = [ { text, whenExpr, color,
    group, severity, field } ]`, paralela a `form.rules` y por
    formulario. Los tiles automáticos por campo (uno por error) se
    conservan sin cambios; los personalizados se suman. Un tile es
    **independiente de los campos**: aparece cuando su `whenExpr` es
    verdadera (o siempre, si está vacía), reutilizando el motor de
    expresiones de la iteración 3 (`parseExpr`/`evalAst`).
    - `text` admite `{idCampo}` → intercala el valor actual
      (`interpolateTileText`).
    - `severity`: `error` bloquea el estado "listo para copiar"
      (`hasBlockingState` = errores de campo **o** algún tile error
      activo); `warn`/`info` solo informan.
    - `color`: paleta de 15 colores con nombre (`TILE_COLORS`, fuente
      única; se aplica como estilo en línea, sin clases CSS por color).
    - `group`: etiqueta; los tiles del mismo grupo se dibujan juntos.
    - `field`: campo al que salta el click (vacío = 1er campo que
      menciona la condición, vía `tileFieldRefs`).
  * **Barra (`renderTiles`).** Grupos apilados: "Errores de campo"
    (automáticos) + un grupo por etiqueta de tile. Si nada bloquea, se
    muestra el tile verde "Listo para copiar" junto a los avisos/info.
    La barra (`.tiles-wrap`) se limita a ~3 líneas con scroll y se
    **colapsa a una línea** con la "llave" (`#tilesToggle`, chevron que
    rota); el estado vive en `state.prefs.tilesCollapsed`. La "llave" es
    un patrón pensado para reutilizarse luego en las secciones del form.
  * **Resaltado cruzado campo→tile** (`wireTileInteractions`, delegado
    una vez sobre `#formPanel` y `#tilesBar`, sobrevive a los re-render):
    al pasar el mouse o enfocar un campo, todos los tiles que lo "tocan"
    (`data-fields`, derivado de `exprFieldRefs` + `field`) se marcan
    (`.tile-hot`, anillo con el color propio) y el resto se atenúa
    (`.tiles-focus`). Complementa el click-tile→campo ya existente.
  * **Edición** en la pestaña Rules: bloque "Tiles personalizados" con
    una tabla por formulario (reusa el estilo `cond-table`/`cond-expr`
    con validación en vivo de la expresión). El `<select>` de color se
    tiñe con su propio color. Migración/normalización `ensureTiles` +
    `normalizeTiles` en boot (vanilla y config) y tras importar CSV.
  * **CSV**: filas `type=tile` en `bug_fields.csv` reusando columnas
    (label=texto, source=whenExpr, regex=severidad, regexmsg=campo
    destino, default=color, emptyas=grupo) — el encabezado de 23
    columnas NO cambia, así que los CSV viejos siguen importando. Ver
    bug_fields.README.md. Verificado en navegador: agrupación, colores,
    interpolación, colapso, resaltado, bloqueo por severidad y
    round-trip CSV (export→import).

## Pendiente (siguientes iteraciones)

  * Reordenar tiles y grupos con flechas; color por grupo (hoy el color
    es por tile). Ver ROADMAP §1.
  * Más conexiones media↔Rules: el formato por sección ya existe; falta
    lo que detalle Rubén (condiciones sobre media —p. ej. exigir
    ConsoleLog si el bug es Crash— y validar la Key con regex).
    Ver ROADMAP §2.
