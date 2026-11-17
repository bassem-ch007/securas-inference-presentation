/* Securas Inference — lightweight static hash-routed site. No dependencies. */
const layers = [
  {
    id: "context", category: "FOUNDATION", label: "01", title: "Context & objectives", tagline: "Why private LLM inference?",
    summary: "The problem, the constraints, and the reason for a centrally managed on-premises platform.",
    focus: ["Data control and privacy", "Local inference with no cloud fallback", "Goals and scope"], status: "outline"
  },
  {
    id: "hardware", category: "FOUNDATION", label: "02", title: "Hardware & experiments", tagline: "From proof of concept to multi-GPU workers",
    summary: "Three machines, their roles, GPU allocation, and the PCIe bandwidth experiments that shaped the final design.",
    focus: ["Prototype and single-GPU baseline", "Final three machines", "PCIe x1 risers, PP versus TP"], status: "reference assets saved"
  },
  {
    id: "network", category: "FOUNDATION", label: "03", title: "Private network", tagline: "LAN, NAT gateway, Tailscale VPN",
    summary: "How the workers reach the outside world and how authorized administrators reach the infrastructure privately.",
    focus: ["Master as gateway and NAT", "Worker network topology", "Tailscale / WireGuard / P2P"], status: "outline"
  },
  {
    id: "models", category: "INFERENCE", label: "04", title: "Models & profiles", tagline: "What runs on each GPU worker",
    summary: "Model artifacts, multiple runtime profiles, quantization, and the distinction between dense, MoE and multi-model serving.",
    focus: ["Model inventory", "GPU assignment", "Docker Compose deployments", "Dense vs MoE"], status: "outline"
  },
  {
    id: "vllm", category: "INFERENCE", label: "05", title: "vLLM runtime", tagline: "Efficient token generation",
    summary: "The runtime mechanics: prefill, decode, sequence length, KV cache, PagedAttention and scheduling.",
    focus: ["Context and sequences", "KV cache and PagedAttention", "Prefix caching", "PP / TP trade-offs"], status: "outline"
  },
  {
    id: "master", category: "CONTROL", label: "06", title: "Master & services", tagline: "The control plane",
    summary: "FastAPI under Uvicorn, PostgreSQL, the execution service, the monitoring service and their responsibilities.",
    focus: ["Control API", "PostgreSQL state", "Job execution", "Monitoring and health"], status: "outline"
  },
  {
    id: "ansible", category: "CONTROL", label: "07", title: "Ansible operations", tagline: "From an admin action to a running service",
    summary: "A simple operations tree covering model install/adopt, profile check/up/down, locks and execution results.",
    focus: ["Main playbooks", "Model completion markers", "Operation locking", "Deploy / stop workflow"], status: "outline"
  },
  {
    id: "dashboard", category: "CONTROL", label: "08", title: "Admin dashboard", tagline: "One interface for the platform",
    summary: "View hosts, GPUs, models and profiles, execute operations and manage users and authorizations.",
    focus: ["Inventory", "Profile actions", "Users, groups, grants", "Health and operations"], status: "outline"
  },
  {
    id: "gateway", category: "DELIVERY", label: "09", title: "LiteLLM gateway", tagline: "Controlled access to inference",
    summary: "Virtual API keys, model routes and isolated backend credentials behind a single OpenAI-compatible API.",
    focus: ["Consumer and backend keys", "Model routes", "Request path", "No cloud fallback"], status: "outline"
  },
  {
    id: "results", category: "DELIVERY", label: "10", title: "Benchmarks & outcomes", tagline: "Evidence, trade-offs, next steps",
    summary: "TTFT, token generation speed, measured context limits, concurrency and engineering lessons from real hardware.",
    focus: ["Benchmark protocol", "TTFT and tokens/s", "Hardware bottlenecks", "Engineering outcomes"], status: "outline"
  }
];

const groups = ["FOUNDATION", "INFERENCE", "CONTROL", "DELIVERY"];
const navElement = document.getElementById("nav");
const appElement = document.getElementById("app");
const crumb = document.getElementById("crumb-current");
const position = document.getElementById("position");

const htmlSafe = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const href = id => `#/${id}`;

function navMarkup(activeId) {
  const home = `<a class="nav-link ${activeId === "home" ? "active" : ""}" href="#/"><span class="nav-icon" aria-hidden="true">⌂</span><span>Overview</span></a>`;
  return home + groups.map(group => `
    <div class="nav-group-title">${group}</div>
    ${layers.filter(layer => layer.category === group).map(layer => `
      <a class="nav-link ${activeId === layer.id ? "active" : ""}" href="${href(layer.id)}" ${activeId === layer.id ? 'aria-current="page"' : ""}>
        <span class="nav-num">${layer.label}</span><span>${htmlSafe(layer.title)}</span>
      </a>`).join("")}`).join("");
}

function overviewMarkup() {
  return `
    <section class="hero enter">
      <div class="eyebrow"><span class="eyebrow-bar"></span> SELF-HOSTED AI INFRASTRUCTURE</div>
      <h1>Private infrastructure.<br/><span class="accent">Managed intelligence.</span></h1>
      <p class="lead">An on-premises inference platform that turns distributed GPU machines into centrally managed LLM services, accessible through controlled APIs.</p>
      <div class="hero-actions"><a class="button primary" href="#/hardware">Explore the architecture <span aria-hidden="true">↗</span></a><a class="button ghost" href="#/context">Project context <span aria-hidden="true">→</span></a></div>
      <div class="meta-pills"><span>03 machines</span><span>Multi-GPU workers</span><span>Local model serving</span><span>Centralized management</span></div>
    </section>
    <section class="overview-block enter">
      <div class="section-head"><div><div class="eyebrow quiet">SYSTEM AT A GLANCE</div><h2>One platform. Three responsibilities.</h2></div><span class="section-index">OVERVIEW / 01</span></div>
      <div class="responsibilities">
        <div class="responsibility"><span class="responsibility-number">01</span><h3>Compute</h3><p>GPU workers run local model profiles through Docker and vLLM.</p></div>
        <div class="responsibility"><span class="responsibility-number">02</span><h3>Control</h3><p>A master coordinates deployment, operations, monitoring and platform state.</p></div>
        <div class="responsibility"><span class="responsibility-number">03</span><h3>Access</h3><p>Authorized applications consume models through a unified gateway.</p></div>
      </div>
    </section>
    <section class="overview-block enter">
      <div class="section-head"><div><div class="eyebrow quiet">GUIDED EXPLORATION</div><h2>Explore the project layers.</h2></div><span class="section-index">${layers.length} AREAS</span></div>
      <div class="layer-grid">${layers.map(layer => `
        <a class="layer-card" href="${href(layer.id)}"><div class="card-top"><span class="layer-number">${layer.label}</span><span class="card-arrow" aria-hidden="true">↗</span></div><span class="card-category">${layer.category}</span><h3>${htmlSafe(layer.title)}</h3><p>${htmlSafe(layer.tagline)}</p></a>
      `).join("")}</div>
    </section>
    <section class="overview-block enter last-block"><div class="section-head"><div><div class="eyebrow quiet">TWO COMMUNICATION PATHS</div><h2>Administration and inference stay distinct.</h2></div></div>
      <div class="paths"><div><span class="path-label">MANAGEMENT PLANE</span><p>Administrator <b>→</b> FastAPI <b>→</b> Execution / Ansible <b>→</b> Worker</p></div><div><span class="path-label">INFERENCE PLANE</span><p>Client <b>→</b> LiteLLM <b>→</b> vLLM on Worker <b>→</b> Streamed Response</p></div></div>
    </section>
  `;
}

function sectionMarkup(layer, index) {
  const prev = index === 0 ? { id: "", title: "Overview" } : layers[index - 1];
  const next = layers[index + 1];
  return `
    <section class="detail-page enter">
      <div class="eyebrow"><span class="eyebrow-bar"></span> ${layer.category} <span class="small-separator">/</span> SECTION ${layer.label}</div>
      <div class="detail-title-line"><h1>${htmlSafe(layer.title)}<span class="detail-dot">.</span></h1><span class="draft-tag">CONTENT OUTLINE</span></div>
      <p class="lead detail-lead">${htmlSafe(layer.tagline)}</p>
      <div class="topic-panel"><div class="topic-panel-label">WHAT THIS SECTION EXPLAINS</div><p>${htmlSafe(layer.summary)}</p></div>
      <div class="section-head compact"><div><div class="eyebrow quiet">CONTENT TO REFINE TOGETHER</div><h2>Talking points</h2></div></div>
      <div class="point-grid">${layer.focus.map((point, pointIndex) => `<div class="point"><span class="point-count">${String(pointIndex+1).padStart(2,"0")}</span><h3>${htmlSafe(point)}</h3><p>Reserved for the detailed diagram, evidence or explanation.</p></div>`).join("")}</div>
      <div class="holding-note"><span class="holding-icon" aria-hidden="true">◇</span><div><strong>${layer.id === "hardware" ? "Hardware references preserved" : "Section reserved for collaboration"}</strong><p>${layer.id === "hardware" ? "The three supplied machine photographs are stored in assets/hardware-reference but intentionally not displayed. Your initial motherboard and PCIe testing story is on hold until we design this section." : "We will replace the placeholders with project-specific architecture diagrams, verified results and concise explanations, one section at a time."}</p></div></div>
      <div class="page-controls"><a class="text-link" href="${prev.id ? href(prev.id) : "#/"}">← ${htmlSafe(prev.title)}</a>${next ? `<a class="button primary small" href="${href(next.id)}">${htmlSafe(next.title)} →</a>` : `<a class="button primary small" href="#/">Back to overview ↗</a>`}</div>
    </section>
  `;
}

function getCurrentId() {
  const match = /^#\/([a-z0-9-]*)$/.exec(window.location.hash);
  return match ? (match[1] || "home") : "home";
}

function render() {
  const rawId = getCurrentId();
  const index = layers.findIndex(layer => layer.id === rawId);
  const current = index >= 0 ? layers[index] : null;
  const activeId = current ? current.id : "home";
  navElement.innerHTML = navMarkup(activeId);
  appElement.innerHTML = current ? sectionMarkup(current, index) : overviewMarkup();
  crumb.textContent = current ? current.title.toUpperCase() : "OVERVIEW";
  position.textContent = current ? `${current.label} / ${String(layers.length).padStart(2, "0")}` : "Overview";
  document.title = current ? `${current.title} · Securas Inference` : "Securas Inference · Architecture Walkthrough";
  window.scrollTo({top:0,behavior:"instant"});
}

function onKey(event) {
  const activeTag = document.activeElement?.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag) || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Escape") { window.location.hash = "#/"; return; }
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  const current = getCurrentId();
  const index = layers.findIndex(layer => layer.id === current);
  if (event.key === "ArrowRight") window.location.hash = href(layers[Math.min(index+1,layers.length-1)].id);
  else if (index <= 0) window.location.hash = "#/";
  else window.location.hash = href(layers[index-1].id);
}

window.addEventListener("hashchange", render);
window.addEventListener("keydown", onKey);
render();
