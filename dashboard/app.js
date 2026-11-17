"use strict";


const app = document.querySelector("#app");

const modal = document.querySelector("#modal");

const modalTitle = document.querySelector(
  "#modal-title"
);

const modalBody = document.querySelector(
  "#modal-body"
);

const toast = document.querySelector("#toast");


const state = {

  user: null,

  csrf: null,

  page: "overview",

  dashboard: null,

  models: [],

  profiles: [],

  hosts: [],

  gpus: [],

  operations: [],

  operationsPagination: {
    page: 1,
    page_size: 25,
    total: 0,
    pages: 1,
  },

  users: [],

  userWorkspace: null,

  usersPagination: {
    page: 1,
    page_size: 25,
    total: 0,
    pages: 1,
  },

  groups: [],

  groupWorkspace: null,

  groupsPagination: {
    page: 1,
    page_size: 25,
    total: 0,
    pages: 1,
  },

  grants: [],

  grantsPagination: {
    page: 1,
    page_size: 25,
    total: 0,
    pages: 1,
  },

  apiKeyUserId: null,

  view: {

    profiles: {
      search: "",
      runtimeState: "",
      worker: "",
      modelId: "",
    },

    operations: {
      kind: "",
      status: "",
      day: "",
      worker: "",
      page: 1,
      pageSize: 25,
    },

    users: {
      email: "",
      role: "",
      userId: null,
      page: 1,
      pageSize: 25,
    },

    groups: {
      name: "",
      enabled: "",
      groupId: null,
      page: 1,
      pageSize: 25,
    },

    grants: {
      principalType: "",
      subject: "",
      targetType: "",
      target: "",
      page: 1,
      pageSize: 25,
    },

    operationViewer: {
      operationId: null,
      followTail: true,
    },
  },

  pollTimer: null,

  operationTimer: null,
};


/* ============================================================
   API
   ============================================================ */

async function api(
  path,
  {
    method = "GET",
    body = undefined,
    csrf = true,
  } = {},
) {

  const headers = {
    "Accept": "application/json",
  };


  if (body !== undefined) {

    headers["Content-Type"] =
      "application/json";
  }


  if (
    csrf
    &&
    method !== "GET"
    &&
    state.csrf
  ) {

    headers["X-CSRF-Token"] =
      state.csrf;
  }


  const response = await fetch(
    path,
    {
      method,
      credentials: "same-origin",
      headers,

      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    },
  );


  let payload = {};


  const text = await response.text();


  if (text) {

    try {

      payload = JSON.parse(text);

    } catch {

      payload = {
        detail: text,
      };
    }
  }


  if (!response.ok) {

    if (response.status === 401) {

      state.user = null;

      stopPolling();

      renderLogin();
    }


    const message =
      payload.detail
      ||
      `HTTP ${response.status}`;


    throw new Error(message);
  }


  return payload;
}


/* ============================================================
   ESCAPING / FORMAT
   ============================================================ */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatMiB(
  used,
  total,
) {

  if (
    used == null
    ||
    total == null
  ) {

    return "—";
  }


  return (
    `${(used / 1024).toFixed(1)} / `
    +
    `${(total / 1024).toFixed(0)} GB`
  );
}


function formatBytes(value) {

  if (value == null) {
    return "—";
  }


  const gb = (
    value
    /
    1024
    /
    1024
    /
    1024
  );


  return `${gb.toFixed(1)} GB`;
}


function formatNumber(
  value,
  suffix = "",
) {

  if (value == null) {
    return "—";
  }


  return `${value}${suffix}`;
}


function age(value) {

  if (!value) {
    return "—";
  }


  const timestamp = new Date(value);

  const seconds = Math.max(
    0,
    Math.floor(
      (
        Date.now()
        -
        timestamp.getTime()
      )
      / 1000
    ),
  );


  if (seconds < 60) {
    return `${seconds}s ago`;
  }


  if (seconds < 3600) {

    return (
      `${Math.floor(seconds / 60)}m ago`
    );
  }


  if (seconds < 86400) {

    return (
      `${Math.floor(seconds / 3600)}h ago`
    );
  }


  return (
    `${Math.floor(seconds / 86400)}d ago`
  );
}


function statusBadge(
  label,
  tone = "neutral",
) {

  return `
    <span class="status status-${tone}">
      <span class="status-dot"></span>
      ${escapeHtml(label)}
    </span>
  `;
}


function stateTone(value) {

  const normalized =
    String(value || "")
    .toLowerCase();


  if (
    [
      "online",
      "free",
      "healthy",
      "installed",
      "succeeded",
      "running",
      "exposed",
    ].includes(normalized)
  ) {

    return "green";
  }


  if (
    [
      "partial",
      "queued",
      "starting",
      "unverified",
    ].includes(normalized)
  ) {

    return "amber";
  }


  if (
    [
      "failed",
      "unreachable",
      "mismatch",
      "missing",
      "not_exposed",
    ].includes(normalized)
  ) {

    return "red";
  }


  if (normalized === "busy") {

    return "blue";
  }


  return "neutral";
}


/* ============================================================
   UI HELPERS
   ============================================================ */

let toastTimer = null;


function showToast(
  message,
  isError = false,
) {

  clearTimeout(
    toastTimer
  );


  toast.textContent =
    message;


  toast.style.color =
    isError
      ? "var(--red)"
      : "var(--text)";


  toast.hidden = false;


  toastTimer = setTimeout(
    () => {

      toast.hidden = true;

    },
    3800,
  );
}


function openModal(
  title,
  html,
) {

  modalTitle.textContent =
    title;

  modalBody.innerHTML =
    html;


  if (!modal.open) {

    modal.showModal();
  }
}


function closeModal() {

  if (modal.open) {

    modal.close();
  }


  /*
   * Important for one-time API-key reveal:
   * remove modal contents from the DOM when closed.
   */
  modalTitle.textContent = "";

  modalBody.replaceChildren();


  stopOperationPolling();
}


document
  .querySelector("#modal-close")
  .addEventListener(
    "click",
    closeModal,
  );


modal.addEventListener(
  "click",
  event => {

    if (event.target === modal) {

      closeModal();
    }
  },
);


/*
 * SECURAS_MODAL_CLOSE_SCRUB
 *
 * Native <dialog> may close through Escape without going
 * through closeModal(). Always erase modal contents when the
 * dialog reaches the closed state.
 */
modal.addEventListener(
  "close",
  () => {

    modalTitle.textContent = "";

    modalBody.replaceChildren();

    stopOperationPolling();
  },
);


/* ============================================================
   LOGIN
   ============================================================ */

function renderLogin(
  message = "",
) {

  app.innerHTML = `
    <main class="login-page">

      <section class="login-box">

        <div class="login-brand">

          <div class="brand-mark">
            S
          </div>

          <div>

            <h1>Securas Control</h1>

            <p>
              Inference operations console
            </p>

          </div>

        </div>

        ${
          message
            ? `
              <div
                class="error-box"
                style="margin-bottom:16px"
              >
                ${escapeHtml(message)}
              </div>
            `
            : ""
        }

        <form id="login-form">

          <div class="field">

            <label for="login-username">
              Username
            </label>

            <input
              id="login-username"
              name="username"
              autocomplete="username"
              required
              autofocus
            >

          </div>

          <div class="field">

            <label for="login-password">
              Password
            </label>

            <input
              id="login-password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            >

          </div>

          <button
            class="button button-primary"
            type="submit"
          >
            Sign in
          </button>

        </form>

      </section>

    </main>
  `;


  document
    .querySelector("#login-form")
    .addEventListener(
      "submit",
      login,
    );
}


async function login(event) {

  event.preventDefault();


  const form =
    new FormData(
      event.currentTarget
    );


  try {

    const result = await api(
      "/api/v1/auth/login",
      {
        method: "POST",

        csrf: false,

        body: {
          username:
            form.get("username"),

          password:
            form.get("password"),
        },
      },
    );


    state.user =
      result.user;

    state.csrf =
      result.csrf_token;


    if (
      state.user.role
      !== "admin"
    ) {

      renderLogin(
        "This interface currently requires an administrator account."
      );

      return;
    }


    renderShell();

    await navigate(
      "overview"
    );


  } catch (error) {

    renderLogin(
      error.message
      === "INVALID_CREDENTIALS"
        ? "Invalid username or password."
        : error.message
    );
  }
}


/* ============================================================
   SHELL
   ============================================================ */

function renderShell() {

  app.innerHTML = `
    <div class="shell">

      <aside class="sidebar">

        <div class="sidebar-brand">

          <div class="brand-mark">
            S
          </div>

          <div>

            <div class="sidebar-brand-title">
              Securas
            </div>

            <div class="sidebar-brand-subtitle">
              Inference Control
            </div>

          </div>

        </div>

        <div class="demo-sidebar-tag">PRESENTATION DEMO</div><nav class="nav">

          ${navButton(
            "overview",
            "Overview"
          )}

          ${navButton(
            "workers",
            "Workers"
          )}

          ${navButton(
            "models",
            "Models"
          )}

          ${navButton(
            "profiles",
            "Profiles"
          )}

          ${navButton(
            "operations",
            "Operations"
          )}

          ${navButton(
            "users",
            "Users"
          )}

          ${navButton(
            "groups",
            "Groups"
          )}

          ${navButton(
            "grants",
            "Grants"
          )}

          ${navButton(
            "api-keys",
            "API Keys"
          )}

        </nav>

        <div class="sidebar-bottom">

          <div class="current-user">

            <div class="current-user-name">
              ${escapeHtml(
                state.user.username
              )}
            </div>

            <div class="current-user-role">
              Administrator
            </div>

          </div>

          <a class="button button-quiet" href="../#/dashboard">← Presentation</a>

        </div>

      </aside>

      <main id="page" class="main"><div class="demo-banner"><span>SIMULATED DATA</span> Local interactive reproduction of Securas Control · No connection to production</div></main>

    </div>
  `;


  bindMachinePhotoFallbacks();
}


function navButton(
  page,
  label,
) {

  return `
    <button
      class="nav-button"
      data-page="${page}"
    >
      ${label}
    </button>
  `;
}


function updateNavigation() {

  document
    .querySelectorAll(
      ".nav-button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.page
          === state.page
        );
      }
    );
}


/* ============================================================
   PAGE ROUTING
   ============================================================ */

function readHashRoute() {

  const raw =
    location.hash
      .replace(
        /^#/,
        ""
      );


  const separator =
    raw.indexOf(
      "?"
    );


  const page =
    (
      separator === -1
        ? raw
        : raw.slice(
            0,
            separator
          )
    )
    || "overview";


  const query =
    separator === -1
      ? ""
      : raw.slice(
          separator + 1
        );


  return {
    page,
    params:
      new URLSearchParams(
        query
      ),
  };
}


function loadViewStateFromRoute(
  route,
) {

  if (
    route.page
    === "profiles"
  ) {

    const runtimeState =
      route.params.get(
        "state"
      )
      || "";


    state.view.profiles.search =
      route.params.get(
        "search"
      )
      || "";


    state.view.profiles.runtimeState =
      [
        "",
        "running",
        "stopped",
      ].includes(
        runtimeState
      )
        ? runtimeState
        : "";


    state.view.profiles.worker =
      route.params.get(
        "worker"
      )
      || "";


    const modelId =
      Number(
        route.params.get(
          "model"
        )
        || 0
      );


    state.view.profiles.modelId =
      (
        Number.isInteger(
          modelId
        )
        &&
        modelId > 0
      )
        ? String(
            modelId
          )
        : "";
  }


  if (
    route.page
    === "operations"
  ) {

    const kind =
      route.params.get(
        "kind"
      )
      || "";


    const status =
      route.params.get(
        "status"
      )
      || "";


    const page =
      Number(
        route.params.get(
          "page"
        )
        || 1
      );


    const pageSize =
      Number(
        route.params.get(
          "page_size"
        )
        || 25
      );


    state.view.operations.kind =
      [
        "",
        "profile_check",
        "profile_up",
        "profile_down",
        "model_install",
        "model_copy",
      ].includes(
        kind
      )
        ? kind
        : "";


    state.view.operations.status =
      [
        "",
        "queued",
        "running",
        "succeeded",
        "failed",
      ].includes(
        status
      )
        ? status
        : "";


    state.view.operations.day =
      route.params.get(
        "day"
      )
      || "";


    state.view.operations.worker =
      route.params.get(
        "worker"
      )
      || "";


    state.view.operations.page =
      (
        Number.isInteger(page)
        &&
        page >= 1
      )
        ? page
        : 1;


    state.view.operations.pageSize =
      [
        25,
        50,
        100,
      ].includes(
        pageSize
      )
        ? pageSize
        : 25;
  }

  if (
    route.page === "users"
  ) {

    const page =
      Number(
        route.params.get("page")
        || 1
      );

    const pageSize =
      Number(
        route.params.get("page_size")
        || 25
      );


    state.view.users.email =
      route.params.get("email")
      || "";


    const role =
      route.params.get(
        "role"
      )
      || "";


    state.view.users.role =
      [
        "",
        "user",
        "admin",
      ].includes(
        role
      )
        ? role
        : "";


    const userId =
      Number(
        route.params.get("user")
        || 0
      );


    state.view.users.userId =
      (
        Number.isInteger(userId)
        &&
        userId > 0
      )
        ? userId
        : null;


    state.view.users.page =
      (
        Number.isInteger(page)
        &&
        page >= 1
      )
        ? page
        : 1;

    state.view.users.pageSize =
      [25, 50, 100].includes(pageSize)
        ? pageSize
        : 25;
  }


  if (
    route.page === "groups"
  ) {

    const page =
      Number(
        route.params.get("page")
        || 1
      );

    const pageSize =
      Number(
        route.params.get("page_size")
        || 25
      );

    const enabled =
      route.params.get("enabled")
      || "";


    state.view.groups.name =
      route.params.get("name")
      || "";

    state.view.groups.enabled =
      [
        "",
        "true",
        "false",
      ].includes(enabled)
        ? enabled
        : "";


    const groupId =
      Number(
        route.params.get(
          "group"
        )
        || 0
      );


    state.view.groups.groupId =
      (
        Number.isInteger(
          groupId
        )
        &&
        groupId > 0
      )
        ? groupId
        : null;


    state.view.groups.page =
      (
        Number.isInteger(page)
        &&
        page >= 1
      )
        ? page
        : 1;

    state.view.groups.pageSize =
      [25, 50, 100].includes(pageSize)
        ? pageSize
        : 25;
  }


  if (
    route.page === "grants"
  ) {

    const page =
      Number(
        route.params.get("page")
        || 1
      );

    const pageSize =
      Number(
        route.params.get("page_size")
        || 25
      );


    state.view.grants.principalType =
      route.params.get("principal_type")
      || "";

    state.view.grants.subject =
      route.params.get("subject")
      || "";

    state.view.grants.targetType =
      route.params.get("target_type")
      || "";

    state.view.grants.target =
      route.params.get("target")
      || "";

    state.view.grants.page =
      (
        Number.isInteger(page)
        &&
        page >= 1
      )
        ? page
        : 1;

    state.view.grants.pageSize =
      [25, 50, 100].includes(pageSize)
        ? pageSize
        : 25;
  }

}


function routeForPage(
  page,
) {

  const params =
    new URLSearchParams();


  if (
    page === "profiles"
  ) {

    const view =
      state.view.profiles;


    if (view.search) {

      params.set(
        "search",
        view.search
      );
    }


    if (view.runtimeState) {

      params.set(
        "state",
        view.runtimeState
      );
    }


    if (view.worker) {

      params.set(
        "worker",
        view.worker
      );
    }


    if (view.modelId) {

      params.set(
        "model",
        String(
          view.modelId
        )
      );
    }
  }


  if (
    page === "operations"
  ) {

    const view =
      state.view.operations;


    if (view.kind) {

      params.set(
        "kind",
        view.kind
      );
    }


    if (view.status) {

      params.set(
        "status",
        view.status
      );
    }


    if (view.day) {

      params.set(
        "day",
        view.day
      );
    }


    if (view.worker) {

      params.set(
        "worker",
        view.worker
      );
    }


    if (
      view.page !== 1
    ) {

      params.set(
        "page",
        String(
          view.page
        )
      );
    }


    if (
      view.pageSize !== 25
    ) {

      params.set(
        "page_size",
        String(
          view.pageSize
        )
      );
    }
  }




  if (
    page === "users"
  ) {

    const view =
      state.view.users;

    if (view.email) {
      params.set(
        "email",
        view.email
      );
    }


    if (view.role) {

      params.set(
        "role",
        view.role
      );
    }


    if (view.userId) {
      params.set(
        "user",
        String(
          view.userId
        )
      );
    }


    if (view.page !== 1) {
      params.set(
        "page",
        String(view.page)
      );
    }

    if (view.pageSize !== 25) {
      params.set(
        "page_size",
        String(view.pageSize)
      );
    }
  }


  if (
    page === "groups"
  ) {

    const view =
      state.view.groups;

    if (view.name) {
      params.set(
        "name",
        view.name
      );
    }

    if (view.enabled) {
      params.set(
        "enabled",
        view.enabled
      );
    }


    if (view.groupId) {
      params.set(
        "group",
        String(
          view.groupId
        )
      );
    }


    if (view.page !== 1) {
      params.set(
        "page",
        String(view.page)
      );
    }

    if (view.pageSize !== 25) {
      params.set(
        "page_size",
        String(view.pageSize)
      );
    }
  }


  if (
    page === "grants"
  ) {

    const view =
      state.view.grants;

    if (view.principalType) {
      params.set(
        "principal_type",
        view.principalType
      );
    }

    if (view.subject) {
      params.set(
        "subject",
        view.subject
      );
    }

    if (view.targetType) {
      params.set(
        "target_type",
        view.targetType
      );
    }

    if (view.target) {
      params.set(
        "target",
        view.target
      );
    }

    if (view.page !== 1) {
      params.set(
        "page",
        String(view.page)
      );
    }

    if (view.pageSize !== 25) {
      params.set(
        "page_size",
        String(view.pageSize)
      );
    }
  }


  const query =
    params.toString();


  return (
    page
    +
    (
      query
        ? `?${query}`
        : ""
    )
  );
}


function replaceCurrentViewRoute() {

  const route =
    routeForPage(
      state.page
    );


  history.replaceState(
    null,
    "",
    (
      location.pathname
      +
      location.search
      +
      `#${route}`
    ),
  );
}


function resetViewStateForPage(
  page,
) {

  if (
    page === "profiles"
  ) {

    state.view.profiles.search =
      "";

    state.view.profiles.runtimeState =
      "";

    state.view.profiles.worker =
      "";

    state.view.profiles.modelId =
      "";
  }


  if (
    page === "operations"
  ) {

    state.view.operations.kind =
      "";

    state.view.operations.status =
      "";

    state.view.operations.day =
      "";

    state.view.operations.worker =
      "";

    state.view.operations.page =
      1;

    state.view.operations.pageSize =
      25;
  }

  if (
    page === "users"
  ) {
    state.view.users.email = "";
    state.view.users.role = "";
    state.view.users.userId = null;
    state.view.users.page = 1;
    state.view.users.pageSize = 25;

    state.userWorkspace = null;
  }


  if (
    page === "groups"
  ) {
    state.view.groups.name = "";
    state.view.groups.enabled = "";
    state.view.groups.groupId = null;
    state.view.groups.page = 1;
    state.view.groups.pageSize = 25;

    state.groupWorkspace = null;
  }


  if (
    page === "grants"
  ) {
    state.view.grants.principalType = "";
    state.view.grants.subject = "";
    state.view.grants.targetType = "";
    state.view.grants.target = "";
    state.view.grants.page = 1;
    state.view.grants.pageSize = 25;
  }

}


function normalizeCurrentPageRoute(
  page,
) {

  if (
    [
      "profiles",
      "operations",
      "users",
      "groups",
      "grants",
    ].includes(
      page
    )
  ) {

    history.replaceState(
      null,
      "",
      (
        location.pathname
        +
        location.search
        +
        `#${page}`
      ),
    );
  }
}


async function navigate(
  page,
  {
    syncHash = true,
  } = {},
) {

  const previousPage =
    state.page;


  if (
    previousPage
    !== page
  ) {

    /*
     * syncHash=true means this transition was initiated
     * by the Securas UI.
     *
     * Normalize the page we are LEAVING before changing
     * the hash. Do not do this for a browser-driven
     * hashchange because the browser has already moved
     * to another history entry.
     */
    if (syncHash) {

      normalizeCurrentPageRoute(
        previousPage
      );
    }


    resetViewStateForPage(
      previousPage
    );
  }


  state.page = page;


  if (syncHash) {

    const wantedHash =
      routeForPage(
        page
      );


    if (
      location.hash
      !== `#${wantedHash}`
    ) {

      location.hash =
        wantedHash;
    }
  }


  updateNavigation();

  stopPolling();


  try {

    await renderCurrentPage();

  } catch (error) {

    renderPageError(
      error
    );
  }


  startPolling();
}


async function renderCurrentPage() {

  switch (state.page) {

    case "overview":
      await renderOverview();
      break;

    case "workers":
      await renderWorkers();
      break;

    case "models":
      await renderModels();
      break;

    case "profiles":
      await renderProfiles();
      break;

    case "operations":
      await renderOperations();
      break;

    case "users":
      await renderUsersPage();
      break;

    case "groups":
      await renderGroupsPage();
      break;

    case "grants":
      await renderGrantsPage();
      break;

    case "access":
      state.page = "users";

      history.replaceState(
        null,
        "",
        (
          location.pathname
          +
          location.search
          +
          "#users"
        ),
      );

      updateNavigation();

      await renderUsersPage();
      break;

    case "api-keys":
      await renderApiKeys();
      break;

    default:

      state.page = "overview";

      await renderOverview();
  }
}


function pageElement() {

  return document.querySelector(
    "#page"
  );
}


function renderPageError(error) {

  const page = pageElement();

  if (!page) {
    return;
  }


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Error
        </h1>

      </div>

    </div>

    <div class="error-box">
      ${escapeHtml(error.message)}
    </div>
  `;
}


/* ============================================================
   DASHBOARD
   ============================================================ */

async function loadDashboard() {

  state.dashboard = await api(
    "/api/v1/admin/dashboard"
  );


  return state.dashboard;
}


async function renderOverview() {

  const data =
    await loadDashboard();


  const summary =
    data.summary;


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Overview
        </h1>

        <p class="page-description">
          Live inference cluster state
          · refreshed ${escapeHtml(
            age(data.generated_at)
          )}
        </p>

      </div>

      ${
        data.stale
          ? statusBadge(
              "STALE DATA",
              "red"
            )
          : statusBadge(
              "LIVE",
              "green"
            )
      }

    </div>


    <div class="summary-grid">

      ${summaryCard(
        "Workers",
        `${summary.workers_online} / ${summary.workers_total}`,
        "inference workers online"
      )}

      ${summaryCard(
        "GPUs",
        `${summary.gpus_free} / ${summary.gpus_total}`,
        "free GPUs"
      )}

      ${summaryCard(
        "Running",
        summary.profiles_running,
        "profiles"
      )}

      ${summaryCard(
        "Operations",
        summary.operations_running,
        "currently running"
      )}

      ${summaryCard(
        "Gateway",
        summary.gateway_healthy
          ? "Healthy"
          : "Unavailable",
        "LiteLLM"
      )}

    </div>


    <section class="section">

      <h2 class="section-title">
        Workers
      </h2>

      <div class="grid-2">

        ${
          data.workers
            .filter(
              worker =>
                worker.role
                === "inference"
            )
            .map(
              renderWorkerCard
            )
            .join("")
        }

      </div>

    </section>


    <section class="section">

      <h2 class="section-title">
        Running profiles
      </h2>

      ${
        renderRunningProfiles(
          data.running_profiles
        )
      }

    </section>


    <section class="section">

      <h2 class="section-title">
        Recent operations
      </h2>

      ${
        renderOperationTable(
          data.recent_operations
        )
      }

    </section>
  `;


  bindMachinePhotoFallbacks();
}


function summaryCard(
  label,
  value,
  detail,
) {

  return `
    <div class="summary-item">

      <div class="summary-label">
        ${escapeHtml(label)}
      </div>

      <div class="summary-value">
        ${escapeHtml(value)}
      </div>

      <div class="summary-detail">
        ${escapeHtml(detail)}
      </div>

    </div>
  `;
}


/* ============================================================
   WORKERS
   ============================================================ */

async function renderWorkers() {

  const data =
    await loadDashboard();


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Workers
        </h1>

        <p class="page-description">
          Current host, GPU and runtime state
        </p>

      </div>

    </div>


    <section class="section">

      <h2 class="section-title">
        Control plane
      </h2>

      <div class="grid-2">

        ${
          data.workers
            .filter(
              worker =>
                worker.role
                === "control_plane"
            )
            .map(
              renderWorkerCard
            )
            .join("")
        }

      </div>

    </section>


    <section class="section">

      <h2 class="section-title">
        Inference workers
      </h2>

      <div class="grid-2">

        ${
          data.workers
            .filter(
              worker =>
                worker.role
                === "inference"
            )
            .map(
              renderWorkerCard
            )
            .join("")
        }

      </div>

    </section>
  `;


  bindMachinePhotoFallbacks();
}


function renderWorkerCard(worker) {

  const system =
    worker.system
    || {};


  const disk =
    system.model_disk
    || {};


  const memoryPercent =
    (
      system.memory_used_mib
      &&
      system.memory_total_mib
    )
      ? Math.round(
          (
            system.memory_used_mib
            /
            system.memory_total_mib
          )
          * 100
        )
      : null;


  return `
    <article class="card worker-card">

      <div class="worker-top">

        <div class="machine-media">

          <img
            class="machine-photo"
            src="${window.SECURAS_DEMO_PHOTOS?.[worker.name] || ""}"
            alt=""
          >

          <div class="machine-placeholder">
            ${escapeHtml(
              worker.name
                .replace(
                  "worker-",
                  ""
                )
                .slice(0, 1)
                .toUpperCase()
            )}
          </div>

        </div>


        <div class="worker-info">

          <div
            style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px
            "
          >

            <div>

              <div class="worker-name">
                ${escapeHtml(
                  worker.name
                )}
              </div>

              <div class="worker-address">
                ${escapeHtml(
                  worker.cluster_ip
                  || "local"
                )}
                ·
                ${escapeHtml(
                  worker.role
                )}
              </div>

            </div>

            ${statusBadge(
              worker.state,
              stateTone(
                worker.state
              )
            )}

          </div>


          <div class="worker-metrics">

            <div>

              <div class="metric-label">
                Load
              </div>

              <div class="metric-value">
                ${formatNumber(
                  system.load1
                    ?.toFixed?.(2)
                )}
              </div>

            </div>


            <div>

              <div class="metric-label">
                RAM
              </div>

              <div class="metric-value">
                ${
                  memoryPercent == null
                    ? "—"
                    : `${memoryPercent}%`
                }
              </div>

            </div>


            <div>

              <div class="metric-label">
                Model disk free
              </div>

              <div class="metric-value">
                ${formatBytes(
                  disk.available_bytes
                )}
              </div>

            </div>

          </div>

        </div>

      </div>


      ${
        worker.gpus.length
          ? `
            <div class="gpu-list">

              ${
                worker.gpus
                  .map(
                    renderGpuRow
                  )
                  .join("")
              }

            </div>
          `
          : `
            <div class="empty">
              ${
                worker.reachable
                  ? "No GPUs reported"
                  : escapeHtml(
                      worker.error
                      || "Host unreachable"
                    )
              }
            </div>
          `
      }

    </article>
  `;
}


function renderGpuRow(gpu) {

  const utilization =
    gpu.utilization_percent
    ?? 0;


  return `
    <div class="gpu-row">

      <div>

        <div class="gpu-name">
          GPU ${escapeHtml(
            gpu.index
          )}
        </div>

        <div class="muted small">
          ${escapeHtml(
            gpu.name
          )}
        </div>

      </div>


      <div>

        ${
          gpu.allocated
            ? statusBadge(
                "allocated",
                "blue"
              )
            : statusBadge(
                "free",
                "green"
              )
        }

        ${
          gpu.profile
            ? `
              <div
                class="muted small"
                style="margin-top:4px"
              >
                ${escapeHtml(
                  gpu.profile
                )}
              </div>
            `
            : ""
        }

      </div>


      <div>

        ${formatMiB(
          gpu.memory_used_mib,
          gpu.memory_total_mib
        )}

        <div class="bar">

          <span
            style="width:${
              gpu.memory_total_mib
                ? Math.min(
                    100,
                    (
                      gpu.memory_used_mib
                      /
                      gpu.memory_total_mib
                    )
                    * 100
                  )
                : 0
            }%"
          ></span>

        </div>

      </div>


      <div>
        ${formatNumber(
          utilization,
          "%"
        )}
      </div>


      <div>
        ${formatNumber(
          gpu.temperature_c,
          "°C"
        )}
      </div>

    </div>
  `;
}


function bindMachinePhotoFallbacks() {

  document
    .querySelectorAll(
      ".machine-photo"
    )
    .forEach(
      image => {

        const markMissing =
          () => {

            image.classList.add(
              "missing"
            );
          };


        /*
         * Cached failures may already be complete before
         * the event listener is attached.
         */
        if (
          image.complete
          &&
          image.naturalWidth === 0
        ) {

          markMissing();

          return;
        }


        image.addEventListener(
          "error",
          markMissing,
          {
            once: true,
          },
        );
      }
    );
}


/* ============================================================
   RUNNING PROFILES
   ============================================================ */

function renderRunningProfiles(
  profiles,
) {

  if (!profiles.length) {

    return `
      <div class="card empty">
        No inference profiles are running.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Profile</th>
            <th>Model</th>
            <th>Worker</th>
            <th>GPUs</th>
            <th>Runtime</th>
            <th>Health</th>
            <th>Gateway</th>
          </tr>

        </thead>

        <tbody>

          ${
            profiles
              .map(
                profile => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        profile.name
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        profile.model
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        profile.worker
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        profile.gpus
                          .join(", ")
                      )}
                    </td>

                    <td>
                      ${statusBadge(
                        profile.runtime,
                        stateTone(
                          profile.runtime
                        )
                      )}
                    </td>

                    <td>
                      ${statusBadge(
                        profile.health,
                        stateTone(
                          profile.health
                        )
                      )}
                    </td>

                    <td>
                      ${statusBadge(
                        profile.gateway,
                        stateTone(
                          profile.gateway
                        )
                      )}
                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


/* ============================================================
   MODELS
   ============================================================ */

async function renderModels() {

  const [
    models,
    dashboard,
  ] = await Promise.all([
    api(
      "/api/v1/admin/models"
    ),
    loadDashboard(),
  ]);


  state.models =
    models.models;


  const inferenceWorkers =
    dashboard.workers
      .filter(
        worker =>
          worker.role
          === "inference"
      );


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Models
        </h1>

        <p class="page-description">
          Catalog and artifact state across workers
        </p>

      </div>

      <div class="page-actions">

        <button
          class="button button-primary"
          data-action="create-model"
        >
          New model
        </button>

      </div>

    </div>


    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>Model</th>
            <th>Revision</th>
            <th>State</th>

            ${
              inferenceWorkers
                .map(
                  worker =>
                    `<th>${
                      escapeHtml(
                        worker.name
                      )
                    }</th>`
                )
                .join("")
            }

            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          ${
            state.models
              .map(
                model =>
                  renderModelRow(
                    model,
                    inferenceWorkers
                  )
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function artifactFor(
  worker,
  model,
) {

  return (
    worker.artifacts
      ?.find(
        artifact =>
          Number(
            artifact.model_id
          )
          ===
          Number(
            model.id
          )
      )
  );
}


function modelArtifactView(
  worker,
  model,
) {

  /*
   * Worker reachability takes precedence over artifact state.
   *
   * Artifact state is collected remotely and may be absent or
   * stale when a worker cannot currently be inspected.
   */
  if (
    worker.reachable
    === false
  ) {

    return {
      status:
        "unreachable",

      label:
        "Unreachable",

      tone:
        "red",

      detail:
        "worker unavailable",
    };
  }


  const artifact =
    artifactFor(
      worker,
      model
    );


  if (!artifact) {

    return {
      status:
        "unknown",

      label:
        "Unknown",

      tone:
        "neutral",

      detail:
        "no artifact data",
    };
  }


  switch (
    artifact.status
  ) {

    case "installed":

      return {
        status:
          "installed",

        label:
          "Installed",

        tone:
          "green",

        detail:
          "verified",
      };


    case "missing":

      return {
        status:
          "missing",

        label:
          "Missing",

        tone:
          "neutral",

        detail:
          "not installed",
      };


    case "mismatch":

      return {
        status:
          "mismatch",

        label:
          "Mismatch",

        tone:
          "amber",

        detail:
          "inspect required",
      };


    case "unverified":

      return {
        status:
          "unverified",

        label:
          "Unverified",

        tone:
          "amber",

        detail:
          "marker missing",
      };


    default:

      return {
        status:
          "unknown",

        label:
          "Unknown",

        tone:
          "neutral",

        detail:
          "unknown artifact state",
      };
  }
}


function renderModelRow(
  model,
  workers,
) {

  const workerStates =
    workers.map(
      worker => ({
        worker,

        artifact:
          modelArtifactView(
            worker,
            model
          ),
      })
    );


  const installedWorkers =
    workerStates.filter(
      item =>
        item.artifact.status
        === "installed"
    );


  const missingWorkers =
    workerStates.filter(
      item =>
        item.artifact.status
        === "missing"
    );


  const canInstall =
    model.enabled
    &&
    missingWorkers.length > 0;


  const canCopy =
    model.enabled
    &&
    installedWorkers.length > 0
    &&
    missingWorkers.length > 0;


  const canCreateProfile =
    model.enabled
    &&
    installedWorkers.length > 0;


  return `
    <tr>

      <td>

        <div class="table-primary">
          ${escapeHtml(
            model.display_name
            || model.name
          )}
        </div>

        <div class="table-secondary">
          ${escapeHtml(
            model.source_ref
          )}
        </div>

      </td>


      <td class="mono">
        ${escapeHtml(
          model.revision
            ?.slice(
              0,
              10
            )
          || "—"
        )}
      </td>


      <td>
        ${statusBadge(
          model.enabled
            ? "enabled"
            : "disabled",

          model.enabled
            ? "green"
            : "red"
        )}
      </td>


      ${
        workers
          .map(
            worker => {

              const view =
                modelArtifactView(
                  worker,
                  model
                );


              return `
                <td>

                  ${statusBadge(
                    view.label,
                    view.tone
                  )}

                  <div class="table-secondary">
                    ${escapeHtml(
                      view.detail
                    )}
                  </div>

                </td>
              `;
            }
          )
          .join("")
      }


      <td>

        <div class="row-actions">

          <button
            class="button button-small"
            data-action="model-upstream"
            data-id="${model.id}"
          >
            Check upstream
          </button>

          ${
            canInstall
              ? `
                <button
                  class="button button-small"
                  data-action="model-install"
                  data-id="${model.id}"
                >
                  Install
                </button>
              `
              : ""
          }


          ${
            canCopy
              ? `
                <button
                  class="button button-small"
                  data-action="model-copy"
                  data-id="${model.id}"
                >
                  Copy
                </button>
              `
              : ""
          }


          <button
            class="button button-small"
            data-action="profile-from-model"
            data-id="${model.id}"
            ${
              canCreateProfile
                ? ""
                : "disabled"
            }
            ${
              canCreateProfile
                ? ""
                : 'title="Model must be verified on at least one reachable worker"'
            }
          >
            Create profile
          </button>

          <button
            class="button button-small ${
              model.enabled
                ? "button-danger"
                : ""
            }"
            data-action="${
              model.enabled
                ? "model-disable"
                : "model-enable"
            }"
            data-id="${model.id}"
          >
            ${
              model.enabled
                ? "Disable"
                : "Enable"
            }
          </button>

        </div>

      </td>

    </tr>
  `;
}


/* ============================================================
   PROFILES
   ============================================================ */

async function loadProfilePageState() {

  const [
    profiles,
    models,
    hosts,
    gpus,
    dashboard,
  ] = await Promise.all([
    api(
      "/api/v1/admin/profiles"
    ),

    api(
      "/api/v1/admin/models"
    ),

    api(
      "/api/v1/admin/hosts"
    ),

    api(
      "/api/v1/admin/gpus"
    ),

    loadDashboard(),
  ]);


  state.profiles =
    profiles.profiles;

  state.models =
    models.models;

  state.hosts =
    hosts.hosts;

  state.gpus =
    gpus.gpus;


  return dashboard;
}


function currentProfileRuntimeMap() {

  return new Map(
    (
      state.dashboard
        ?.running_profiles
      || []
    )
      .map(
        profile => [
          profile.name,
          profile,
        ]
      )
  );
}


function filteredProfiles(
  runtimeMap,
) {

  const view =
    state.view.profiles;


  const search =
    view.search
      .trim()
      .toLowerCase();


  return state.profiles.filter(
    profile => {

      const running =
        runtimeMap.has(
          profile.name
        );


      if (
        search
        &&
        !(
          profile.name
            .toLowerCase()
            .includes(search)

          ||

          profile.model_name
            .toLowerCase()
            .includes(search)
        )
      ) {

        return false;
      }


      if (
        view.worker
        &&
        profile.host_name
        !== view.worker
      ) {

        return false;
      }


      if (
        view.modelId
        &&
        Number(
          profile.model_id
        )
        !==
        Number(
          view.modelId
        )
      ) {

        return false;
      }


      if (
        view.runtimeState
        === "running"
        &&
        !running
      ) {

        return false;
      }


      if (
        view.runtimeState
        === "stopped"
        &&
        running
      ) {

        return false;
      }


      return true;
    }
  );
}


function refreshProfileRows() {

  const table =
    document.querySelector(
      "#profile-table"
    );


  if (!table) {
    return;
  }


  const runtimeMap =
    currentProfileRuntimeMap();


  table.innerHTML =
    renderProfileTable(
      filteredProfiles(
        runtimeMap
      ),
      runtimeMap,
    );
}


async function refreshProfilesLive() {

  await loadProfilePageState();


  if (
    state.page
    !== "profiles"
  ) {

    return;
  }


  refreshProfileRows();
}


async function renderProfiles() {

  await loadProfilePageState();


  const runtimeMap =
    currentProfileRuntimeMap();


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Profiles
        </h1>

        <p class="page-description">
          Runtime identities and GPU placement
        </p>

      </div>

      <button
        class="button button-primary"
        data-action="create-profile"
      >
        New profile
      </button>

    </div>


    <div class="filters">

      <input
        id="profile-search"
        placeholder="Search profiles"
      >

      <select id="profile-state-filter">

        <option value="">
          All states
        </option>

        <option value="running">
          Running
        </option>

        <option value="stopped">
          Stopped
        </option>

      </select>


      <select id="profile-worker-filter">

        <option value="">
          All workers
        </option>

        ${
          state.hosts
            .filter(
              host =>
                host.role
                === "inference"
            )
            .map(
              host => `
                <option
                  value="${escapeHtml(
                    host.name
                  )}"
                >
                  ${escapeHtml(
                    host.name
                  )}
                </option>
              `
            )
            .join("")
        }

      </select>


      <select id="profile-model-filter">

        <option value="">
          All models
        </option>

        ${
          state.models
            .map(
              model => `
                <option
                  value="${escapeHtml(
                    model.id
                  )}"
                >
                  ${escapeHtml(
                    model.name
                  )}
                </option>
              `
            )
            .join("")
        }

      </select>

    </div>


    <div id="profile-table">

      ${renderProfileTable(
        filteredProfiles(
          runtimeMap
        ),
        runtimeMap,
      )}

    </div>
  `;


  const searchInput =
    document.querySelector(
      "#profile-search"
    );


  const stateFilter =
    document.querySelector(
      "#profile-state-filter"
    );


  const workerFilter =
    document.querySelector(
      "#profile-worker-filter"
    );


  const modelFilter =
    document.querySelector(
      "#profile-model-filter"
    );


  searchInput.value =
    state.view.profiles.search;


  stateFilter.value =
    state.view.profiles
      .runtimeState;


  workerFilter.value =
    state.view.profiles.worker;


  modelFilter.value =
    state.view.profiles.modelId;


  const updateFilters =
    () => {

      state.view.profiles.search =
        searchInput.value;


      state.view.profiles.runtimeState =
        stateFilter.value;


      state.view.profiles.worker =
        workerFilter.value;


      state.view.profiles.modelId =
        modelFilter.value;


      replaceCurrentViewRoute();

      refreshProfileRows();
    };


  searchInput.addEventListener(
    "input",
    updateFilters
  );


  stateFilter.addEventListener(
    "change",
    updateFilters
  );


  workerFilter.addEventListener(
    "change",
    updateFilters
  );


  modelFilter.addEventListener(
    "change",
    updateFilters
  );
}


function renderProfileTable(
  profiles,
  runtimeMap,
) {

  if (!profiles.length) {

    return `
      <div class="card empty">
        No profiles match the current filters.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Profile</th>
            <th>Model</th>
            <th>State</th>
            <th>Worker</th>
            <th>GPUs</th>
            <th>TP / PP</th>
            <th>Context</th>
            <th>Memory</th>
            <th>Runtime</th>
            <th>Gateway</th>
            <th>Actions</th>
          </tr>

        </thead>

        <tbody>

          ${
            profiles
              .map(
                profile => {

                  const live =
                    runtimeMap.get(
                      profile.name
                    );


                  const running =
                    Boolean(live);


                  const model =
                    state.models.find(
                      item =>
                        Number(item.id)
                        ===
                        Number(
                          profile.model_id
                        )
                    );


                  const modelEnabled =
                    model
                      ? model.enabled
                      : true;


                  const callable =
                    profile.enabled
                    &&
                    modelEnabled;


                  let catalogState =
                    statusBadge(
                      "enabled",
                      "green"
                    );


                  if (!profile.enabled) {

                    catalogState =
                      statusBadge(
                        "disabled",
                        "red"
                      );

                  } else if (!modelEnabled) {

                    catalogState =
                      statusBadge(
                        "model disabled",
                        "amber"
                      );
                  }


                  return `
                    <tr>

                      <td>

                        <div class="table-primary">
                          ${escapeHtml(
                            profile.name
                          )}
                        </div>

                        <div class="table-secondary">
                          port
                          ${escapeHtml(
                            profile.host_port
                          )}
                        </div>

                      </td>


                      <td>
                        ${escapeHtml(
                          profile.model_name
                        )}
                      </td>


                      <td>
                        ${catalogState}
                      </td>


                      <td>
                        ${escapeHtml(
                          profile.host_name
                        )}
                      </td>


                      <td>
                        ${
                          profile.gpus
                            .map(
                              gpu =>
                                gpu.host_index
                            )
                            .join(", ")
                        }
                      </td>


                      <td>
                        ${
                          profile.tensor_parallel_size
                        }
                        /
                        ${
                          profile.pipeline_parallel_size
                        }
                      </td>


                      <td>
                        ${
                          profile.max_model_len
                          ?? "—"
                        }
                      </td>


                      <td>
                        ${
                          Math.round(
                            profile
                              .gpu_memory_utilization
                            * 100
                          )
                        }%
                      </td>


                      <td>
                        ${
                          running
                            ? statusBadge(
                                live.runtime,
                                stateTone(
                                  live.runtime
                                )
                              )
                            : statusBadge(
                                "stopped",
                                "neutral"
                              )
                        }
                      </td>


                      <td>
                        ${
                          running
                            ? statusBadge(
                                live.gateway,
                                stateTone(
                                  live.gateway
                                )
                              )
                            : "—"
                        }
                      </td>


                      <td>

                        <div class="row-actions">

                          <button
                            class="button button-small"
                            data-action="profile-edit"
                            data-id="${profile.id}"
                            ${
                              running
                                ? "disabled"
                                : ""
                            }
                          >
                            Edit
                          </button>


                          <button
                            class="button button-small"
                            data-action="profile-check"
                            data-id="${profile.id}"
                            ${
                              running
                              ||
                              !callable
                                ? "disabled"
                                : ""
                            }
                          >
                            Check
                          </button>


                          <button
                            class="button button-small"
                            data-action="profile-up"
                            data-id="${profile.id}"
                            ${
                              running
                              ||
                              !callable
                                ? "disabled"
                                : ""
                            }
                          >
                            Up
                          </button>


                          <button
                            class="button button-small button-danger"
                            data-action="profile-down"
                            data-id="${profile.id}"
                          >
                            Down
                          </button>


                          <button
                            class="button button-small ${
                              profile.enabled
                                ? "button-danger"
                                : ""
                            }"
                            data-action="${
                              profile.enabled
                                ? "profile-disable"
                                : "profile-enable"
                            }"
                            data-id="${profile.id}"
                            ${
                              running
                                ? "disabled"
                                : ""
                            }
                          >
                            ${
                              profile.enabled
                                ? "Disable"
                                : "Enable"
                            }
                          </button>

                        </div>

                      </td>

                    </tr>
                  `;
                }
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


/* ============================================================
   PROFILE RUNTIME OPTIONS
   ============================================================ */

const PROFILE_RUNTIME_KEYS = new Set([
  "enable_auto_tool_choice",
  "tool_call_parser",
  "reasoning_parser",
  "generation_config",
]);


function prettyRuntimeJson(
  value,
) {

  return JSON.stringify(
    value || {},
    null,
    2,
  );
}


function parseProfileRuntimeOptions(
  value,
) {

  let parsed;


  try {

    parsed = JSON.parse(
      String(
        value || "{}"
      )
    );

  } catch {

    throw new Error(
      "Runtime overrides contain invalid JSON."
    );
  }


  if (
    parsed === null
    ||
    Array.isArray(parsed)
    ||
    typeof parsed !== "object"
  ) {

    throw new Error(
      "Runtime overrides must be a JSON object."
    );
  }


  const unknown =
    Object.keys(parsed)
      .filter(
        key =>
          !PROFILE_RUNTIME_KEYS.has(
            key
          )
      );


  if (unknown.length) {

    throw new Error(
      `Unsupported runtime option: ${
        unknown.join(", ")
      }. Use ? Profile help for supported options.`
    );
  }


  if (
    "enable_auto_tool_choice"
    in parsed
    &&
    typeof parsed.enable_auto_tool_choice
    !== "boolean"
  ) {

    throw new Error(
      "enable_auto_tool_choice must be true or false."
    );
  }


  for (
    const key
    of [
      "tool_call_parser",
      "reasoning_parser",
    ]
  ) {

    if (!(key in parsed)) {
      continue;
    }


    if (
      typeof parsed[key]
      !== "string"
      ||
      !/^[A-Za-z0-9_.-]{1,80}$/.test(
        parsed[key]
      )
    ) {

      throw new Error(
        `${key} contains an invalid parser name.`
      );
    }
  }


  if (
    "generation_config"
    in parsed
    &&
    parsed.generation_config
    !== "vllm"
  ) {

    throw new Error(
      'generation_config currently supports only "vllm".'
    );
  }


  return parsed;
}


function effectiveRuntimeOptions(
  modelOptions,
  profileOptions,
) {

  return {
    ...(modelOptions || {}),
    ...(profileOptions || {}),
  };
}


function profileHelpHtml(
  prefix,
) {

  return `
    <div
      id="${prefix}-profile-help"
      class="profile-help"
      hidden
    >

      <div class="table-primary">
        Profile configuration guide
      </div>

      <p class="table-secondary">
        A profile describes where a pinned model runs and
        how vLLM uses the selected resources. Creating or
        editing a profile changes desired configuration only.
      </p>


      <div class="profile-help-grid">

        <section class="profile-help-section">

          <div class="table-primary">
            Identity & placement
          </div>

          <p>
            <code>Profile name</code> —
            stable deployment identity exposed through
            LiteLLM. Immutable after creation.
          </p>

          <p>
            <code>Model</code> —
            pinned catalog model. Immutable after profile
            creation.
          </p>

          <p>
            <code>Worker</code> —
            inference host that will run vLLM.
          </p>

          <p>
            <code>Host port</code> —
            internal worker port assigned to this profile.
          </p>

          <p>
            <code>GPUs</code> —
            GPUs reserved for this deployment.
          </p>

        </section>


        <section class="profile-help-section">

          <div class="table-primary">
            Parallelism & execution
          </div>

          <p>
            <code>TP</code> —
            tensor-parallel degree.
          </p>

          <p>
            <code>PP</code> —
            pipeline-parallel degree.
          </p>

          <p>
            In the current Securas profile model:
            <strong>TP × PP must equal selected GPU count.</strong>
          </p>

          <p>
            <code>Executor</code> —
            currently <code>mp</code>, local
            multiprocessing on one worker.
          </p>

          <p>
            <code>dtype</code> —
            datatype requested from vLLM.
            <code>auto</code> lets model/vLLM metadata
            select the supported type.
          </p>

        </section>


        <section class="profile-help-section">

          <div class="table-primary">
            Capacity & scheduling
          </div>

          <p>
            <code>GPU memory utilization</code> —
            fraction of each selected GPU vLLM may use.
          </p>

          <p>
            <code>Max context length</code> —
            maximum sequence length. Larger context
            increases KV-cache pressure.
          </p>

          <p>
            <code>Max batched tokens</code> —
            scheduler token budget for batched work.
          </p>

          <p>
            <code>Max sequences</code> —
            maximum concurrently scheduled sequences.
          </p>

        </section>


        <section class="profile-help-section">

          <div class="table-primary">
            Optimizations & runtime
          </div>

          <p>
            <code>Prefix caching</code> —
            reuse work for repeated prompt prefixes.
          </p>

          <p>
            <code>Chunked prefill</code> —
            schedule long prefills in chunks.
          </p>

          <p>
            <code>Model runtime defaults</code> —
            inherited automatically from the model.
          </p>

          <p>
            <code>Profile runtime overrides</code> —
            only intentional profile-specific differences.
          </p>

          <p>
            <code>Effective runtime for next UP</code> —
            model defaults merged with profile overrides.
            Profile values win on duplicate keys.
          </p>

        </section>

      </div>


      <div class="profile-help-runtime">

        <div class="table-primary">
          Supported runtime override keys
        </div>

        <pre class="runtime-json">{
  "enable_auto_tool_choice": true,
  "tool_call_parser": "openai",
  "reasoning_parser": "qwen3",
  "generation_config": "vllm"
}</pre>

        <p class="table-secondary">
          TP, PP, GPUs, dtype, memory utilization,
          context, batching, sequence limits, caching and
          distributed_executor_backend are structured
          profile fields and must not be placed in this JSON.
        </p>

      </div>


      <div class="profile-help-note">
        The assistant is advisory only. Review its proposal
        before changing or saving the profile. Securas
        remains the authoritative validator.
      </div>


      <div class="profile-help-actions">

        <button
          type="button"
          id="${prefix}-copy-profile-prompt"
          class="button button-small"
        >
          Copy configuration prompt
        </button>

      </div>

    </div>
  `;
}


function profileAssistantPrompt({
  mode,
  form,
  model,
  hosts,
  gpus,
  profileName = null,
}) {

  const data =
    new FormData(
      form
    );


  const numberOrNull =
    value => {

      if (
        value === null
        ||
        value === ""
      ) {
        return null;
      }


      const parsed =
        Number(value);


      return Number.isFinite(parsed)
        ? parsed
        : null;
    };


  const hostId =
    numberOrNull(
      data.get("host_id")
    );


  const host =
    (hosts || []).find(
      item =>
        Number(item.id)
        ===
        Number(hostId)
    )
    || null;


  const selectedGpuIds =
    data
      .getAll("gpu_ids")
      .map(Number);


  const workerGpus =
    (gpus || []).filter(
      gpu =>
        Number(gpu.host_id)
        ===
        Number(hostId)
        &&
        gpu.enabled
    );


  const availableGpus =
    workerGpus.map(
      gpu => ({
        host_index:
          gpu.host_index,

        name:
          gpu.name,
      })
    );


  const selectedGpus =
    workerGpus
      .filter(
        gpu =>
          selectedGpuIds.includes(
            Number(gpu.id)
          )
      )
      .map(
        gpu => ({
          host_index:
            gpu.host_index,

          name:
            gpu.name,
        })
      );


  const runtimeRaw =
    form.querySelector(
      '[name="runtime_options"]'
    )?.value
    || "{}";


  let runtimeOverrides = {};

  let runtimeError = null;


  try {

    runtimeOverrides =
      parseProfileRuntimeOptions(
        runtimeRaw
      );

  } catch (error) {

    runtimeError =
      error.message;
  }


  const modelDefaults =
    model?.runtime_options
    || {};


  const snapshot = {

    mode,

    profile_name:
      profileName
      ||
      String(
        data.get("name")
        || ""
      ),

    model: {

      name:
        model?.name
        || null,

      repository:
        model?.source_ref
        || null,

      revision:
        model?.revision
        || null,

      runtime_defaults:
        modelDefaults,
    },

    placement: {

      worker:
        host?.name
        || null,

      host_port:
        numberOrNull(
          data.get(
            "host_port"
          )
        ),

      available_gpus:
        availableGpus,

      selected_gpus:
        selectedGpus,
    },

    execution: {

      tensor_parallel_size:
        numberOrNull(
          data.get("tp")
        ),

      pipeline_parallel_size:
        numberOrNull(
          data.get("pp")
        ),

      distributed_executor_backend:
        data.get(
          "distributed_executor_backend"
        )
        || "mp",

      dtype:
        data.get("dtype")
        || "auto",
    },

    capacity: {

      gpu_memory_utilization:
        numberOrNull(
          data.get(
            "gpu_memory_utilization"
          )
        ),

      max_model_len:
        numberOrNull(
          data.get(
            "max_model_len"
          )
        ),

      max_num_batched_tokens:
        numberOrNull(
          data.get(
            "max_num_batched_tokens"
          )
        ),

      max_num_seqs:
        numberOrNull(
          data.get(
            "max_num_seqs"
          )
        ),
    },

    optimizations: {

      enable_prefix_caching:
        data.has("prefix"),

      enable_chunked_prefill:
        data.has("chunked"),
    },

    runtime_options:
      runtimeError
        ? {
            raw:
              runtimeRaw,

            error:
              runtimeError,
          }
        : runtimeOverrides,

    effective_runtime_options:
      runtimeError
        ? null
        : effectiveRuntimeOptions(
            modelDefaults,
            runtimeOverrides,
          ),
  };


  return [

    "Review this Securas vLLM deployment profile.",

    "",

    "The administrator remains responsible for the final configuration.",

    "Do not assume hardware or Securas options that are not shown.",

    "",

    "Current profile draft:",

    JSON.stringify(
      snapshot,
      null,
      2,
    ),

    "",

    "Securas rules:",

    "- one profile runs on one selected worker",

    "- TP × PP must equal the number of selected GPUs",

    "- distributed_executor_backend currently supports only mp",

    "- model runtime defaults are inherited automatically",

    "- profile runtime_options contain overrides only",

    "- profile overrides win on duplicate runtime keys",

    "- allowed runtime_options keys: enable_auto_tool_choice, tool_call_parser, reasoning_parser, generation_config",

    '- generation_config currently supports only "vllm"',

    "- structured profile fields must not be moved into runtime_options",

    "- do not propose model installation, profile UP/DOWN or LiteLLM changes here",

    "",

    "Review:",

    "- GPU placement consistency",

    "- TP/PP suitability",

    "- memory safety",

    "- context and KV-cache pressure",

    "- batching and concurrency",

    "- parser/tool compatibility",

    "- unnecessary runtime overrides",

    "",

    "Return ONE JSON object containing:",

    '- "recommended_profile": supported profile field recommendations',

    '- "runtime_options": the smallest required override object',

    '- "warnings": an array of warnings',

    '- "notes": short reasons for important recommendations',

    "",

    "Do not return shell commands.",

    "Do not invent unsupported Securas fields.",

    mode === "edit"
      ? "Do not propose changing the immutable profile name or model."
      : "Recommend a clear stable profile name if useful.",

  ].join(
    "\n"
  );
}


/* ============================================================
   PROFILE CREATION
   ============================================================ */

async function openProfileCreate(
  preselectedModelId = null,
) {

  if (
    !state.models.length
    ||
    !state.hosts.length
    ||
    !state.gpus.length
  ) {

    const [
      models,
      hosts,
      gpus,
    ] = await Promise.all([
      api(
        "/api/v1/admin/models"
      ),
      api(
        "/api/v1/admin/hosts"
      ),
      api(
        "/api/v1/admin/gpus"
      ),
    ]);


    state.models =
      models.models;

    state.hosts =
      hosts.hosts;

    state.gpus =
      gpus.gpus;
  }


  const dashboard =
    await loadDashboard();


  const inferenceHosts =
    state.hosts.filter(
      host =>
        host.role
        === "inference"
        &&
        host.enabled
    );


  const workerForHost =
    hostId =>
      dashboard.workers.find(
        worker =>
          Number(
            worker.id
          )
          ===
          Number(
            hostId
          )
      );


  const modelInstalledOnHost =
    (
      model,
      hostId,
    ) => {

      const worker =
        workerForHost(
          hostId
        );


      if (
        !worker
        ||
        worker.role
        !== "inference"
        ||
        worker.reachable
        !== true
      ) {

        return false;
      }


      return (
        modelArtifactView(
          worker,
          model
        ).status
        === "installed"
      );
    };


  const availableModels =
    state.models.filter(
      model =>
        model.enabled
        &&
        inferenceHosts.some(
          host =>
            modelInstalledOnHost(
              model,
              host.id
            )
        )
    );


  if (!availableModels.length) {

    showToast(
      "No enabled model has a verified installation on a reachable inference worker.",
      true
    );

    return;
  }


  if (
    preselectedModelId
    !== null
    &&
    !availableModels.some(
      model =>
        Number(
          model.id
        )
        ===
        Number(
          preselectedModelId
        )
    )
  ) {

    showToast(
      "This model is not currently verified on any reachable inference worker.",
      true
    );

    return;
  }


  const initialModelId =
    (
      preselectedModelId
      !== null
    )
      ? Number(
          preselectedModelId
        )
      : Number(
          availableModels[0].id
        );


  const eligibleHostsForModel =
    modelId => {

      const model =
        availableModels.find(
          item =>
            Number(
              item.id
            )
            ===
            Number(
              modelId
            )
        );


      if (!model) {

        return [];
      }


      return inferenceHosts.filter(
        host =>
          modelInstalledOnHost(
            model,
            host.id
          )
      );
    };


  const initialHosts =
    eligibleHostsForModel(
      initialModelId
    );


  openModal(
    "Create profile",
    `
      <form id="profile-create-form">

        <div class="form-grid">

          <div class="field field-full profile-help-toolbar">

            <div>

              <div class="table-primary">
                Deployment configuration
              </div>

              <div class="table-secondary">
                Configure placement, parallelism, capacity
                and model-specific runtime behavior.
              </div>

            </div>

            <button
              type="button"
              id="profile-create-help-button"
              class="button button-small button-quiet"
            >
              ? Profile help
            </button>

          </div>


          <div class="field field-full">

            ${profileHelpHtml(
              "profile-create"
            )}

          </div>


          <div class="field field-full">

            <label>
              Profile name
            </label>

            <input
              name="name"
              placeholder="qwen38-aero-2gpu-balanced"
              required
            >

          </div>


          <div class="field">

            <label>
              Model
            </label>

            <select
              name="model_id"
              id="profile-create-model"
              required
            >

              ${
                availableModels
                  .map(
                    model => `
                      <option
                        value="${model.id}"
                        ${
                          Number(
                            initialModelId
                          )
                          ===
                          Number(
                            model.id
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          model.display_name
                          || model.name
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>


          <div class="field">

            <label>
              Worker
            </label>

            <select
              name="host_id"
              id="profile-host"
              required
            >

              ${
                initialHosts
                  .map(
                    host => `
                      <option value="${host.id}">
                        ${escapeHtml(
                          host.name
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

            <div
              id="profile-create-placement-status"
              class="table-secondary"
            >
              Only reachable workers with a verified installation
              of the selected model are available.
            </div>

          </div>


          <div class="field">

            <label>
              Host port
            </label>

            <input
              name="host_port"
              type="number"
              min="1"
              max="65535"
              value="8001"
              required
            >

          </div>


          <div class="field">

            <label>
              GPU memory utilization
            </label>

            <input
              name="gpu_memory_utilization"
              type="number"
              min="0.1"
              max="0.90"
              step="0.01"
              value="0.90"
              required
            >

          </div>


          <div class="field field-full">

            <label>
              GPUs
            </label>

            <div
              id="profile-gpus"
              class="checkbox-grid"
            ></div>

          </div>


          <div class="field">

            <label>
              Tensor parallel
            </label>

            <input
              name="tp"
              type="number"
              min="1"
              value="1"
              required
            >

          </div>


          <div class="field">

            <label>
              Pipeline parallel
            </label>

            <input
              name="pp"
              type="number"
              min="1"
              value="1"
              required
            >

          </div>


          <div class="field">

            <label>
              Max context length
            </label>

            <input
              name="max_model_len"
              type="number"
              min="1"
              value="16384"
            >

          </div>


          <div class="field">

            <label>
              Max batched tokens
            </label>

            <input
              name="max_num_batched_tokens"
              type="number"
              min="1"
              value="8192"
            >

          </div>


          <div class="field">

            <label>
              Max sequences
            </label>

            <input
              name="max_num_seqs"
              type="number"
              min="1"
              value="16"
            >

          </div>


          <div class="field">

            <label>
              Data type
            </label>

            <select name="dtype">

              <option value="auto">
                auto
              </option>

              <option value="float16">
                float16
              </option>

              <option value="bfloat16">
                bfloat16
              </option>

            </select>

          </div>


          <div class="field">

            <label>
              Distributed executor backend
            </label>

            <select
              name="distributed_executor_backend"
              required
            >

              <option value="mp">
                mp
              </option>

            </select>

            <div class="table-secondary">
              Current controller supports local
              multiprocessing (mp) only.
            </div>

          </div>


          <div class="field field-full">

            <label class="checkbox-card">

              <input
                name="prefix"
                type="checkbox"
                checked
              >

              Enable prefix caching

            </label>

            <label
              class="checkbox-card"
              style="margin-top:8px"
            >

              <input
                name="chunked"
                type="checkbox"
                checked
              >

              Enable chunked prefill

            </label>

          </div>

          <div class="field field-full">

            <label>
              Model runtime defaults
            </label>

            <pre
              id="profile-create-model-runtime"
              class="runtime-json"
            ></pre>

          </div>


          <div class="field field-full">

            <label>
              Profile runtime overrides
            </label>

            <textarea
              id="profile-create-runtime-options"
              name="runtime_options"
              class="mono runtime-textarea"
              spellcheck="false"
            >{}</textarea>

            <div class="table-secondary">
              Optional. Model defaults are inherited automatically.
            </div>

          </div>


          <div class="field field-full">

            <label>
              Effective runtime for next UP
            </label>

            <pre
              id="profile-create-effective-runtime"
              class="runtime-json"
            ></pre>

            <div class="table-secondary">
              Read-only preview of the model-specific runtime
              options Securas will render on the next UP.
            </div>

          </div>


        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            id="profile-create-submit"
            type="submit"
            class="button button-primary"
          >
            Create profile
          </button>

        </div>

      </form>
    `,
  );


  const hostSelect =
    document.querySelector(
      "#profile-host"
    );


  const modelSelect =
    document.querySelector(
      "#profile-create-model"
    );


  const placementStatus =
    document.querySelector(
      "#profile-create-placement-status"
    );


  const submitButton =
    document.querySelector(
      "#profile-create-submit"
    );


  const renderGpus =
    () => {

      const hostId =
        Number(
          hostSelect.value
        );


      const hostGpus =
        state.gpus.filter(
          gpu =>
            Number(
              gpu.host_id
            )
            === hostId
            &&
            gpu.enabled
        );


      document
        .querySelector(
          "#profile-gpus"
        )
        .innerHTML =
          hostGpus.length
            ? hostGpus
                .map(
                  gpu => `
                    <label class="checkbox-card">

                      <input
                        type="checkbox"
                        name="gpu_ids"
                        value="${gpu.id}"
                      >

                      <span>

                        GPU
                        ${escapeHtml(
                          gpu.host_index
                        )}

                        <span class="muted">
                          ${escapeHtml(
                            gpu.name
                          )}
                        </span>

                      </span>

                    </label>
                  `
                )
                .join("")
            : `
                <div class="empty">
                  No enabled GPUs are available on this worker.
                </div>
              `;
    };


  const refreshPlacement =
    () => {

      const hosts =
        eligibleHostsForModel(
          Number(
            modelSelect.value
          )
        );


      hostSelect.innerHTML =
        hosts
          .map(
            host => `
              <option value="${host.id}">
                ${escapeHtml(
                  host.name
                )}
              </option>
            `
          )
          .join("");


      hostSelect.disabled =
        hosts.length === 0;


      submitButton.disabled =
        hosts.length === 0;


      if (!hosts.length) {

        placementStatus.textContent =
          "No reachable worker has a verified installation of this model.";

      } else {

        placementStatus.textContent =
          (
            hosts.length
            === 1
          )
            ? "1 verified worker is available for this model."
            : `${hosts.length} verified workers are available for this model.`;
      }


      renderGpus();
    };


  hostSelect.addEventListener(
    "change",
    renderGpus
  );


  refreshPlacement();


  const runtimeTextarea =
    document.querySelector(
      "#profile-create-runtime-options"
    );


  const defaultsView =
    document.querySelector(
      "#profile-create-model-runtime"
    );


  const effectiveView =
    document.querySelector(
      "#profile-create-effective-runtime"
    );


  const helpButton =
    document.querySelector(
      "#profile-create-help-button"
    );


  const helpPanel =
    document.querySelector(
      "#profile-create-profile-help"
    );


  const copyPrompt =
    document.querySelector(
      "#profile-create-copy-profile-prompt"
    );


  const selectedModel =
    () =>
      state.models.find(
        model =>
          Number(model.id)
          ===
          Number(
            modelSelect.value
          )
      );


  const refreshRuntimePreview =
    () => {

      const model =
        selectedModel();


      const defaults =
        model?.runtime_options
        || {};


      defaultsView.textContent =
        prettyRuntimeJson(
          defaults
        );


      try {

        const overrides =
          parseProfileRuntimeOptions(
            runtimeTextarea.value
          );


        effectiveView.textContent =
          prettyRuntimeJson(
            effectiveRuntimeOptions(
              defaults,
              overrides,
            )
          );


      } catch {

        effectiveView.textContent =
          "Invalid runtime JSON";
      }
    };


  modelSelect.addEventListener(
    "change",
    () => {

      refreshPlacement();

      refreshRuntimePreview();
    },
  );


  runtimeTextarea.addEventListener(
    "input",
    refreshRuntimePreview,
  );


  helpButton.addEventListener(
    "click",
    () => {

      helpPanel.hidden =
        !helpPanel.hidden;
    },
  );


  copyPrompt.addEventListener(
    "click",
    async () => {

      const model =
        selectedModel();


      const form =
        document.querySelector(
          "#profile-create-form"
        );


      await copyText(
        profileAssistantPrompt({
          mode: "create",
          form,
          model,
          hosts:
            eligibleHostsForModel(
              Number(
                modelSelect.value
              )
            ),
          gpus:
            state.gpus,
        })
      );


      showToast(
        "Profile configuration prompt copied."
      );
    },
  );


  refreshRuntimePreview();


  document
    .querySelector(
      "#profile-create-form"
    )
    .addEventListener(
      "submit",
      createProfile
    );
}


async function createProfile(
  event,
) {

  event.preventDefault();


  const form =
    new FormData(
      event.currentTarget
    );


  const gpuIds =
    form
      .getAll("gpu_ids")
      .map(Number);


  const tp =
    Number(
      form.get("tp")
    );


  const pp =
    Number(
      form.get("pp")
    );


  if (!gpuIds.length) {

    showToast(
      "Select at least one GPU.",
      true
    );

    return;
  }


  if (
    tp * pp
    !== gpuIds.length
  ) {

    showToast(
      "TP × PP must equal the number of selected GPUs.",
      true
    );

    return;
  }


  let runtimeOptions;


  try {

    runtimeOptions =
      parseProfileRuntimeOptions(
        form.get(
          "runtime_options"
        )
      );


  } catch (error) {

    showToast(
      error.message,
      true
    );

    return;
  }


  try {

    const profile = await api(
      "/api/v1/admin/profiles",
      {
        method: "POST",

        body: {
          name:
            form.get("name"),

          model_id:
            Number(
              form.get(
                "model_id"
              )
            ),

          host_id:
            Number(
              form.get(
                "host_id"
              )
            ),

          host_port:
            Number(
              form.get(
                "host_port"
              )
            ),

          gpu_ids:
            gpuIds,

          tensor_parallel_size:
            tp,

          pipeline_parallel_size:
            pp,

          distributed_executor_backend:
            form.get(
              "distributed_executor_backend"
            ),

          dtype:
            form.get("dtype"),

          gpu_memory_utilization:
            Number(
              form.get(
                "gpu_memory_utilization"
              )
            ),

          max_model_len:
            optionalNumber(
              form.get(
                "max_model_len"
              )
            ),

          max_num_batched_tokens:
            optionalNumber(
              form.get(
                "max_num_batched_tokens"
              )
            ),

          max_num_seqs:
            optionalNumber(
              form.get(
                "max_num_seqs"
              )
            ),

          enable_prefix_caching:
            form.has(
              "prefix"
            ),

          enable_chunked_prefill:
            form.has(
              "chunked"
            ),

          runtime_options:
            runtimeOptions,
        },
      },
    );


    closeModal();


    showToast(
      `Profile ${profile.name} created.`
    );


    await navigate(
      "profiles"
    );


  } catch (error) {

    showToast(
      error.message,
      true
    );
  }
}


function optionalNumber(value) {

  if (
    value === null
    ||
    value === ""
  ) {

    return null;
  }


  return Number(value);
}


/* ============================================================
   MODEL CREATION
   ============================================================ */

function openModelCreate() {

  openModal(
    "New model",
    `
      <form id="model-create-form">

        <div class="form-grid">

          <div class="field">

            <label>
              Internal name
            </label>

            <input
              name="name"
              placeholder="model-name"
              required
            >

          </div>


          <div class="field">

            <label>
              Display name
            </label>

            <input
              name="display_name"
            >

          </div>


          <div class="field field-full">

            <label>
              Hugging Face repository
            </label>

            <input
              name="source_ref"
              placeholder="Organization/model"
              required
            >

          </div>


          <div class="field field-full">

            <label>
              Exact revision SHA
            </label>

            <input
              name="revision"
              minlength="40"
              maxlength="40"
              class="mono"
              required
            >

          </div>


          <div class="field">

            <label>
              Tool call parser
            </label>

            <input
              name="tool_call_parser"
              placeholder="qwen3_coder"
            >

          </div>


          <div class="field">

            <label>
              Reasoning parser
            </label>

            <input
              name="reasoning_parser"
              placeholder="qwen3"
            >

          </div>


          <div class="field field-full">

            <label class="checkbox-card">

              <input
                name="auto_tools"
                type="checkbox"
              >

              Enable automatic tool choice

            </label>

          </div>


          <div class="field field-full">

            <label>
              Description
            </label>

            <textarea
              name="description"
            ></textarea>

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            class="button button-primary"
            type="submit"
          >
            Create model
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#model-create-form"
    )
    .addEventListener(
      "submit",
      createModel
    );
}


async function createModel(event) {

  event.preventDefault();


  const form =
    new FormData(
      event.currentTarget
    );


  const runtime = {
    generation_config:
      "vllm",
  };


  const tool =
    String(
      form.get(
        "tool_call_parser"
      )
      || ""
    ).trim();


  const reasoning =
    String(
      form.get(
        "reasoning_parser"
      )
      || ""
    ).trim();


  if (tool) {

    runtime.tool_call_parser =
      tool;
  }


  if (reasoning) {

    runtime.reasoning_parser =
      reasoning;
  }


  if (
    form.has(
      "auto_tools"
    )
  ) {

    runtime.enable_auto_tool_choice =
      true;
  }


  try {

    await api(
      "/api/v1/admin/models",
      {
        method: "POST",

        body: {
          name:
            form.get("name"),

          display_name:
            form.get("display_name")
            || null,

          description:
            form.get("description")
            || null,

          source_ref:
            form.get("source_ref"),

          revision:
            form.get("revision"),

          runtime_options:
            runtime,
        },
      },
    );


    closeModal();

    showToast(
      "Model added to catalog."
    );

    await navigate(
      "models"
    );


  } catch (error) {

    showToast(
      error.message,
      true
    );
  }
}


/* ============================================================
   CATALOG LIFECYCLE
   ============================================================ */

async function checkModelUpstream(
  modelId,
) {

  const model =
    state.models.find(
      item =>
        Number(
          item.id
        )
        ===
        Number(
          modelId
        )
    );


  if (!model) {

    throw new Error(
      "MODEL_NOT_FOUND"
    );
  }


  try {

    const result =
      await api(
        `/api/v1/admin/models/${modelId}/upstream`
      );


    const current =
      result.status
      === "current";


    openModal(
      `Upstream revision · ${
        escapeHtml(
          model.display_name
          || model.name
        )
      }`,
      `
        <div class="card">

          <div class="card-header">

            <div>

              <div class="card-title">
                Hugging Face revision
              </div>

              <div class="table-secondary">
                ${escapeHtml(
                  result.repository
                )}
              </div>

            </div>

            ${
              statusBadge(
                current
                  ? "Current"
                  : "New revision available",

                current
                  ? "green"
                  : "amber"
              )
            }

          </div>


          <div class="card-body">

            <div class="field">

              <label>
                Catalog pinned SHA
              </label>

              <code class="mono">
                ${escapeHtml(
                  result.pinned_revision
                )}
              </code>

            </div>


            <div class="field">

              <label>
                Hugging Face current SHA
              </label>

              <code class="mono">
                ${escapeHtml(
                  result.upstream_revision
                )}
              </code>

            </div>


            <div class="field">

              <label>
                Checked
              </label>

              <div>
                ${escapeHtml(
                  new Date(
                    result.checked_at
                  ).toLocaleString()
                )}
              </div>

            </div>


            ${
              current
                ? `
                  <div class="secret-warning">
                    The catalog revision matches the current
                    Hugging Face repository revision.
                  </div>
                `
                : `
                  <div class="secret-warning">
                    A newer or different upstream revision is
                    available. Nothing has been updated.
                  </div>
                `
            }


            <p class="page-description">
              This check is read-only. Securas did not change
              the catalog revision, worker files, model markers,
              profiles, or running inference.
            </p>

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-primary"
            data-action="close-modal"
          >
            Close
          </button>

        </div>
      `,
    );


  } catch (error) {

    showToast(
      `Upstream check failed: ${error.message}`,
      true
    );
  }
}


function catalogMutationToast(
  message,
  result,
) {

  const sync =
    result?.key_sync;


  if (
    sync
    &&
    sync.status
    &&
    sync.status !== "ok"
  ) {

    showToast(
      `${message} API-key synchronization: ${sync.status}.`,
      true
    );

    return;
  }


  showToast(
    message
  );
}


async function setModelEnabled(
  modelId,
  enabled,
) {

  const model =
    state.models.find(
      item =>
        Number(item.id)
        ===
        Number(modelId)
    );


  if (!model) {

    throw new Error(
      "MODEL_NOT_FOUND"
    );
  }


  if (
    !enabled
    &&
    !window.confirm(
      `Disable ${model.name}? All profiles using this model must already be down. This will not stop any runtime automatically.`
    )
  ) {

    return;
  }


  const result =
    await api(
      `/api/v1/admin/models/${modelId}/${
        enabled
          ? "enable"
          : "disable"
      }`,
      {
        method: "POST",
      },
    );


  catalogMutationToast(
    enabled
      ? `Model ${model.name} enabled.`
      : `Model ${model.name} disabled.`,
    result,
  );


  await renderModels();
}


async function setProfileEnabled(
  profileId,
  enabled,
) {

  const profile =
    state.profiles.find(
      item =>
        Number(item.id)
        ===
        Number(profileId)
    );


  if (!profile) {

    throw new Error(
      "PROFILE_NOT_FOUND"
    );
  }


  if (
    !enabled
    &&
    !window.confirm(
      `Disable ${profile.name}? The profile must already be down. This will not stop the runtime automatically.`
    )
  ) {

    return;
  }


  const result =
    await api(
      `/api/v1/admin/profiles/${profileId}/${
        enabled
          ? "enable"
          : "disable"
      }`,
      {
        method: "POST",
      },
    );


  catalogMutationToast(
    enabled
      ? `Profile ${profile.name} enabled.`
      : `Profile ${profile.name} disabled.`,
    result,
  );


  await renderProfiles();
}


/* ============================================================
   PROFILE EDIT
   ============================================================ */

async function openProfileEdit(
  profileId,
) {

  const [
    profile,
    hostsResponse,
    gpusResponse,
    dashboard,
  ] = await Promise.all([
    api(
      `/api/v1/admin/profiles/${profileId}`
    ),

    api(
      "/api/v1/admin/hosts"
    ),

    api(
      "/api/v1/admin/gpus"
    ),

    loadDashboard(),
  ]);


  const running =
    dashboard.running_profiles
      .some(
        item =>
          item.name
          ===
          profile.name
      );


  if (running) {

    showToast(
      "Profile must be down before editing.",
      true
    );

    return;
  }


  const hosts =
    hostsResponse.hosts
      .filter(
        host =>
          host.role
          === "inference"
          &&
          host.enabled
      );


  const gpus =
    gpusResponse.gpus;


  const selectedGpuIds =
    new Set(
      profile.gpus.map(
        gpu =>
          Number(gpu.id)
      )
    );


  const modelRuntime =
    profile.model_runtime_options
    || {};


  const profileRuntime =
    profile.profile_runtime_options
    ||
    profile.runtime_options
    ||
    {};


  const model =
    state.models.find(
      item =>
        Number(item.id)
        ===
        Number(
          profile.model_id
        )
    )
    || {
      id:
        profile.model_id,

      name:
        profile.model_name,

      display_name:
        profile.model_name,

      runtime_options:
        modelRuntime,
    };


  openModal(
    `Edit profile · ${profile.name}`,
    `
      <form id="profile-edit-form">

        <div class="form-grid">

          <div class="field field-full profile-help-toolbar">

            <div>

              <div class="table-primary">
                Deployment configuration
              </div>

              <div class="table-secondary">
                Editing changes desired configuration only.
                The profile must remain down while editing.
              </div>

            </div>

            <button
              type="button"
              id="profile-edit-help-button"
              class="button button-small button-quiet"
            >
              ? Profile help
            </button>

          </div>


          <div class="field field-full">

            ${profileHelpHtml(
              "profile-edit"
            )}

          </div>


          <div class="field">

            <label>
              Profile name
            </label>

            <input
              value="${escapeHtml(
                profile.name
              )}"
              disabled
            >

          </div>


          <div class="field">

            <label>
              Model
            </label>

            <input
              value="${escapeHtml(
                profile.model_name
              )}"
              disabled
            >

          </div>


          <div class="field">

            <label>
              Worker
            </label>

            <select
              name="host_id"
              id="profile-edit-host"
              required
            >

              ${
                hosts
                  .map(
                    host => `
                      <option
                        value="${host.id}"
                        ${
                          Number(host.id)
                          ===
                          Number(
                            profile.host_id
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          host.name
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>


          <div class="field">

            <label>
              Host port
            </label>

            <input
              name="host_port"
              type="number"
              min="1"
              max="65535"
              value="${escapeHtml(
                profile.host_port
              )}"
              required
            >

          </div>


          <div class="field">

            <label>
              GPU memory utilization
            </label>

            <input
              name="gpu_memory_utilization"
              type="number"
              min="0.01"
              max="1"
              step="0.01"
              value="${escapeHtml(
                profile.gpu_memory_utilization
              )}"
              required
            >

          </div>


          <div class="field">

            <label>
              Data type
            </label>

            <select
              name="dtype"
            >

              ${
                [
                  "auto",
                  "float16",
                  "bfloat16",
                ]
                  .map(
                    dtype => `
                      <option
                        value="${dtype}"
                        ${
                          profile.dtype
                          === dtype
                            ? "selected"
                            : ""
                        }
                      >
                        ${dtype}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>


          <div class="field">

            <label>
              Distributed executor backend
            </label>

            <select
              name="distributed_executor_backend"
              required
            >

              <option
                value="mp"
                ${
                  profile.distributed_executor_backend
                  === "mp"
                    ? "selected"
                    : ""
                }
              >
                mp
              </option>

            </select>

            <div class="table-secondary">
              Current controller supports local
              multiprocessing (mp) only.
            </div>

          </div>


          <div class="field field-full">

            <label>
              GPUs
            </label>

            <div
              id="profile-edit-gpus"
              class="checkbox-grid"
            ></div>

          </div>


          <div class="field">

            <label>
              Tensor parallel
            </label>

            <input
              name="tp"
              type="number"
              min="1"
              value="${escapeHtml(
                profile.tensor_parallel_size
              )}"
              required
            >

          </div>


          <div class="field">

            <label>
              Pipeline parallel
            </label>

            <input
              name="pp"
              type="number"
              min="1"
              value="${escapeHtml(
                profile.pipeline_parallel_size
              )}"
              required
            >

          </div>


          <div class="field">

            <label>
              Max context length
            </label>

            <input
              name="max_model_len"
              type="number"
              min="1"
              value="${escapeHtml(
                profile.max_model_len
                ?? ""
              )}"
            >

          </div>


          <div class="field">

            <label>
              Max batched tokens
            </label>

            <input
              name="max_num_batched_tokens"
              type="number"
              min="1"
              value="${escapeHtml(
                profile.max_num_batched_tokens
                ?? ""
              )}"
            >

          </div>


          <div class="field">

            <label>
              Max sequences
            </label>

            <input
              name="max_num_seqs"
              type="number"
              min="1"
              value="${escapeHtml(
                profile.max_num_seqs
                ?? ""
              )}"
            >

          </div>


          <div class="field field-full">

            <label class="checkbox-card">

              <input
                name="prefix"
                type="checkbox"
                ${
                  profile.enable_prefix_caching
                    ? "checked"
                    : ""
                }
              >

              Enable prefix caching

            </label>


            <label
              class="checkbox-card"
              style="margin-top:8px"
            >

              <input
                name="chunked"
                type="checkbox"
                ${
                  profile.enable_chunked_prefill
                    ? "checked"
                    : ""
                }
              >

              Enable chunked prefill

            </label>

          </div>


          <div class="field field-full">

            <label>
              Model runtime defaults
            </label>

            <pre
              id="profile-edit-model-runtime"
              class="runtime-json"
            >${escapeHtml(
              prettyRuntimeJson(
                modelRuntime
              )
            )}</pre>

          </div>


          <div class="field field-full">

            <label>
              Profile runtime overrides
            </label>

            <textarea
              id="profile-edit-runtime-options"
              name="runtime_options"
              class="mono runtime-textarea"
              spellcheck="false"
            >${escapeHtml(
              prettyRuntimeJson(
                profileRuntime
              )
            )}</textarea>

            <div class="table-secondary">
              Optional. Model defaults are inherited
              automatically. Save only intentional
              differences here.
            </div>

          </div>


          <div class="field field-full">

            <label>
              Effective runtime for next UP
            </label>

            <pre
              id="profile-edit-effective-runtime"
              class="runtime-json"
            ></pre>

            <div class="table-secondary">
              Read-only preview of model defaults plus
              profile overrides. This is desired
              configuration, not running-container
              introspection.
            </div>

          </div>


        </div>


        <div class="secret-warning">

          Editing changes desired configuration only.
          It does not start, stop, install, or register anything.

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Save profile
          </button>

        </div>

      </form>
    `,
  );


  const hostSelect =
    document.querySelector(
      "#profile-edit-host"
    );


  const gpuContainer =
    document.querySelector(
      "#profile-edit-gpus"
    );


  const renderEditGpus =
    selectedIds => {

      const hostId =
        Number(
          hostSelect.value
        );


      const hostGpus =
        gpus.filter(
          gpu =>
            Number(
              gpu.host_id
            )
            === hostId
            &&
            gpu.enabled
        );


      gpuContainer.innerHTML =
        hostGpus
          .map(
            gpu => `
              <label class="checkbox-card">

                <input
                  type="checkbox"
                  name="gpu_ids"
                  value="${gpu.id}"
                  ${
                    selectedIds.has(
                      Number(gpu.id)
                    )
                      ? "checked"
                      : ""
                  }
                >

                <span>

                  GPU
                  ${escapeHtml(
                    gpu.host_index
                  )}

                  <span class="muted">
                    ${escapeHtml(
                      gpu.name
                    )}
                  </span>

                </span>

              </label>
            `
          )
          .join("");
    };


  renderEditGpus(
    selectedGpuIds
  );


  hostSelect.addEventListener(
    "change",
    () => {

      renderEditGpus(
        new Set()
      );
    },
  );


  const editForm =
    document.querySelector(
      "#profile-edit-form"
    );


  const runtimeTextarea =
    document.querySelector(
      "#profile-edit-runtime-options"
    );


  const effectiveView =
    document.querySelector(
      "#profile-edit-effective-runtime"
    );


  const helpButton =
    document.querySelector(
      "#profile-edit-help-button"
    );


  const helpPanel =
    document.querySelector(
      "#profile-edit-profile-help"
    );


  const copyPrompt =
    document.querySelector(
      "#profile-edit-copy-profile-prompt"
    );


  const refreshRuntimePreview =
    () => {

      try {

        const overrides =
          parseProfileRuntimeOptions(
            runtimeTextarea.value
          );


        effectiveView.textContent =
          prettyRuntimeJson(
            effectiveRuntimeOptions(
              modelRuntime,
              overrides,
            )
          );


      } catch {

        effectiveView.textContent =
          "Invalid runtime JSON";
      }
    };


  runtimeTextarea.addEventListener(
    "input",
    refreshRuntimePreview,
  );


  helpButton.addEventListener(
    "click",
    () => {

      helpPanel.hidden =
        !helpPanel.hidden;
    },
  );


  copyPrompt.addEventListener(
    "click",
    async () => {

      await copyText(
        profileAssistantPrompt({
          mode: "edit",
          form:
            editForm,
          model,
          hosts,
          gpus,
          profileName:
            profile.name,
        })
      );


      showToast(
        "Profile configuration prompt copied."
      );
    },
  );


  refreshRuntimePreview();


  editForm
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        const gpuIds =
          form
            .getAll(
              "gpu_ids"
            )
            .map(Number);


        const tp =
          Number(
            form.get("tp")
          );


        const pp =
          Number(
            form.get("pp")
          );


        if (!gpuIds.length) {

          showToast(
            "Select at least one GPU.",
            true
          );

          return;
        }


        if (
          tp * pp
          !== gpuIds.length
        ) {

          showToast(
            "TP × PP must equal the number of selected GPUs.",
            true
          );

          return;
        }


        let runtimeOptions;


        try {

          runtimeOptions =
            parseProfileRuntimeOptions(
              form.get(
                "runtime_options"
              )
            );


        } catch (error) {

          showToast(
            error.message,
            true
          );

          return;
        }


        try {

          await api(
            `/api/v1/admin/profiles/${profileId}`,
            {
              method: "PUT",

              body: {
                host_id:
                  Number(
                    form.get(
                      "host_id"
                    )
                  ),

                host_port:
                  Number(
                    form.get(
                      "host_port"
                    )
                  ),

                gpu_ids:
                  gpuIds,

                tensor_parallel_size:
                  tp,

                pipeline_parallel_size:
                  pp,

                distributed_executor_backend:
                  form.get(
                    "distributed_executor_backend"
                  ),

                dtype:
                  form.get(
                    "dtype"
                  ),

                gpu_memory_utilization:
                  Number(
                    form.get(
                      "gpu_memory_utilization"
                    )
                  ),

                max_model_len:
                  optionalNumber(
                    form.get(
                      "max_model_len"
                    )
                  ),

                max_num_batched_tokens:
                  optionalNumber(
                    form.get(
                      "max_num_batched_tokens"
                    )
                  ),

                max_num_seqs:
                  optionalNumber(
                    form.get(
                      "max_num_seqs"
                    )
                  ),

                enable_prefix_caching:
                  form.has(
                    "prefix"
                  ),

                enable_chunked_prefill:
                  form.has(
                    "chunked"
                  ),

                runtime_options:
                  runtimeOptions,
              },
            },
          );


          closeModal();


          showToast(
            `Profile ${profile.name} updated.`
          );


          await navigate(
            "profiles"
          );


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


/* ============================================================
   MODEL OPERATIONS
   ============================================================ */

async function openModelInstall(
  modelId,
) {

  const model =
    state.models.find(
      item =>
        Number(item.id)
        ===
        Number(modelId)
    );


  if (!model) {

    throw new Error(
      "MODEL_NOT_FOUND"
    );
  }


  const [
    hostResponse,
    dashboard,
  ] = await Promise.all([
    api(
      "/api/v1/admin/hosts"
    ),

    loadDashboard(),
  ]);


  const validTargetIds =
    new Set(
      dashboard.workers
        .filter(
          worker =>
            worker.role
            === "inference"
            &&
            worker.reachable
            === true
            &&
            modelArtifactView(
              worker,
              model
            ).status
            === "missing"
        )
        .map(
          worker =>
            Number(worker.id)
        )
    );


  const hosts =
    hostResponse.hosts
      .filter(
        host =>
          host.role
          === "inference"
          &&
          host.enabled
          &&
          validTargetIds.has(
            Number(host.id)
          )
      );


  if (!hosts.length) {

    showToast(
      "No reachable worker currently reports this model as missing."
    );

    return;
  }


  openModal(
    "Install model",
    `
      <form id="model-install-form">

        <input
          type="hidden"
          name="model_id"
          value="${modelId}"
        >

        <div class="field">

          <label>
            Target worker
          </label>

          <select
            name="host_id"
            required
          >

            ${
              hosts
                .map(
                  host => `
                    <option value="${host.id}">
                      ${escapeHtml(
                        host.name
                      )}
                    </option>
                  `
                )
                .join("")
            }

          </select>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            class="button button-primary"
            type="submit"
          >
            Install
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#model-install-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const form =
          new FormData(
            event.currentTarget
          );


        try {

          const operation =
            await api(
              `/api/v1/admin/models/${modelId}/install`,
              {
                method: "POST",

                body: {
                  host_id:
                    Number(
                      form.get(
                        "host_id"
                      )
                    ),
                },
              },
            );


          watchOperation(
            operation.id,
            "Model installation"
          );


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function openModelCopy(
  modelId,
) {

  const model =
    state.models.find(
      item =>
        Number(item.id)
        ===
        Number(modelId)
    );


  if (!model) {

    throw new Error(
      "MODEL_NOT_FOUND"
    );
  }


  const [
    hostResponse,
    dashboard,
  ] = await Promise.all([
    api(
      "/api/v1/admin/hosts"
    ),

    loadDashboard(),
  ]);


  const installedIds =
    new Set();


  const missingIds =
    new Set();


  for (
    const worker
    of dashboard.workers
  ) {

    if (
      worker.role
      !== "inference"
      ||
      worker.reachable
      !== true
    ) {

      continue;
    }


    const artifact =
      modelArtifactView(
        worker,
        model
      );


    if (
      artifact.status
      === "installed"
    ) {

      installedIds.add(
        Number(worker.id)
      );
    }


    if (
      artifact.status
      === "missing"
    ) {

      missingIds.add(
        Number(worker.id)
      );
    }
  }


  const inferenceHosts =
    hostResponse.hosts
      .filter(
        host =>
          host.role
          === "inference"
          &&
          host.enabled
      );


  const sources =
    inferenceHosts.filter(
      host =>
        installedIds.has(
          Number(host.id)
        )
    );


  const targets =
    inferenceHosts.filter(
      host =>
        missingIds.has(
          Number(host.id)
        )
    );


  if (!sources.length) {

    showToast(
      "Copy is unavailable because no reachable worker has a verified installation.",
      true
    );

    return;
  }


  if (!targets.length) {

    showToast(
      "Copy is unnecessary because no reachable worker reports the model as missing."
    );

    return;
  }


  openModal(
    "Copy model",
    `
      <form id="model-copy-form">

        <div class="form-grid">

          <div class="field">

            <label>
              Source
            </label>

            <select
              name="source"
              required
            >

              ${
                sources
                  .map(
                    host => `
                      <option value="${host.id}">
                        ${escapeHtml(
                          host.name
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>


          <div class="field">

            <label>
              Target
            </label>

            <select
              name="target"
              required
            >

              ${
                targets
                  .map(
                    host => `
                      <option value="${host.id}">
                        ${escapeHtml(
                          host.name
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>

        </div>


        <div class="secret-warning">
          Copy is allowed only from a verified installation
          to a worker that currently reports the model as missing.
          Mismatch and unverified directories are never overwritten.
        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            class="button button-primary"
            type="submit"
          >
            Copy
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#model-copy-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const form =
          new FormData(
            event.currentTarget
          );


        const source =
          Number(
            form.get("source")
          );

        const target =
          Number(
            form.get("target")
          );


        if (source === target) {

          showToast(
            "Source and target must differ.",
            true
          );

          return;
        }


        try {

          const operation =
            await api(
              `/api/v1/admin/models/${modelId}/copy`,
              {
                method: "POST",

                body: {
                  source_host_id:
                    source,

                  target_host_id:
                    target,
                },
              },
            );


          watchOperation(
            operation.id,
            "Model copy"
          );


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


/* ============================================================
   PROFILE OPERATIONS
   ============================================================ */

async function runProfileAction(
  profileId,
  action,
) {

  try {

    const operation =
      await api(
        `/api/v1/admin/profiles/${profileId}/${action}`,
        {
          method: "POST",
        },
      );


    watchOperation(
      operation.id,
      `Profile ${action}`
    );


  } catch (error) {

    showToast(
      error.message,
      true
    );
  }
}


/* ============================================================
   OPERATIONS
   ============================================================ */

function operationDayRange(
  day,
) {

  if (!day) {

    return null;
  }


  const start =
    new Date(
      `${day}T00:00:00`
    );


  if (
    Number.isNaN(
      start.getTime()
    )
  ) {

    return null;
  }


  const end =
    new Date(
      start
    );


  end.setDate(
    end.getDate() + 1
  );


  return {
    from:
      start.toISOString(),

    to:
      end.toISOString(),
  };
}


function operationQueryParams() {

  const view =
    state.view.operations;


  const params =
    new URLSearchParams();


  if (view.kind) {

    params.set(
      "kind",
      view.kind
    );
  }


  if (view.status) {

    params.set(
      "status",
      view.status
    );
  }


  if (view.worker) {

    params.set(
      "worker_id",
      view.worker
    );
  }


  const dayRange =
    operationDayRange(
      view.day
    );


  if (dayRange) {

    params.set(
      "from",
      dayRange.from
    );

    params.set(
      "to",
      dayRange.to
    );
  }


  params.set(
    "page",
    String(
      view.page
    )
  );


  params.set(
    "page_size",
    String(
      view.pageSize
    )
  );


  return params;
}


async function loadOperationsState() {

  const params =
    operationQueryParams();


  const data =
    await api(
      `/api/v1/admin/operations?${
        params.toString()
      }`
    );


  state.operations =
    data.operations
    || [];


  state.operationsPagination =
    data.pagination
    || {
      page:
        state.view.operations.page,

      page_size:
        state.view.operations.pageSize,

      total:
        state.operations.length,

      pages:
        1,
    };


  if (
    Number(
      state.operationsPagination.page
    )
    !==
    Number(
      state.view.operations.page
    )
  ) {

    state.view.operations.page =
      Number(
        state.operationsPagination.page
      );


    if (
      state.page
      === "operations"
    ) {

      replaceCurrentViewRoute();
    }
  }


  return state.operations;
}


function operationKindLabel(
  kind,
) {

  const labels = {
    profile_check:
      "Profile check",

    profile_up:
      "Profile up",

    profile_down:
      "Profile down",

    model_install:
      "Model install",

    model_copy:
      "Model copy",
  };


  return (
    labels[kind]
    ||
    kind
  );
}


function operationWorkerLabel(
  operation,
) {

  if (
    [
      "profile_check",
      "profile_up",
      "profile_down",
    ].includes(
      operation.kind
    )
  ) {

    return (
      operation.profile_host_name
      ||
      "—"
    );
  }


  if (
    operation.kind
    === "model_install"
  ) {

    return (
      operation.target_host_name
      ||
      "—"
    );
  }


  if (
    operation.kind
    === "model_copy"
  ) {

    const source =
      operation.source_host_name
      ||
      "—";


    const target =
      operation.target_host_name
      ||
      "—";


    return `${source} → ${target}`;
  }


  return "—";
}


function renderOperationsPagination() {

  const pagination =
    state.operationsPagination;


  const page =
    Number(
      pagination.page
      || 1
    );


  const pages =
    Number(
      pagination.pages
      || 1
    );


  const total =
    Number(
      pagination.total
      || 0
    );


  return `
    <div class="pagination-bar">

      <div class="table-secondary">
        ${total} operation${
          total === 1
            ? ""
            : "s"
        }
      </div>


      <div class="pagination-controls">

        <button
          type="button"
          id="operations-previous"
          class="button button-small button-quiet"
          ${
            page <= 1
              ? "disabled"
              : ""
          }
        >
          ‹ Previous
        </button>


        <span class="pagination-summary">
          Page ${page} of ${pages}
        </span>


        <button
          type="button"
          id="operations-next"
          class="button button-small button-quiet"
          ${
            page >= pages
              ? "disabled"
              : ""
          }
        >
          Next ›
        </button>

      </div>

    </div>
  `;
}


function bindOperationsPagination() {

  const previous =
    document.querySelector(
      "#operations-previous"
    );


  const next =
    document.querySelector(
      "#operations-next"
    );


  if (previous) {

    previous.addEventListener(
      "click",
      async () => {

        if (
          state.view.operations.page
          <= 1
        ) {

          return;
        }


        state.view.operations.page -=
          1;


        replaceCurrentViewRoute();


        try {

          await refreshOperationsResults();

        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
  }


  if (next) {

    next.addEventListener(
      "click",
      async () => {

        if (
          state.view.operations.page
          >=
          state.operationsPagination.pages
        ) {

          return;
        }


        state.view.operations.page +=
          1;


        replaceCurrentViewRoute();


        try {

          await refreshOperationsResults();

        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
  }
}


async function refreshOperationsResults() {

  await loadOperationsState();


  if (
    state.page
    !== "operations"
  ) {

    return;
  }


  const table =
    document.querySelector(
      "#operations-table"
    );


  const pagination =
    document.querySelector(
      "#operations-pagination"
    );


  if (
    !table
    ||
    !pagination
  ) {

    await renderOperations();

    return;
  }


  table.innerHTML =
    renderOperationTable(
      state.operations,
      true
    );


  pagination.innerHTML =
    renderOperationsPagination();


  bindOperationsPagination();
}


async function refreshOperationsLive() {

  /*
   * Page 1 is the live view.
   * Historical pages remain stable while the admin reads them.
   */
  if (
    state.view.operations.page
    !== 1
  ) {

    return;
  }


  await refreshOperationsResults();
}


async function renderOperations() {

  const [
    hosts,
  ] = await Promise.all([
    api(
      "/api/v1/admin/hosts"
    ),

    loadOperationsState(),
  ]);


  state.hosts =
    hosts.hosts;


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Operations
        </h1>

        <p class="page-description">
          Privileged cluster activity
        </p>

      </div>

    </div>


    <div class="filters operations-filters">

      <select id="operations-kind-filter">

        <option value="">
          All operations
        </option>

        <option value="profile_check">
          Profile check
        </option>

        <option value="profile_up">
          Profile up
        </option>

        <option value="profile_down">
          Profile down
        </option>

        <option value="model_install">
          Model install
        </option>

        <option value="model_copy">
          Model copy
        </option>

      </select>


      <select id="operations-status-filter">

        <option value="">
          All states
        </option>

        <option value="queued">
          Queued
        </option>

        <option value="running">
          Running
        </option>

        <option value="succeeded">
          Succeeded
        </option>

        <option value="failed">
          Failed
        </option>

      </select>


      <input
        id="operations-day-filter"
        type="date"
        aria-label="Operation day"
      >


      <select id="operations-worker-filter">

        <option value="">
          All workers
        </option>

        ${
          state.hosts
            .filter(
              host =>
                host.role
                === "inference"
            )
            .map(
              host => `
                <option
                  value="${escapeHtml(
                    host.id
                  )}"
                >
                  ${escapeHtml(
                    host.name
                  )}
                </option>
              `
            )
            .join("")
        }

      </select>


      <select
        id="operations-page-size"
        aria-label="Page size"
      >

        <option value="25">
          25 / page
        </option>

        <option value="50">
          50 / page
        </option>

        <option value="100">
          100 / page
        </option>

      </select>

    </div>


    <div id="operations-table">

      ${
        renderOperationTable(
          state.operations,
          true
        )
      }

    </div>


    <div id="operations-pagination">

      ${renderOperationsPagination()}

    </div>
  `;


  const kindFilter =
    document.querySelector(
      "#operations-kind-filter"
    );


  const statusFilter =
    document.querySelector(
      "#operations-status-filter"
    );


  const dayFilter =
    document.querySelector(
      "#operations-day-filter"
    );


  const workerFilter =
    document.querySelector(
      "#operations-worker-filter"
    );


  const pageSize =
    document.querySelector(
      "#operations-page-size"
    );


  kindFilter.value =
    state.view.operations.kind;


  statusFilter.value =
    state.view.operations.status;


  dayFilter.value =
    state.view.operations.day;


  workerFilter.value =
    state.view.operations.worker;


  pageSize.value =
    String(
      state.view.operations.pageSize
    );


  const applyFilters =
    async () => {

      state.view.operations.kind =
        kindFilter.value;


      state.view.operations.status =
        statusFilter.value;


      state.view.operations.day =
        dayFilter.value;


      state.view.operations.worker =
        workerFilter.value;


      state.view.operations.pageSize =
        Number(
          pageSize.value
        );


      state.view.operations.page =
        1;


      replaceCurrentViewRoute();


      try {

        await refreshOperationsResults();

      } catch (error) {

        showToast(
          error.message,
          true
        );
      }
    };


  kindFilter.addEventListener(
    "change",
    applyFilters
  );


  statusFilter.addEventListener(
    "change",
    applyFilters
  );


  dayFilter.addEventListener(
    "change",
    applyFilters
  );


  workerFilter.addEventListener(
    "change",
    applyFilters
  );


  pageSize.addEventListener(
    "change",
    applyFilters
  );


  bindOperationsPagination();
}


function renderOperationTable(
  operations,
  clickable = false,
) {

  if (!operations.length) {

    return `
      <div class="card empty">
        No operations match the current filters.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>ID</th>
            <th>Operation</th>
            <th>Target</th>

            ${
              clickable
                ? "<th>Worker</th>"
                : ""
            }

            <th>Status</th>
            <th>Requested by</th>
            <th>Started</th>
            <th>Exit</th>

            ${
              clickable
                ? "<th></th>"
                : ""
            }

          </tr>

        </thead>

        <tbody>

          ${
            operations
              .map(
                operation => {

                  const target =
                    operation.profile_name
                    ||
                    operation.model_name
                    ||
                    "—";


                  return `
                    <tr>

                      <td class="mono">
                        #${operation.id}
                      </td>


                      <td>
                        ${escapeHtml(
                          operationKindLabel(
                            operation.kind
                          )
                        )}
                      </td>


                      <td>
                        ${escapeHtml(
                          target
                        )}
                      </td>


                      ${
                        clickable
                          ? `
                            <td>
                              ${escapeHtml(
                                operationWorkerLabel(
                                  operation
                                )
                              )}
                            </td>
                          `
                          : ""
                      }


                      <td>
                        ${statusBadge(
                          operation.status,
                          stateTone(
                            operation.status
                          )
                        )}
                      </td>


                      <td>
                        ${escapeHtml(
                          operation
                            .requested_by_username
                        )}
                      </td>


                      <td>
                        ${escapeHtml(
                          age(
                            operation.started_at
                            ||
                            operation.requested_at
                          )
                        )}
                      </td>


                      <td>
                        ${
                          operation.exit_code
                          ?? "—"
                        }
                      </td>


                      ${
                        clickable
                          ? `
                            <td>

                              <button
                                class="button button-small"
                                data-action="operation-view"
                                data-id="${operation.id}"
                              >
                                View
                              </button>

                            </td>
                          `
                          : ""
                      }

                    </tr>
                  `;
                }
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function stopOperationPolling() {

  if (
    state.operationTimer
  ) {

    clearInterval(
      state.operationTimer
    );

    state.operationTimer =
      null;
  }
}


async function watchOperation(
  operationId,
  title = "Operation",
) {

  stopOperationPolling();


  state.view.operationViewer.operationId =
    Number(
      operationId
    );


  state.view.operationViewer.followTail =
    true;


  openModal(
    title,
    `
      <div id="operation-view">

        <div
          class="operation-view-header"
        >

          <div>

            <div
              id="operation-view-target"
              class="table-primary"
            >
              Loading…
            </div>

            <div
              id="operation-view-meta"
              class="table-secondary"
            >
              Operation #${operationId}
            </div>

          </div>

          <div
            id="operation-view-status"
          ></div>

        </div>


        <div
          class="operation-log-tools"
        >

          <button
            type="button"
            id="operation-new-output"
            class="button button-small button-quiet"
            hidden
          >
            ↓ New output
          </button>

        </div>


        <pre
          id="operation-log"
          class="log operation-log"
        >Waiting for output...</pre>

      </div>
    `,
  );


  const targetElement =
    document.querySelector(
      "#operation-view-target"
    );


  const metaElement =
    document.querySelector(
      "#operation-view-meta"
    );


  const statusElement =
    document.querySelector(
      "#operation-view-status"
    );


  const logElement =
    document.querySelector(
      "#operation-log"
    );


  const newOutputButton =
    document.querySelector(
      "#operation-new-output"
    );


  const nearBottom =
    () => {

      const remaining =
        (
          logElement.scrollHeight
          -
          logElement.scrollTop
          -
          logElement.clientHeight
        );


      return remaining <= 40;
    };


  const followNewest =
    () => {

      logElement.scrollTop =
        logElement.scrollHeight;


      state.view.operationViewer.followTail =
        true;


      newOutputButton.hidden =
        true;
    };


  logElement.addEventListener(
    "scroll",
    () => {

      state.view.operationViewer.followTail =
        nearBottom();


      if (
        state.view.operationViewer
          .followTail
      ) {

        newOutputButton.hidden =
          true;
      }
    },
  );


  newOutputButton.addEventListener(
    "click",
    followNewest,
  );


  let lastLog = null;

  let firstRefresh = true;


  const refresh =
    async () => {

      try {

        const operation =
          await api(
            `/api/v1/admin/operations/${operationId}`
          );


        if (
          !modal.open
          ||
          !document.querySelector(
            "#operation-view"
          )
        ) {

          stopOperationPolling();

          return;
        }


        const target =
          operation.profile_name
          ||
          operation.model_name
          ||
          "—";


        targetElement.textContent =
          target;


        metaElement.textContent =
          (
            `#${operation.id}`
            +
            " · "
            +
            operation.kind
          );


        statusElement.innerHTML =
          statusBadge(
            operation.status,
            stateTone(
              operation.status
            )
          );


        const nextLog =
          (
            operation.log_tail
            ||
            operation.result_summary
            ||
            "Waiting for output..."
          );


        const terminal =
          (
            operation.status
            === "succeeded"
            ||
            operation.status
            === "failed"
          );


        if (
          nextLog
          !== lastLog
        ) {

          const oldScrollTop =
            logElement.scrollTop;


          const wasFollowing =
            state.view.operationViewer
              .followTail
            ||
            nearBottom();


          logElement.textContent =
            nextLog;


          if (firstRefresh) {

            if (terminal) {

              logElement.scrollTop = 0;

              state.view.operationViewer.followTail =
                false;

            } else {

              followNewest();
            }


          } else if (wasFollowing) {

            followNewest();


          } else {

            /*
             * The administrator deliberately moved away
             * from the tail. Do not take control of the
             * viewport when new output arrives.
             */
            logElement.scrollTop =
              oldScrollTop;


            newOutputButton.hidden =
              false;
          }


          lastLog =
            nextLog;
        }


        firstRefresh =
          false;


        if (terminal) {

          stopOperationPolling();


          showToast(
            operation.status
            === "succeeded"
              ? "Operation succeeded."
              : "Operation failed.",
            operation.status
            === "failed"
          );


          setTimeout(
            () => {

              if (
                !modal.open
              ) {

                if (
                  state.page
                  === "operations"
                ) {

                  refreshOperationsLive()
                    .catch(
                      () => {}
                    );

                } else {

                  renderCurrentPage()
                    .catch(
                      () => {}
                    );
                }
              }

            },
            300,
          );
        }


      } catch (error) {

        stopOperationPolling();

        showToast(
          error.message,
          true
        );
      }
    };


  await refresh();


  if (
    modal.open
  ) {

    state.operationTimer =
      setInterval(
        refresh,
        2000
      );
  }
}


/* ============================================================
   ACCESS OVERVIEW
   ============================================================ */

function accessPaginationFor(
  scope,
) {

  if (scope === "users") {
    return state.usersPagination;
  }

  if (scope === "groups") {
    return state.groupsPagination;
  }

  return state.grantsPagination;
}


function accessViewFor(
  scope,
) {

  return state.view[scope];
}


function renderAccessPagination(
  scope,
) {

  const pagination =
    accessPaginationFor(
      scope
    );


  return `
    <div class="pagination-bar">

      <div class="table-secondary">
        ${pagination.total} result${
          pagination.total === 1
            ? ""
            : "s"
        }
      </div>


      <div class="pagination-controls">

        <button
          type="button"
          class="button button-small button-quiet"
          data-action="access-page"
          data-scope="${scope}"
          data-page="${
            pagination.page - 1
          }"
          ${
            pagination.page <= 1
              ? "disabled"
              : ""
          }
        >
          ‹ Previous
        </button>


        <span class="pagination-summary">
          Page ${pagination.page}
          of ${pagination.pages}
        </span>


        <button
          type="button"
          class="button button-small button-quiet"
          data-action="access-page"
          data-scope="${scope}"
          data-page="${
            pagination.page + 1
          }"
          ${
            pagination.page
            >= pagination.pages
              ? "disabled"
              : ""
          }
        >
          Next ›
        </button>

      </div>

    </div>
  `;
}


async function changeAccessPage(
  scope,
  page,
) {

  const pagination =
    accessPaginationFor(
      scope
    );


  if (
    page < 1
    ||
    page > pagination.pages
  ) {
    return;
  }


  accessViewFor(
    scope
  ).page = page;


  replaceCurrentViewRoute();


  if (scope === "users") {
    await refreshUsersResults();
  }

  if (scope === "groups") {
    await refreshGroupsResults();
  }

  if (scope === "grants") {
    await refreshGrantsResults();
  }
}


async function loadUsersPageState() {

  const view =
    state.view.users;


  const params =
    new URLSearchParams({
      paginated:
        "true",

      page:
        String(view.page),

      page_size:
        String(view.pageSize),
    });


  if (view.email) {
    params.set(
      "email",
      view.email
    );
  }


  if (view.role) {

    params.set(
      "role",
      view.role
    );
  }


  const data =
    await api(
      `/api/v1/admin/users?${params}`
    );


  state.users =
    data.users;


  state.usersPagination =
    data.pagination;


  if (
    Number(data.pagination.page)
    !== Number(view.page)
  ) {
    view.page =
      Number(data.pagination.page);

    replaceCurrentViewRoute();
  }
}


async function refreshUsersResults() {

  await loadUsersPageState();


  const table =
    document.querySelector(
      "#users-results"
    );


  const pagination =
    document.querySelector(
      "#users-pagination"
    );


  if (table) {
    table.innerHTML =
      renderUsers();
  }


  if (pagination) {
    pagination.innerHTML =
      renderAccessPagination(
        "users"
      );
  }
}


async function openUserFromList(
  userId,
) {

  state.view.users.userId =
    Number(
      userId
    );


  replaceCurrentViewRoute();


  await renderUsersPage();
}


async function returnToUsersList() {

  state.view.users.userId =
    null;

  state.userWorkspace =
    null;


  replaceCurrentViewRoute();


  await renderUsersPage();
}


function renderUserMemberships(
  workspace,
) {

  const memberships =
    workspace.memberships
    || [];


  if (!memberships.length) {

    return `
      <div class="empty">
        This user is not a member of any user-managed group.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Group</th>
            <th>State</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${
            memberships
              .map(
                group => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        group.name
                      )}
                    </td>


                    <td>
                      ${statusBadge(
                        group.enabled
                          ? "enabled"
                          : "disabled",

                        group.enabled
                          ? "green"
                          : "red"
                      )}
                    </td>


                    <td>

                      <button
                        class="button button-small button-danger"
                        data-action="user-group-remove"
                        data-id="${workspace.user.id}"
                        data-group-id="${group.id}"
                      >
                        Remove
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function renderUserDirectGrants(
  workspace,
) {

  const grants =
    workspace.direct_grants
    || [];


  if (!grants.length) {

    return `
      <div class="empty">
        No direct grants. Access may still come from group membership.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Resource</th>
            <th>Type</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${
            grants
              .map(
                grant => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        grant.target_name
                      )}
                    </td>


                    <td>
                      ${escapeHtml(
                        grant.target_type
                      )}
                    </td>


                    <td>

                      <button
                        class="button button-small button-danger"
                        data-action="grant-remove"
                        data-id="${grant.id}"
                      >
                        Remove
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function renderUserEffectiveAccess(
  workspace,
) {

  const access =
    workspace.effective_access
    || {};


  if (!access.available) {

    return `
      <div class="card empty">
        Effective access unavailable:
        ${escapeHtml(
          access.reason
          || "ACCESS_UNAVAILABLE"
        )}
      </div>
    `;
  }


  const models =
    access.models
    || [];


  const profiles =
    access.profiles
    || [];


  if (!profiles.length) {

    return `
      <div class="card empty">
        This user currently has no callable profiles.
      </div>
    `;
  }


  return `
    <div class="user-effective-grid">

      <div>

        <div class="table-secondary user-workspace-label">
          Models
        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Model</th>
                <th>Profiles</th>
              </tr>

            </thead>

            <tbody>

              ${
                models
                  .map(
                    model => `
                      <tr>

                        <td class="table-primary">
                          ${escapeHtml(
                            model.model_name
                          )}
                        </td>

                        <td>
                          ${model.profiles.length}
                        </td>

                      </tr>
                    `
                  )
                  .join("")
              }

            </tbody>

          </table>

        </div>

      </div>


      <div>

        <div class="table-secondary user-workspace-label">
          Exact callable profiles
        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Profile</th>
                <th>Model</th>
                <th>Access context</th>
              </tr>

            </thead>

            <tbody>

              ${
                profiles
                  .map(
                    profile => `
                      <tr>

                        <td class="table-primary">
                          ${escapeHtml(
                            profile.profile_name
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            profile.model_name
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            (
                              profile.contexts
                              || []
                            ).join(
                              ", "
                            )
                          )}
                        </td>

                      </tr>
                    `
                  )
                  .join("")
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  `;
}


async function renderUserWorkspace(
  userId,
) {

  const workspace =
    await api(
      `/api/v1/admin/users/${userId}/workspace`
    );


  state.userWorkspace =
    workspace;


  /*
   * Existing account-management functions resolve their
   * user from state.users. Keep only the selected user while
   * the workspace is active.
   */
  state.users = [
    workspace.user,
  ];


  const user =
    workspace.user;


  const self =
    Number(
      user.id
    )
    ===
    Number(
      state.user?.id
    );


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <button
          class="button button-small button-quiet"
          data-action="users-back"
          style="margin-bottom:10px"
        >
          ← Users
        </button>

        <h1 class="page-title">
          ${escapeHtml(
            user.email
            || user.username
          )}
        </h1>

        <p class="page-description">
          User account, authorization and access context
        </p>

      </div>

    </div>


    <section class="section">

      <div class="card">

        <div class="card-header">

          <div>

            <div class="card-title">
              Account
            </div>

            <div class="table-secondary">
              ${escapeHtml(
                user.username
              )}
            </div>

          </div>

          ${statusBadge(
            user.enabled
              ? "enabled"
              : "disabled",

            user.enabled
              ? "green"
              : "red"
          )}

        </div>


        <div class="card-body">

          <div class="user-account-grid">

            <div>

              <div class="metric-label">
                Email
              </div>

              <div class="metric-value">
                ${escapeHtml(
                  user.email
                  || "—"
                )}
              </div>

            </div>


            <div>

              <div class="metric-label">
                Role
              </div>

              <div class="metric-value">
                ${
                  user.role
                  === "admin"
                    ? "Administrator"
                    : "User"
                }
              </div>

            </div>


            <div>

              <div class="metric-label">
                User ID
              </div>

              <div class="metric-value mono">
                ${user.id}
              </div>

            </div>

          </div>


          <div class="row-actions user-workspace-actions">

            <button
              class="button button-small"
              data-action="user-edit"
              data-id="${user.id}"
            >
              Edit email
            </button>

            <button
              class="button button-small"
              data-action="user-password"
              data-id="${user.id}"
            >
              Reset password
            </button>

            <button
              class="button button-small ${
                user.enabled
                  ? "button-danger"
                  : ""
              }"
              data-action="${
                user.enabled
                  ? "user-disable"
                  : "user-enable"
              }"
              data-id="${user.id}"
              ${
                self
                &&
                user.enabled
                  ? "disabled"
                  : ""
              }
            >
              ${
                user.enabled
                  ? "Disable"
                  : "Enable"
              }
            </button>

            <button
              class="button button-small"
              data-action="user-admin-help"
              data-id="${user.id}"
            >
              Administrator role
            </button>

            <button
              class="button button-small button-primary"
              data-action="api-keys-for-user"
              data-id="${user.id}"
            >
              Open API Keys for this user
            </button>

          </div>

        </div>

      </div>

    </section>


    <section class="section">

      <div class="section-heading">

        <h2 class="section-title">
          Groups
        </h2>

        <button
          class="button button-small"
          data-action="user-group-add"
          data-id="${user.id}"
        >
          Add to group
        </button>

      </div>

      ${renderUserMemberships(
        workspace
      )}

    </section>


    <section class="section">

      <div class="section-heading">

        <h2 class="section-title">
          Direct grants
        </h2>

        <button
          class="button button-small"
          data-action="user-grant-add"
          data-id="${user.id}"
        >
          Add direct grant
        </button>

      </div>

      ${renderUserDirectGrants(
        workspace
      )}

    </section>


    <section class="section">

      <h2 class="section-title">
        Effective access
      </h2>

      <p class="page-description">
        Enabled authorization only. Runtime availability is intentionally separate.
      </p>

      ${renderUserEffectiveAccess(
        workspace
      )}

    </section>
  `;
}


async function renderUsersPage() {

  if (
    state.view.users.userId
  ) {

    await renderUserWorkspace(
      state.view.users.userId
    );

    return;
  }


  await loadUsersPageState();


  state.userWorkspace =
    null;


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Users
        </h1>

        <p class="page-description">
          User accounts and access administration
        </p>

      </div>

      <button
        class="button button-primary"
        data-action="user-create"
      >
        New user
      </button>

    </div>


    <div class="filters access-filters access-filters-3">

      <input
        id="users-email-filter"
        type="search"
        placeholder="Search by email"
        value="${escapeHtml(
          state.view.users.email
        )}"
      >


      <select id="users-role-filter">

        <option value="">
          All roles
        </option>

        <option value="user">
          User
        </option>

        <option value="admin">
          Administrator
        </option>

      </select>


      <select id="users-page-size">

        <option value="25">25 / page</option>
        <option value="50">50 / page</option>
        <option value="100">100 / page</option>

      </select>

    </div>


    <div id="users-results">
      ${renderUsers()}
    </div>


    <div id="users-pagination">
      ${renderAccessPagination(
        "users"
      )}
    </div>
  `;


  const email =
    document.querySelector(
      "#users-email-filter"
    );


  const roleFilter =
    document.querySelector(
      "#users-role-filter"
    );


  const pageSize =
    document.querySelector(
      "#users-page-size"
    );


  roleFilter.value =
    state.view.users.role;


  pageSize.value =
    String(
      state.view.users.pageSize
    );


  let searchTimer = null;


  email.addEventListener(
    "input",
    () => {

      state.view.users.email =
        email.value;

      state.view.users.page =
        1;

      replaceCurrentViewRoute();


      clearTimeout(
        searchTimer
      );


      searchTimer =
        setTimeout(
          () => {

            refreshUsersResults()
              .catch(
                error =>
                  showToast(
                    error.message,
                    true
                  )
              );

          },
          250,
        );
    },
  );


  roleFilter.addEventListener(
    "change",
    async () => {

      state.view.users.role =
        roleFilter.value;

      state.view.users.page =
        1;


      replaceCurrentViewRoute();


      try {

        await refreshUsersResults();

      } catch (error) {

        showToast(
          error.message,
          true
        );
      }
    },
  );


  pageSize.addEventListener(
    "change",
    async () => {

      state.view.users.pageSize =
        Number(
          pageSize.value
        );

      state.view.users.page =
        1;

      replaceCurrentViewRoute();

      await refreshUsersResults();
    },
  );
}


async function openUserGroupAdd(
  userId,
) {

  const groupsResponse =
    await api(
      "/api/v1/admin/groups"
    );


  const memberships =
    state.userWorkspace
      ?.memberships
    || [];


  const memberIds =
    new Set(
      memberships.map(
        group =>
          Number(
            group.id
          )
      )
    );


  const available =
    groupsResponse.groups.filter(
      group =>
        !memberIds.has(
          Number(
            group.id
          )
        )
    );


  if (!available.length) {

    showToast(
      "This user already belongs to every available group."
    );

    return;
  }


  openModal(
    "Add user to group",
    `
      <form id="user-group-add-form">

        <div class="field">

          <label>
            Group
          </label>

          <select
            name="group_id"
            required
          >

            ${
              available
                .map(
                  group => `
                    <option value="${group.id}">
                      ${escapeHtml(
                        group.name
                      )}
                      ${
                        group.enabled
                          ? ""
                          : " · disabled"
                      }
                    </option>
                  `
                )
                .join("")
            }

          </select>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Add membership
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#user-group-add-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const values =
          new FormData(
            event.currentTarget
          );


        const groupId =
          Number(
            values.get(
              "group_id"
            )
          );


        try {

          await api(
            `/api/v1/admin/groups/${groupId}/members/${userId}`,
            {
              method: "PUT",
            },
          );


          closeModal();

          showToast(
            "Group membership added."
          );


          await renderUsersPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function removeUserGroup(
  userId,
  groupId,
) {

  if (
    !window.confirm(
      "Remove this user from the group? Existing keys for this membership will be blocked."
    )
  ) {

    return;
  }


  await api(
    `/api/v1/admin/groups/${groupId}/members/${userId}`,
    {
      method: "DELETE",
    },
  );


  showToast(
    "Group membership removed."
  );


  await renderUsersPage();
}


async function openUserGrantAdd(
  userId,
) {

  const [
    models,
    profiles,
  ] = await Promise.all([
    api(
      "/api/v1/admin/models"
    ),

    api(
      "/api/v1/admin/profiles"
    ),
  ]);


  const targets = [
    ...models.models.map(
      model => ({
        type:
          "model",

        id:
          model.id,

        label:
          `${model.name} · model${
            model.enabled
              ? ""
              : " · disabled"
          }`,
      })
    ),

    ...profiles.profiles.map(
      profile => ({
        type:
          "profile",

        id:
          profile.id,

        label:
          `${profile.name} · profile${
            profile.enabled
              ? ""
              : " · disabled"
          }`,
      })
    ),
  ];


  if (!targets.length) {

    showToast(
      "No model or profile targets are available.",
      true
    );

    return;
  }


  openModal(
    "Add direct grant",
    `
      <form id="user-grant-add-form">

        <div class="field">

          <label>
            Model or profile
          </label>

          <select
            name="target"
            required
          >

            ${
              targets
                .map(
                  target => `
                    <option
                      value="${target.type}:${target.id}"
                    >
                      ${escapeHtml(
                        target.label
                      )}
                    </option>
                  `
                )
                .join("")
            }

          </select>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Add grant
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#user-grant-add-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const values =
          new FormData(
            event.currentTarget
          );


        const [
          targetType,
          targetId,
        ] = String(
          values.get(
            "target"
          )
        ).split(":");


        try {

          await api(
            "/api/v1/admin/grants",
            {
              method: "POST",

              body: {
                principal_type:
                  "user",

                principal_id:
                  Number(
                    userId
                  ),

                target_type:
                  targetType,

                target_id:
                  Number(
                    targetId
                  ),
              },
            },
          );


          closeModal();

          showToast(
            "Direct grant added."
          );


          await renderUsersPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


function openUserAdminHelp(
  userId,
) {

  const user =
    state.users.find(
      item =>
        Number(item.id)
        ===
        Number(userId)
    );


  if (!user) {

    throw new Error(
      "USER_NOT_FOUND"
    );
  }


  const targetRole =
    user.role
    === "admin"
      ? "user"
      : "admin";


  openModal(
    "Administrator role",
    `
      <div class="secret-warning">

        Administrator promotion and demotion are intentionally
        not performed by the browser UI.

      </div>


      <p class="page-description">

        The initial-admin bootstrap command is only for an empty
        installation. Existing users are promoted or demoted
        through the server-side access mutation service, which
        synchronizes the hidden Administrator membership and
        LiteLLM identity. Demotion of the last enabled
        administrator is refused.

      </p>


      <div class="command-box">

        <div class="table-secondary">
          ${
            targetRole === "admin"
              ? "Promote this user"
              : "Demote this administrator"
          }
        </div>

        <code class="mono">
cd /opt/securas-inference/control
sudo -u securas-api .venv/bin/python -m app.services.access_mutation_service set-role ${user.id} ${targetRole}
        </code>

      </div>

    `,
  );
}


async function loadGroupsPageState() {

  const view =
    state.view.groups;


  const params =
    new URLSearchParams({
      paginated:
        "true",

      page:
        String(view.page),

      page_size:
        String(view.pageSize),
    });


  if (view.name) {
    params.set(
      "name",
      view.name
    );
  }


  if (view.enabled) {
    params.set(
      "enabled",
      view.enabled
    );
  }


  const data =
    await api(
      `/api/v1/admin/groups?${params}`
    );


  state.groups =
    data.groups;

  state.groupsPagination =
    data.pagination;


  if (
    Number(data.pagination.page)
    !== Number(view.page)
  ) {
    view.page =
      Number(data.pagination.page);

    replaceCurrentViewRoute();
  }
}


async function refreshGroupsResults() {

  await loadGroupsPageState();


  const table =
    document.querySelector(
      "#groups-results"
    );


  const pagination =
    document.querySelector(
      "#groups-pagination"
    );


  if (table) {
    table.innerHTML =
      renderGroups();
  }


  if (pagination) {
    pagination.innerHTML =
      renderAccessPagination(
        "groups"
      );
  }
}


async function openGroupFromList(
  groupId,
) {

  state.view.groups.groupId =
    Number(
      groupId
    );


  replaceCurrentViewRoute();


  await renderGroupsPage();
}


async function returnToGroupsList() {

  state.view.groups.groupId =
    null;

  state.groupWorkspace =
    null;


  replaceCurrentViewRoute();


  await renderGroupsPage();
}


function renderGroupMembers(
  workspace,
) {

  const members =
    workspace.members
    || [];


  if (!members.length) {

    return `
      <div class="empty">
        This group currently has no members.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Email</th>
            <th>User</th>
            <th>Role</th>
            <th>State</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${
            members
              .map(
                member => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        member.email
                        || "—"
                      )}
                    </td>


                    <td>
                      ${escapeHtml(
                        member.username
                      )}
                    </td>


                    <td>
                      ${
                        member.role
                        === "admin"
                          ? "Administrator"
                          : "User"
                      }
                    </td>


                    <td>
                      ${statusBadge(
                        member.enabled
                          ? "enabled"
                          : "disabled",

                        member.enabled
                          ? "green"
                          : "red"
                      )}
                    </td>


                    <td>

                      <button
                        class="button button-small button-danger"
                        data-action="group-member-remove"
                        data-id="${workspace.group.id}"
                        data-user-id="${member.id}"
                      >
                        Remove
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function renderGroupDirectGrants(
  workspace,
) {

  const grants =
    workspace.direct_grants
    || [];


  if (!grants.length) {

    return `
      <div class="empty">
        This group has no explicit model or profile grants.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Resource</th>
            <th>Type</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${
            grants
              .map(
                grant => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        grant.target_name
                      )}
                    </td>


                    <td>
                      ${escapeHtml(
                        grant.target_type
                      )}
                    </td>


                    <td>

                      <button
                        class="button button-small button-danger"
                        data-action="grant-remove"
                        data-id="${grant.id}"
                      >
                        Remove
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function groupGrantSourceLabel(
  sources,
) {

  const values =
    new Set(
      sources
      || []
    );


  if (
    values.has(
      "group_model"
    )
    &&
    values.has(
      "group_profile"
    )
  ) {

    return "Model + profile grants";
  }


  if (
    values.has(
      "group_model"
    )
  ) {

    return "Model grant";
  }


  if (
    values.has(
      "group_profile"
    )
  ) {

    return "Profile grant";
  }


  return "Group grant";
}


function renderGroupEffectiveAccess(
  workspace,
) {

  const access =
    workspace.effective_access
    || {};


  if (!access.available) {

    return `
      <div class="card empty">
        Effective access unavailable:
        ${escapeHtml(
          access.reason
          || "ACCESS_UNAVAILABLE"
        )}
      </div>
    `;
  }


  const models =
    access.models
    || [];


  const profiles =
    access.profiles
    || [];


  if (!profiles.length) {

    return `
      <div class="card empty">
        This group currently grants no enabled callable profiles.
      </div>
    `;
  }


  return `
    <div class="user-effective-grid">

      <div>

        <div class="table-secondary user-workspace-label">
          Models
        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Model</th>
                <th>Profiles</th>
              </tr>

            </thead>

            <tbody>

              ${
                models
                  .map(
                    model => `
                      <tr>

                        <td class="table-primary">
                          ${escapeHtml(
                            model.model_name
                          )}
                        </td>

                        <td>
                          ${model.profiles.length}
                        </td>

                      </tr>
                    `
                  )
                  .join("")
              }

            </tbody>

          </table>

        </div>

      </div>


      <div>

        <div class="table-secondary user-workspace-label">
          Exact callable profiles
        </div>

        <div class="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Profile</th>
                <th>Model</th>
                <th>Granted by</th>
              </tr>

            </thead>

            <tbody>

              ${
                profiles
                  .map(
                    profile => `
                      <tr>

                        <td class="table-primary">
                          ${escapeHtml(
                            profile.profile_name
                          )}
                        </td>


                        <td>
                          ${escapeHtml(
                            profile.model_name
                          )}
                        </td>


                        <td>
                          ${escapeHtml(
                            groupGrantSourceLabel(
                              profile.grant_sources
                            )
                          )}
                        </td>

                      </tr>
                    `
                  )
                  .join("")
              }

            </tbody>

          </table>

        </div>

      </div>

    </div>
  `;
}


async function renderGroupWorkspace(
  groupId,
) {

  const workspace =
    await api(
      `/api/v1/admin/groups/${groupId}/workspace`
    );


  state.groupWorkspace =
    workspace;


  /*
   * Existing rename/enable/disable helpers resolve the selected
   * group from state.groups.
   */
  state.groups = [
    workspace.group,
  ];


  const group =
    workspace.group;


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <button
          class="button button-small button-quiet"
          data-action="groups-back"
          style="margin-bottom:10px"
        >
          ← Groups
        </button>


        <h1 class="page-title">
          ${escapeHtml(
            group.name
          )}
        </h1>


        <p class="page-description">
          Membership, authorization and effective inference access
        </p>

      </div>

    </div>


    <section class="section">

      <div class="card">

        <div class="card-header">

          <div>

            <div class="card-title">
              Group
            </div>

            <div class="table-secondary">
              User-managed access context
            </div>

          </div>


          ${statusBadge(
            group.enabled
              ? "enabled"
              : "disabled",

            group.enabled
              ? "green"
              : "red"
          )}

        </div>


        <div class="card-body">

          <div class="user-account-grid">

            <div>

              <div class="metric-label">
                Name
              </div>

              <div class="metric-value">
                ${escapeHtml(
                  group.name
                )}
              </div>

            </div>


            <div>

              <div class="metric-label">
                Group ID
              </div>

              <div class="metric-value mono">
                ${group.id}
              </div>

            </div>


            <div>

              <div class="metric-label">
                Members
              </div>

              <div class="metric-value">
                ${
                  (
                    workspace.members
                    || []
                  ).length
                }
              </div>

            </div>

          </div>


          <div class="row-actions user-workspace-actions">

            <button
              class="button button-small"
              data-action="group-rename"
              data-id="${group.id}"
            >
              Rename
            </button>


            <button
              class="button button-small ${
                group.enabled
                  ? "button-danger"
                  : ""
              }"
              data-action="${
                group.enabled
                  ? "group-disable"
                  : "group-enable"
              }"
              data-id="${group.id}"
            >
              ${
                group.enabled
                  ? "Disable"
                  : "Enable"
              }
            </button>

          </div>

        </div>

      </div>

    </section>


    <section class="section">

      <div class="section-heading">

        <h2 class="section-title">
          Members
        </h2>

        <button
          class="button button-small"
          data-action="group-member-add"
          data-id="${group.id}"
        >
          Add member
        </button>

      </div>


      ${renderGroupMembers(
        workspace
      )}

    </section>


    <section class="section">

      <div class="section-heading">

        <h2 class="section-title">
          Direct grants
        </h2>

        <button
          class="button button-small"
          data-action="group-grant-add"
          data-id="${group.id}"
        >
          Add group grant
        </button>

      </div>


      ${renderGroupDirectGrants(
        workspace
      )}

    </section>


    <section class="section">

      <h2 class="section-title">
        Effective access
      </h2>

      <p class="page-description">
        Enabled authorization only. Runtime availability is intentionally separate.
      </p>


      ${renderGroupEffectiveAccess(
        workspace
      )}

    </section>
  `;
}


async function renderGroupsPage() {

  if (
    state.view.groups.groupId
  ) {

    await renderGroupWorkspace(
      state.view.groups.groupId
    );

    return;
  }


  await loadGroupsPageState();


  state.groupWorkspace =
    null;


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Groups
        </h1>

        <p class="page-description">
          User-managed access groups
        </p>

      </div>

      <button
        class="button button-primary"
        data-action="group-create"
      >
        New group
      </button>

    </div>


    <div class="filters access-filters access-filters-3">

      <input
        id="groups-name-filter"
        type="search"
        placeholder="Search groups"
        value="${escapeHtml(
          state.view.groups.name
        )}"
      >


      <select id="groups-state-filter">

        <option value="">
          All states
        </option>

        <option value="true">
          Enabled
        </option>

        <option value="false">
          Disabled
        </option>

      </select>


      <select id="groups-page-size">

        <option value="25">
          25 / page
        </option>

        <option value="50">
          50 / page
        </option>

        <option value="100">
          100 / page
        </option>

      </select>

    </div>


    <div id="groups-results">
      ${renderGroups()}
    </div>


    <div id="groups-pagination">
      ${renderAccessPagination(
        "groups"
      )}
    </div>
  `;


  const name =
    document.querySelector(
      "#groups-name-filter"
    );


  const enabled =
    document.querySelector(
      "#groups-state-filter"
    );


  const pageSize =
    document.querySelector(
      "#groups-page-size"
    );


  enabled.value =
    state.view.groups.enabled;


  pageSize.value =
    String(
      state.view.groups.pageSize
    );


  let searchTimer = null;


  name.addEventListener(
    "input",
    () => {

      state.view.groups.name =
        name.value;

      state.view.groups.page =
        1;

      replaceCurrentViewRoute();


      clearTimeout(
        searchTimer
      );


      searchTimer =
        setTimeout(
          () => {

            refreshGroupsResults()
              .catch(
                error =>
                  showToast(
                    error.message,
                    true
                  )
              );

          },
          250,
        );
    },
  );


  enabled.addEventListener(
    "change",
    async () => {

      state.view.groups.enabled =
        enabled.value;

      state.view.groups.page =
        1;

      replaceCurrentViewRoute();

      await refreshGroupsResults();
    },
  );


  pageSize.addEventListener(
    "change",
    async () => {

      state.view.groups.pageSize =
        Number(
          pageSize.value
        );

      state.view.groups.page =
        1;

      replaceCurrentViewRoute();

      await refreshGroupsResults();
    },
  );
}


async function openGroupMemberAdd(
  groupId,
) {

  const response =
    await api(
      "/api/v1/admin/users"
    );


  const members =
    state.groupWorkspace
      ?.members
    || [];


  const memberIds =
    new Set(
      members.map(
        user =>
          Number(
            user.id
          )
      )
    );


  const available =
    response.users.filter(
      user =>
        !memberIds.has(
          Number(
            user.id
          )
        )
    );


  if (!available.length) {

    showToast(
      "Every available user already belongs to this group."
    );

    return;
  }


  openModal(
    "Add group member",
    `
      <form id="group-member-add-form">

        <div class="field">

          <label>
            User
          </label>

          <select
            name="user_id"
            required
          >

            ${
              available
                .map(
                  user => `
                    <option value="${user.id}">
                      ${escapeHtml(
                        user.email
                        || user.username
                      )}
                      ${
                        user.enabled
                          ? ""
                          : " · disabled"
                      }
                    </option>
                  `
                )
                .join("")
            }

          </select>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Add member
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#group-member-add-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const values =
          new FormData(
            event.currentTarget
          );


        const userId =
          Number(
            values.get(
              "user_id"
            )
          );


        try {

          await api(
            `/api/v1/admin/groups/${groupId}/members/${userId}`,
            {
              method: "PUT",
            },
          );


          closeModal();

          showToast(
            "Member added."
          );


          await renderGroupsPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function removeGroupMember(
  groupId,
  userId,
) {

  if (
    !window.confirm(
      "Remove this member from the group? Existing keys for this membership will be blocked."
    )
  ) {

    return;
  }


  await api(
    `/api/v1/admin/groups/${groupId}/members/${userId}`,
    {
      method: "DELETE",
    },
  );


  showToast(
    "Member removed."
  );


  await renderGroupsPage();
}


async function openGroupGrantAdd(
  groupId,
) {

  const [
    models,
    profiles,
  ] = await Promise.all([
    api(
      "/api/v1/admin/models"
    ),

    api(
      "/api/v1/admin/profiles"
    ),
  ]);


  const targets = [
    ...models.models.map(
      model => ({
        type:
          "model",

        id:
          model.id,

        label:
          `${model.name} · model${
            model.enabled
              ? ""
              : " · disabled"
          }`,
      })
    ),

    ...profiles.profiles.map(
      profile => ({
        type:
          "profile",

        id:
          profile.id,

        label:
          `${profile.name} · profile${
            profile.enabled
              ? ""
              : " · disabled"
          }`,
      })
    ),
  ];


  if (!targets.length) {

    showToast(
      "No model or profile targets are available.",
      true
    );

    return;
  }


  openModal(
    "Add group grant",
    `
      <form id="group-grant-add-form">

        <div class="field">

          <label>
            Model or profile
          </label>

          <select
            name="target"
            required
          >

            ${
              targets
                .map(
                  target => `
                    <option
                      value="${target.type}:${target.id}"
                    >
                      ${escapeHtml(
                        target.label
                      )}
                    </option>
                  `
                )
                .join("")
            }

          </select>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Add grant
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#group-grant-add-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const values =
          new FormData(
            event.currentTarget
          );


        const [
          targetType,
          targetId,
        ] = String(
          values.get(
            "target"
          )
        ).split(":");


        try {

          await api(
            "/api/v1/admin/grants",
            {
              method: "POST",

              body: {
                principal_type:
                  "group",

                principal_id:
                  Number(
                    groupId
                  ),

                target_type:
                  targetType,

                target_id:
                  Number(
                    targetId
                  ),
              },
            },
          );


          closeModal();

          showToast(
            "Group grant added."
          );


          await renderGroupsPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function loadGrantsPageState() {

  const view =
    state.view.grants;


  const params =
    new URLSearchParams({
      paginated:
        "true",

      page:
        String(view.page),

      page_size:
        String(view.pageSize),
    });


  if (view.principalType) {
    params.set(
      "principal_type",
      view.principalType
    );
  }


  if (view.subject) {
    params.set(
      "subject",
      view.subject
    );
  }


  if (view.targetType) {
    params.set(
      "target_type",
      view.targetType
    );
  }


  if (view.target) {
    params.set(
      "target",
      view.target
    );
  }


  const data =
    await api(
      `/api/v1/admin/grants?${params}`
    );


  state.grants =
    data.grants;

  state.grantsPagination =
    data.pagination;


  if (
    Number(data.pagination.page)
    !== Number(view.page)
  ) {
    view.page =
      Number(data.pagination.page);

    replaceCurrentViewRoute();
  }
}


async function refreshGrantsResults() {

  await loadGrantsPageState();


  const table =
    document.querySelector(
      "#grants-results"
    );


  const pagination =
    document.querySelector(
      "#grants-pagination"
    );


  if (table) {
    table.innerHTML =
      renderGrants();
  }


  if (pagination) {
    pagination.innerHTML =
      renderAccessPagination(
        "grants"
      );
  }
}


async function renderGrantsPage() {

  await loadGrantsPageState();


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Grants
        </h1>

        <p class="page-description">
          Explicit user and group authorization policy
        </p>

      </div>

      <button
        class="button button-primary"
        data-action="grant-create"
      >
        New grant
      </button>

    </div>


    <div class="filters access-filters access-filters-5">

      <select id="grants-principal-type">

        <option value="">
          All subjects
        </option>

        <option value="user">
          Users
        </option>

        <option value="group">
          Groups
        </option>

      </select>


      <input
        id="grants-subject-filter"
        type="search"
        placeholder="Email or group name"
        value="${escapeHtml(
          state.view.grants.subject
        )}"
      >


      <select id="grants-target-type">

        <option value="">
          All resources
        </option>

        <option value="model">
          Models
        </option>

        <option value="profile">
          Profiles
        </option>

      </select>


      <input
        id="grants-target-filter"
        type="search"
        placeholder="Model or profile name"
        value="${escapeHtml(
          state.view.grants.target
        )}"
      >


      <select id="grants-page-size">

        <option value="25">25 / page</option>
        <option value="50">50 / page</option>
        <option value="100">100 / page</option>

      </select>

    </div>


    <div id="grants-results">
      ${renderGrants()}
    </div>


    <div id="grants-pagination">
      ${renderAccessPagination(
        "grants"
      )}
    </div>
  `;


  const principalType =
    document.querySelector(
      "#grants-principal-type"
    );


  const subject =
    document.querySelector(
      "#grants-subject-filter"
    );


  const targetType =
    document.querySelector(
      "#grants-target-type"
    );


  const target =
    document.querySelector(
      "#grants-target-filter"
    );


  const pageSize =
    document.querySelector(
      "#grants-page-size"
    );


  principalType.value =
    state.view.grants.principalType;

  targetType.value =
    state.view.grants.targetType;

  pageSize.value =
    String(
      state.view.grants.pageSize
    );


  const refreshFilter =
    async () => {

      state.view.grants.principalType =
        principalType.value;

      state.view.grants.subject =
        subject.value;

      state.view.grants.targetType =
        targetType.value;

      state.view.grants.target =
        target.value;

      state.view.grants.page =
        1;

      replaceCurrentViewRoute();

      await refreshGrantsResults();
    };


  principalType.addEventListener(
    "change",
    refreshFilter
  );


  targetType.addEventListener(
    "change",
    refreshFilter
  );


  pageSize.addEventListener(
    "change",
    async () => {

      state.view.grants.pageSize =
        Number(
          pageSize.value
        );

      state.view.grants.page =
        1;

      replaceCurrentViewRoute();

      await refreshGrantsResults();
    },
  );


  let searchTimer = null;


  const delayedSearch =
    () => {

      state.view.grants.subject =
        subject.value;

      state.view.grants.target =
        target.value;

      state.view.grants.page =
        1;

      replaceCurrentViewRoute();

      clearTimeout(searchTimer);

      searchTimer =
        setTimeout(
          () => {

            refreshGrantsResults()
              .catch(
                error =>
                  showToast(
                    error.message,
                    true
                  )
              );

          },
          250,
        );
    };


  subject.addEventListener(
    "input",
    delayedSearch
  );


  target.addEventListener(
    "input",
    delayedSearch
  );
}


async function renderCurrentAccessPage() {

  if (
    state.page === "users"
  ) {
    await renderUsersPage();
    return;
  }


  if (
    state.page === "groups"
  ) {
    await renderGroupsPage();
    return;
  }


  if (
    state.page === "grants"
  ) {
    await renderGrantsPage();
    return;
  }


  await renderUsersPage();
}


async function renderAccess() {

  const [
    users,
    groups,
    grants,
  ] = await Promise.all([
    api(
      "/api/v1/admin/users"
    ),

    api(
      "/api/v1/admin/groups"
    ),

    api(
      "/api/v1/admin/grants"
    ),
  ]);


  state.users =
    users.users;

  state.groups =
    groups.groups;

  state.grants =
    grants.grants;


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          Access
        </h1>

        <p class="page-description">
          Users, groups, memberships and inference grants
        </p>

      </div>

    </div>


    <section>

      <div class="section-heading">

        <h2 class="section-title">
          Users
        </h2>

        <button
          class="button button-small"
          data-action="user-create"
        >
          New user
        </button>

      </div>

      ${renderUsers()}

    </section>


    <section class="section">

      <div class="section-heading">

        <h2 class="section-title">
          Groups
        </h2>

        <button
          class="button button-small"
          data-action="group-create"
        >
          New group
        </button>

      </div>

      ${renderGroups()}

    </section>


    <section class="section">

      <div class="section-heading">

        <h2 class="section-title">
          Grants
        </h2>

        <button
          class="button button-small"
          data-action="grant-create"
        >
          New grant
        </button>

      </div>

      ${renderGrants()}

    </section>
  `;
}


function renderUsers() {

  if (!state.users.length) {

    return `
      <div class="card empty">
        No users match the current email filter.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Email</th>
            <th>User</th>
            <th>Role</th>
            <th>State</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${
            state.users
              .map(
                user => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        user.email
                        || "—"
                      )}
                    </td>


                    <td>
                      ${escapeHtml(
                        user.username
                      )}
                    </td>


                    <td>
                      ${
                        user.role
                        === "admin"
                          ? "Administrator"
                          : "User"
                      }
                    </td>


                    <td>
                      ${statusBadge(
                        user.enabled
                          ? "enabled"
                          : "disabled",

                        user.enabled
                          ? "green"
                          : "red"
                      )}
                    </td>


                    <td>

                      <button
                        class="button button-small"
                        data-action="user-open"
                        data-id="${user.id}"
                      >
                        Open
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function renderGroups() {

  if (!state.groups.length) {

    return `
      <div class="card empty">
        No user-managed groups match the current filters.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Group</th>
            <th>State</th>
            <th></th>
          </tr>

        </thead>

        <tbody>

          ${
            state.groups
              .map(
                group => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        group.name
                      )}
                    </td>


                    <td>
                      ${statusBadge(
                        group.enabled
                          ? "enabled"
                          : "disabled",

                        group.enabled
                          ? "green"
                          : "red"
                      )}
                    </td>


                    <td>

                      <button
                        class="button button-small"
                        data-action="group-open"
                        data-id="${group.id}"
                      >
                        Open
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


function renderGrants() {

  if (!state.grants.length) {

    return `
      <div class="card empty">
        No explicit user/group grants.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Principal</th>
            <th>Type</th>
            <th>Target</th>
            <th>Target type</th>
            <th>Actions</th>
          </tr>

        </thead>

        <tbody>

          ${
            state.grants
              .map(
                grant => `
                  <tr>

                    <td class="table-primary">
                      ${escapeHtml(
                        grant.principal_type
                        === "user"
                          ? (
                              grant.principal_email
                              ||
                              grant.principal_name
                            )
                          : grant.principal_name
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        grant.principal_type
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        grant.target_name
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        grant.target_type
                      )}
                    </td>

                    <td>

                      <button
                        class="button button-small button-danger"
                        data-action="grant-remove"
                        data-id="${grant.id}"
                      >
                        Remove
                      </button>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


/* ============================================================
   ACCESS MANAGEMENT
   ============================================================ */

function openUserCreate() {

  openModal(
    "New user",
    `
      <form id="user-create-form">

        <div class="form-grid">

          <div class="field">

            <label>
              Username
            </label>

            <input
              name="username"
              minlength="3"
              maxlength="64"
              autocomplete="off"
              required
            >

          </div>


          <div class="field">

            <label>
              Email
            </label>

            <input
              name="email"
              type="email"
              maxlength="320"
            >

          </div>


          <div class="field">

            <label>
              Role
            </label>

            <input
              value="User"
              readonly
            >

            <div class="table-secondary">
              Administrator roles are managed server-side.
            </div>

          </div>


          <div class="field">

            <label>
              Password
            </label>

            <input
              name="password"
              type="password"
              minlength="12"
              maxlength="256"
              autocomplete="new-password"
              required
            >

          </div>


          <div class="field field-full">

            <label>
              Confirm password
            </label>

            <input
              name="password_confirm"
              type="password"
              minlength="12"
              maxlength="256"
              autocomplete="new-password"
              required
            >

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Create user
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#user-create-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        const password =
          String(
            form.get(
              "password"
            )
          );


        if (
          password
          !==
          String(
            form.get(
              "password_confirm"
            )
          )
        ) {

          showToast(
            "Passwords do not match.",
            true
          );

          return;
        }


        try {

          const result =
            await api(
              "/api/v1/admin/users",
              {
                method: "POST",

                body: {
                  username:
                    form.get(
                      "username"
                    ),

                  email:
                    String(
                      form.get(
                        "email"
                      )
                      || ""
                    ).trim()
                    || null,

                  password,
                },
              },
            );


          closeModal();


          showToast(
            `User ${result.username} created.`
          );


          await renderCurrentAccessPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


function openUserEdit(
  userId,
) {

  const user =
    state.users.find(
      item =>
        Number(item.id)
        ===
        Number(userId)
    );


  if (!user) {

    throw new Error(
      "USER_NOT_FOUND"
    );
  }


  openModal(
    `Edit ${user.username}`,
    `
      <form id="user-edit-form">

        <div class="field">

          <label>
            Email
          </label>

          <input
            name="email"
            type="email"
            maxlength="320"
            value="${escapeHtml(
              user.email
              || ""
            )}"
          >

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Save
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#user-edit-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        try {

          await api(
            `/api/v1/admin/users/${userId}`,
            {
              method: "PATCH",

              body: {
                email:
                  String(
                    form.get(
                      "email"
                    )
                    || ""
                  ).trim()
                  || null,
              },
            },
          );


          closeModal();

          showToast(
            "User updated."
          );

          await renderCurrentAccessPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


function openUserPassword(
  userId,
) {

  const user =
    state.users.find(
      item =>
        Number(item.id)
        ===
        Number(userId)
    );


  if (!user) {

    throw new Error(
      "USER_NOT_FOUND"
    );
  }


  openModal(
    `Reset password · ${user.username}`,
    `
      <form id="user-password-form">

        <div class="field">

          <label>
            New password
          </label>

          <input
            name="password"
            type="password"
            minlength="12"
            maxlength="256"
            autocomplete="new-password"
            required
          >

        </div>


        <div
          class="field"
          style="margin-top:15px"
        >

          <label>
            Confirm password
          </label>

          <input
            name="password_confirm"
            type="password"
            minlength="12"
            maxlength="256"
            autocomplete="new-password"
            required
          >

        </div>


        <div class="secret-warning">

          Resetting the password revokes this user's
          browser sessions. API keys are not changed.

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Reset password
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#user-password-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        const password =
          String(
            form.get(
              "password"
            )
          );


        if (
          password
          !==
          String(
            form.get(
              "password_confirm"
            )
          )
        ) {

          showToast(
            "Passwords do not match.",
            true
          );

          return;
        }


        try {

          await api(
            `/api/v1/admin/users/${userId}/password`,
            {
              method: "POST",

              body: {
                password,
              },
            },
          );


          closeModal();

          showToast(
            "Password reset."
          );


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function setUserEnabled(
  userId,
  enabled,
) {

  const user =
    state.users.find(
      item =>
        Number(item.id)
        ===
        Number(userId)
    );


  if (!user) {

    throw new Error(
      "USER_NOT_FOUND"
    );
  }


  if (
    !enabled
    &&
    !window.confirm(
      `Disable ${user.username}? Existing API keys will be blocked.`
    )
  ) {

    return;
  }


  await api(
    `/api/v1/admin/users/${userId}/${
      enabled
        ? "enable"
        : "disable"
    }`,
    {
      method: "POST",
    },
  );


  showToast(
    enabled
      ? "User enabled. Historical keys remain blocked."
      : "User disabled."
  );


  await renderCurrentAccessPage();
}


function openGroupCreate() {

  openModal(
    "New group",
    `
      <form id="group-create-form">

        <div class="field">

          <label>
            Group name
          </label>

          <input
            name="name"
            minlength="2"
            maxlength="80"
            required
          >

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Create group
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#group-create-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        try {

          const group =
            await api(
              "/api/v1/admin/groups",
              {
                method: "POST",

                body: {
                  name:
                    form.get(
                      "name"
                    ),
                },
              },
            );


          closeModal();

          showToast(
            `Group ${group.name} created.`
          );

          await renderCurrentAccessPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


function openGroupRename(
  groupId,
) {

  const group =
    state.groups.find(
      item =>
        Number(item.id)
        ===
        Number(groupId)
    );


  if (!group) {

    throw new Error(
      "GROUP_NOT_FOUND"
    );
  }


  openModal(
    `Rename ${group.name}`,
    `
      <form id="group-rename-form">

        <div class="field">

          <label>
            Group name
          </label>

          <input
            name="name"
            minlength="2"
            maxlength="80"
            value="${escapeHtml(
              group.name
            )}"
            required
          >

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Save
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#group-rename-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        try {

          await api(
            `/api/v1/admin/groups/${groupId}`,
            {
              method: "PATCH",

              body: {
                name:
                  form.get(
                    "name"
                  ),
              },
            },
          );


          closeModal();

          showToast(
            "Group renamed."
          );

          await renderCurrentAccessPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function setGroupEnabled(
  groupId,
  enabled,
) {

  const group =
    state.groups.find(
      item =>
        Number(item.id)
        ===
        Number(groupId)
    );


  if (!group) {

    throw new Error(
      "GROUP_NOT_FOUND"
    );
  }


  if (
    !enabled
    &&
    !window.confirm(
      `Disable ${group.name}? Existing group keys will be blocked.`
    )
  ) {

    return;
  }


  await api(
    `/api/v1/admin/groups/${groupId}/${
      enabled
        ? "enable"
        : "disable"
    }`,
    {
      method: "POST",
    },
  );


  showToast(
    enabled
      ? "Group enabled. Historical keys remain blocked."
      : "Group disabled."
  );


  await renderCurrentAccessPage();
}


async function openGrantCreate() {

  const [
    users,
    groups,
    models,
    profiles,
  ] = await Promise.all([
    api(
      "/api/v1/admin/users"
    ),

    api(
      "/api/v1/admin/groups"
    ),

    api(
      "/api/v1/admin/models"
    ),

    api(
      "/api/v1/admin/profiles"
    ),
  ]);


  const principals = [
    ...users.users.map(
      user => ({
        type:
          "user",

        id:
          user.id,

        label:
          `${user.username} · user`,
      })
    ),

    ...groups.groups.map(
      group => ({
        type:
          "group",

        id:
          group.id,

        label:
          `${group.name} · group`,
      })
    ),
  ];


  const targets = [
    ...models.models.map(
      model => ({
        type:
          "model",

        id:
          model.id,

        label:
          `${model.name} · model${
            model.enabled
              ? ""
              : " · disabled"
          }`,
      })
    ),

    ...profiles.profiles.map(
      profile => ({
        type:
          "profile",

        id:
          profile.id,

        label:
          `${profile.name} · profile${
            profile.enabled
              ? ""
              : " · disabled"
          }`,
      })
    ),
  ];


  if (
    !principals.length
    ||
    !targets.length
  ) {

    showToast(
      "A principal and target are required before creating a grant.",
      true
    );

    return;
  }


  openModal(
    "New grant",
    `
      <form id="grant-create-form">

        <div class="form-grid">

          <div class="field">

            <label>
              User or group
            </label>

            <select
              name="principal"
              required
            >

              ${
                principals
                  .map(
                    principal => `
                      <option
                        value="${
                          principal.type
                        }:${
                          principal.id
                        }"
                      >
                        ${escapeHtml(
                          principal.label
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>


          <div class="field">

            <label>
              Model or profile
            </label>

            <select
              name="target"
              required
            >

              ${
                targets
                  .map(
                    target => `
                      <option
                        value="${
                          target.type
                        }:${
                          target.id
                        }"
                      >
                        ${escapeHtml(
                          target.label
                        )}
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Create grant
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#grant-create-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        const [
          principalType,
          principalId,
        ] = String(
          form.get(
            "principal"
          )
        ).split(":");


        const [
          targetType,
          targetId,
        ] = String(
          form.get(
            "target"
          )
        ).split(":");


        try {

          await api(
            "/api/v1/admin/grants",
            {
              method: "POST",

              body: {
                principal_type:
                  principalType,

                principal_id:
                  Number(
                    principalId
                  ),

                target_type:
                  targetType,

                target_id:
                  Number(
                    targetId
                  ),
              },
            },
          );


          closeModal();

          showToast(
            "Grant created."
          );

          await renderCurrentAccessPage();


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


async function removeGrant(
  grantId,
) {

  if (
    !window.confirm(
      "Remove this access grant? Existing keys will be synchronized to the reduced access."
    )
  ) {

    return;
  }


  await api(
    `/api/v1/admin/grants/${grantId}`,
    {
      method: "DELETE",
    },
  );


  showToast(
    "Grant removed."
  );


  await renderCurrentAccessPage();
}


/* ============================================================
   API KEYS
   ============================================================ */

function formatDateTime(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);
  }


  return date.toLocaleString();
}


async function copyText(
  value,
) {

  if (
    window.isSecureContext
    &&
    navigator.clipboard
    &&
    navigator.clipboard.writeText
  ) {

    await navigator.clipboard.writeText(
      value
    );

    return;
  }


  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    value;

  textarea.setAttribute(
    "readonly",
    ""
  );

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  textarea.style.pointerEvents =
    "none";


  document.body.appendChild(
    textarea
  );


  try {

    textarea.focus();

    textarea.select();

    textarea.setSelectionRange(
      0,
      textarea.value.length
    );


    const copied =
      document.execCommand(
        "copy"
      );


    if (!copied) {

      throw new Error(
        "CLIPBOARD_COPY_FAILED"
      );
    }


  } finally {

    textarea.remove();
  }
}


async function renderApiKeys() {

  const usersResponse =
    await api(
      "/api/v1/admin/users"
    );


  state.users =
    usersResponse.users;


  if (!state.users.length) {

    pageElement().innerHTML = `
      <div class="page-header">

        <div>

          <h1 class="page-title">
            API Keys
          </h1>

        </div>

      </div>

      <div class="card empty">
        No users exist.
      </div>
    `;

    return;
  }


  const selectedStillExists =
    state.users.some(
      user =>
        Number(user.id)
        ===
        Number(
          state.apiKeyUserId
        )
    );


  if (!selectedStillExists) {

    const preferred =
      state.users.find(
        user =>
          Number(user.id)
          ===
          Number(
            state.user?.id
          )
      )
      ||
      state.users[0];


    state.apiKeyUserId =
      preferred.id;
  }


  const page =
    pageElement();


  page.innerHTML = `
    <div class="page-header">

      <div>

        <h1 class="page-title">
          API Keys
        </h1>

        <p class="page-description">
          User credentials for exact callable inference profiles
        </p>

      </div>

    </div>


    <div class="filters">

      <select id="api-key-user-select">

        ${
          state.users
            .map(
              user => `
                <option
                  value="${user.id}"
                  ${
                    Number(user.id)
                    ===
                    Number(
                      state.apiKeyUserId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    user.username
                  )}
                  ${
                    user.enabled
                      ? ""
                      : " · disabled"
                  }
                </option>
              `
            )
            .join("")
        }

      </select>

    </div>


    <div id="api-key-user-panel">

      <div class="card empty">
        Loading API keys...
      </div>

    </div>
  `;


  document
    .querySelector(
      "#api-key-user-select"
    )
    .addEventListener(
      "change",
      async event => {

        state.apiKeyUserId =
          Number(
            event.target.value
          );


        await renderApiKeyUserPanel(
          state.apiKeyUserId
        );
      },
    );


  await renderApiKeyUserPanel(
    state.apiKeyUserId
  );
}


async function renderApiKeyUserPanel(
  userId,
) {

  const panel =
    document.querySelector(
      "#api-key-user-panel"
    );


  if (!panel) {
    return;
  }


  const [
    contextResponse,
    keyResponse,
  ] = await Promise.all([
    api(
      `/api/v1/admin/users/${userId}/api-key-contexts`
    ),

    api(
      `/api/v1/admin/users/${userId}/api-keys`
    ),
  ]);


  const contexts =
    contextResponse.contexts;

  const keys =
    keyResponse.api_keys;


  const user =
    state.users.find(
      item =>
        Number(item.id)
        ===
        Number(userId)
    );


  const usableContexts =
    contexts.filter(
      context =>
        context.available
    );


  panel.innerHTML = `
    <section>

      <div class="card">

        <div class="card-header">

          <div>

            <div class="card-title">
              ${escapeHtml(
                user?.username
                || `User ${userId}`
              )}
            </div>

            <div
              class="table-secondary"
              style="margin-top:4px"
            >
              ${
                user?.enabled
                  ? "Enabled user"
                  : "Disabled user · historical keys remain visible"
              }
            </div>

          </div>


          <button
            class="button button-primary"
            data-action="api-key-generate"
            data-id="${userId}"
            ${
              usableContexts.length
                ? ""
                : "disabled"
            }
          >
            Generate API key
          </button>

        </div>


        <div class="card-body">

          ${
            contexts.length
              ? `
                <div class="context-grid">

                  ${
                    contexts
                      .map(
                        context => `
                          <div class="context-card">

                            <div>

                              <div class="table-primary">
                                ${escapeHtml(
                                  context.name
                                )}
                              </div>

                              <div class="table-secondary">
                                ${
                                  context.available
                                    ? `${context.models.length} callable profile${
                                        context.models.length === 1
                                          ? ""
                                          : "s"
                                      }`
                                    : escapeHtml(
                                        context.reason
                                        || "Unavailable"
                                      )
                                }
                              </div>

                            </div>

                            ${
                              statusBadge(
                                context.available
                                  ? "available"
                                  : "unavailable",

                                context.available
                                  ? "green"
                                  : "neutral"
                              )
                            }

                          </div>
                        `
                      )
                      .join("")
                  }

                </div>
              `
              : `
                <div class="empty">
                  No API-key contexts are available for this user.
                </div>
              `
          }

        </div>

      </div>

    </section>


    <section class="section">

      <h2 class="section-title">
        Existing keys
      </h2>

      ${
        renderApiKeyTable(
          userId,
          keys
        )
      }

    </section>
  `;
}


function renderApiKeyTable(
  userId,
  keys,
) {

  if (!keys.length) {

    return `
      <div class="card empty">
        No managed API keys.
      </div>
    `;
  }


  return `
    <div class="table-wrap">

      <table>

        <thead>

          <tr>
            <th>Key</th>
            <th>Context</th>
            <th>Profiles</th>
            <th>State</th>
            <th>Spend</th>
            <th>Expires</th>
            <th>Last active</th>
            <th>Actions</th>
          </tr>

        </thead>

        <tbody>

          ${
            keys
              .map(
                key => `
                  <tr>

                    <td>

                      <div class="table-primary">
                        ${escapeHtml(
                          key.label
                          || "Unnamed key"
                        )}
                      </div>

                      <div class="table-secondary mono">
                        ${escapeHtml(
                          key.key_alias
                        )}
                      </div>

                    </td>


                    <td>
                      ${escapeHtml(
                        key.context_name
                      )}
                    </td>


                    <td>

                      <div class="table-primary">
                        ${key.models.length}
                      </div>

                      <div
                        class="table-secondary"
                        title="${escapeHtml(
                          key.models.join(
                            "\n"
                          )
                        )}"
                      >
                        callable profiles
                      </div>

                    </td>


                    <td>
                      ${
                        statusBadge(
                          key.blocked
                            ? "blocked"
                            : "active",

                          key.blocked
                            ? "red"
                            : "green"
                        )
                      }
                    </td>


                    <td>
                      ${escapeHtml(
                        key.spend
                        ?? "—"
                      )}
                    </td>


                    <td>
                      ${escapeHtml(
                        formatDateTime(
                          key.expires
                        )
                      )}
                    </td>


                    <td>
                      ${escapeHtml(
                        key.last_active
                          ? age(
                              key.last_active
                            )
                          : "Never"
                      )}
                    </td>


                    <td>

                      <div class="row-actions">

                        <button
                          class="button button-small button-danger"
                          data-action="api-key-block"
                          data-id="${userId}"
                          data-alias="${escapeHtml(
                            key.key_alias
                          )}"
                          ${
                            key.blocked
                              ? "disabled"
                              : ""
                          }
                        >
                          Block
                        </button>

                      </div>

                    </td>

                  </tr>
                `
              )
              .join("")
          }

        </tbody>

      </table>

    </div>
  `;
}


async function openApiKeyGenerate(
  userId,
) {

  const result =
    await api(
      `/api/v1/admin/users/${userId}/api-key-contexts`
    );


  const contexts =
    result.contexts.filter(
      context =>
        context.available
    );


  if (!contexts.length) {

    showToast(
      "This user has no available API-key context.",
      true
    );

    return;
  }


  openModal(
    "Generate API key",
    `
      <form id="api-key-generate-form">

        <div class="form-grid">

          <div class="field field-full">

            <label>
              Access context
            </label>

            <select
              name="context_id"
              required
            >

              ${
                contexts
                  .map(
                    context => `
                      <option
                        value="${escapeHtml(
                          context.context_id
                        )}"
                      >
                        ${escapeHtml(
                          context.name
                        )}
                        ·
                        ${context.models.length}
                        profiles
                      </option>
                    `
                  )
                  .join("")
              }

            </select>

          </div>


          <div class="field">

            <label>
              Duration
            </label>

            <select
              name="duration_days"
            >
              <option value="1">
                1 day
              </option>
              <option value="7">
                7 days
              </option>
              <option
                value="30"
                selected
              >
                30 days
              </option>
              <option value="90">
                90 days
              </option>
              <option value="365">
                1 year
              </option>
            </select>

          </div>


          <div class="field">

            <label>
              Label
            </label>

            <input
              name="label"
              maxlength="120"
              placeholder="pentest-client"
            >

          </div>

        </div>


        <div class="form-actions">

          <button
            type="button"
            class="button button-quiet"
            data-action="close-modal"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="button button-primary"
          >
            Generate key
          </button>

        </div>

      </form>
    `,
  );


  document
    .querySelector(
      "#api-key-generate-form"
    )
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const form =
          new FormData(
            event.currentTarget
          );


        try {

          const created =
            await api(
              `/api/v1/admin/users/${userId}/api-keys`,
              {
                method: "POST",

                body: {
                  context_id:
                    form.get(
                      "context_id"
                    ),

                  duration_days:
                    Number(
                      form.get(
                        "duration_days"
                      )
                    ),

                  label:
                    String(
                      form.get(
                        "label"
                      )
                      || ""
                    ).trim()
                    || null,
                },
              },
            );


          revealGeneratedApiKey(
            created
          );


        } catch (error) {

          showToast(
            error.message,
            true
          );
        }
      },
    );
}


function revealGeneratedApiKey(
  created,
) {

  openModal(
    "API key created",
    `
      <div class="secret-warning">

        This secret is shown once.
        Copy it now. It cannot be recovered later.

      </div>


      <div class="secret-box">

        <div class="muted small">
          ${escapeHtml(
            created.label
            || created.context_name
          )}
        </div>

        <code
          id="generated-api-key"
          class="secret-value"
        ></code>

      </div>


      <div class="form-actions">

        <button
          class="button button-primary"
          data-action="copy-generated-key"
        >
          Copy and close
        </button>

      </div>
    `,
  );


  /*
   * Never interpolate plaintext into HTML.
   * textContent prevents markup interpretation.
   */
  document
    .querySelector(
      "#generated-api-key"
    )
    .textContent =
      created.key;
}


async function blockApiKey(
  userId,
  alias,
) {

  if (
    !window.confirm(
      "Block this API key permanently?"
    )
  ) {

    return;
  }


  await api(
    `/api/v1/admin/users/${userId}/api-keys/${
      encodeURIComponent(alias)
    }/block`,
    {
      method: "POST",
    },
  );


  showToast(
    "API key blocked."
  );


  await renderApiKeyUserPanel(
    userId
  );
}


/* ============================================================
   EVENTS
   ============================================================ */

document.addEventListener(
  "click",
  async event => {

    const pageButton =
      event.target.closest(
        "[data-page]"
      );


    if (pageButton) {

      await navigate(
        pageButton.dataset.page
      );

      return;
    }


    const actionButton =
      event.target.closest(
        "[data-action]"
      );


    if (!actionButton) {
      return;
    }


    const action =
      actionButton.dataset.action;

    const id =
      Number(
        actionButton.dataset.id
      );


    try {

      switch (action) {

        case "logout":

          await api(
            "/api/v1/auth/logout",
            {
              method: "POST",
            },
          );

          state.user = null;
          state.csrf = null;

          stopPolling();

          renderLogin();

          break;


        case "close-modal":

          closeModal();

          break;


        case "create-model":

          openModelCreate();

          break;


        case "create-profile":

          await openProfileCreate();

          break;


        case "profile-from-model":

          await openProfileCreate(
            id
          );

          break;


        case "model-upstream":

          await checkModelUpstream(
            id
          );

          break;


        case "model-install":

          await openModelInstall(
            id
          );

          break;


        case "model-copy":

          await openModelCopy(
            id
          );

          break;


        case "model-disable":

          await setModelEnabled(
            id,
            false
          );

          break;


        case "model-enable":

          await setModelEnabled(
            id,
            true
          );

          break;


        case "profile-edit":

          await openProfileEdit(
            id
          );

          break;


        case "profile-disable":

          await setProfileEnabled(
            id,
            false
          );

          break;


        case "profile-enable":

          await setProfileEnabled(
            id,
            true
          );

          break;


        case "profile-check":

          await runProfileAction(
            id,
            "check"
          );

          break;


        case "profile-up":

          await runProfileAction(
            id,
            "up"
          );

          break;


        case "profile-down":

          await runProfileAction(
            id,
            "down"
          );

          break;


        case "operation-view":

          await watchOperation(
            id
          );

          break;


        case "access-page":

          await changeAccessPage(
            actionButton.dataset.scope,
            Number(
              actionButton.dataset.page
            ),
          );

          break;


        case "user-open":

          await openUserFromList(
            id
          );

          break;


        case "users-back":

          await returnToUsersList();

          break;


        case "user-group-add":

          await openUserGroupAdd(
            id
          );

          break;


        case "user-group-remove":

          await removeUserGroup(
            id,
            Number(
              actionButton.dataset.groupId
            ),
          );

          break;


        case "user-grant-add":

          await openUserGrantAdd(
            id
          );

          break;


        case "user-admin-help":

          openUserAdminHelp(
            id
          );

          break;


        case "user-create":

          openUserCreate();

          break;


        case "user-edit":

          openUserEdit(
            id
          );

          break;


        case "user-password":

          openUserPassword(
            id
          );

          break;


        case "user-disable":

          await setUserEnabled(
            id,
            false
          );

          break;


        case "user-enable":

          await setUserEnabled(
            id,
            true
          );

          break;


        case "group-open":

          await openGroupFromList(
            id
          );

          break;


        case "groups-back":

          await returnToGroupsList();

          break;


        case "group-member-add":

          await openGroupMemberAdd(
            id
          );

          break;


        case "group-grant-add":

          await openGroupGrantAdd(
            id
          );

          break;


        case "group-create":

          openGroupCreate();

          break;


        case "group-rename":

          openGroupRename(
            id
          );

          break;


        case "group-disable":

          await setGroupEnabled(
            id,
            false
          );

          break;


        case "group-enable":

          await setGroupEnabled(
            id,
            true
          );

          break;


        case "group-member-remove":

          await removeGroupMember(
            id,
            Number(
              actionButton.dataset.userId
            )
          );

          break;


        case "grant-create":

          await openGrantCreate();

          break;


        case "grant-remove":

          await removeGrant(
            id
          );

          break;


        case "api-keys-for-user":

          state.apiKeyUserId =
            id;

          await navigate(
            "api-keys"
          );

          break;


        case "api-key-generate":

          await openApiKeyGenerate(
            id
          );

          break;


        case "api-key-block":

          await blockApiKey(
            id,
            actionButton.dataset.alias
          );

          break;


        case "copy-generated-key": {

          const element =
            document.querySelector(
              "#generated-api-key"
            );


          if (!element) {

            throw new Error(
              "API_KEY_SECRET_NOT_FOUND"
            );
          }


          await copyText(
            element.textContent
          );


          closeModal();

          showToast(
            "API key copied. Secret removed from this page."
          );

          await renderApiKeys();

          break;
        }
      }


    } catch (error) {

      showToast(
        error.message,
        true
      );
    }
  },
);


/* ============================================================
   POLLING
   ============================================================ */

function stopPolling() {

  if (
    state.pollTimer
  ) {

    clearInterval(
      state.pollTimer
    );

    state.pollTimer =
      null;
  }
}


function startPolling() {

  stopPolling();


  let interval = null;


  if (
    [
      "overview",
      "workers",
      "profiles",
      "models",
    ].includes(
      state.page
    )
  ) {

    interval = 5000;
  }


  if (
    state.page
    === "operations"
  ) {

    interval = 3000;
  }


  if (!interval) {
    return;
  }


  state.pollTimer =
    setInterval(
      async () => {

        /*
         * Never replace an administrator's open modal or
         * in-progress form with a background refresh.
         */
        if (
          modal.open
        ) {

          return;
        }


        try {

          if (
            state.page
            === "profiles"
          ) {

            await refreshProfilesLive();

            return;
          }


          if (
            state.page
            === "operations"
          ) {

            await refreshOperationsLive();

            return;
          }


          await renderCurrentPage();


        } catch {

          // Keep the last successful view.
        }

      },
      interval,
    );
}


/* ============================================================
   INITIALIZATION
   ============================================================ */

async function initialize() {

  try {

    const me = await api(
      "/api/v1/auth/me",
      {
        csrf: false,
      },
    );


    state.user =
      me.user;


    if (
      state.user.role
      !== "admin"
    ) {

      renderLogin(
        "This interface currently requires an administrator account."
      );

      return;
    }


    const csrf = await api(
      "/api/v1/auth/csrf",
      {
        csrf: false,
      },
    );


    state.csrf =
      csrf.csrf_token;


    renderShell();


    const route =
      readHashRoute();


    loadViewStateFromRoute(
      route
    );


    await navigate(
      route.page,
      {
        syncHash: false,
      },
    );


  } catch {

    renderLogin();
  }
}


window.addEventListener(
  "hashchange",
  () => {

    const route =
      readHashRoute();


    loadViewStateFromRoute(
      route
    );


    if (
      state.user
      &&
      route.page
      !== state.page
    ) {

      navigate(
        route.page,
        {
          syncHash: false,
        },
      );
    }
  },
);


initialize();
