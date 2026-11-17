/* Securas Inference — lightweight static hash-routed site. No dependencies. */
const layers = [
  {
    id: "context", category: "FOUNDATION", label: "01", title: "Context & objectives", tagline: "Why private LLM inference?",
    summary: "Why local inference matters, the operational challenge, and how control and data planes work together.",
    focus: ["Privacy and control", "Centralized operations", "Control plane and data plane"], status: "complete"
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

    <section class="overview-block enter" aria-labelledby="architecture-stack-title">
      <div class="section-head">
        <div>
          <div class="eyebrow quiet">PLATFORM ARCHITECTURE</div>
          <h2 id="architecture-stack-title">Seven layers. One managed platform.</h2>
        </div>
        <span class="section-index">TOP → FOUNDATION</span>
      </div>
      <p class="stack-intro">A clear view of how the project is organized, from physical infrastructure to centralized administration.</p>
      <div class="architecture-stack" role="list" aria-label="Securas Inference project layers, top to bottom">
        <div class="stack-row stack-row--top" role="listitem">
          <span class="stack-number">07</span><div class="stack-name">Admin Dashboard</div>
          <p>Platform visibility, profile operations and user access</p>
        </div>
        <div class="stack-row stack-row--blue" role="listitem">
          <span class="stack-number">06</span><div class="stack-name">LiteLLM Gateway</div>
          <p>Unified inference API, virtual keys and model routing</p>
        </div>
        <div class="stack-row stack-row--green" role="listitem">
          <span class="stack-number">05</span><div class="stack-name">Ansible Execution Engine</div>
          <p>Admin-triggered model installation and profile lifecycle</p>
        </div>
        <div class="stack-row stack-row--blue" role="listitem">
          <span class="stack-number">04</span><div class="stack-name">LLM Models</div>
          <p>Local dense and mixture-of-experts model artifacts</p>
        </div>
        <div class="stack-row stack-row--green" role="listitem">
          <span class="stack-number">03</span><div class="stack-name">vLLM Runtime</div>
          <p>GPU inference, scheduling and efficient KV caching</p>
        </div>
        <div class="stack-row stack-row--blue" role="listitem">
          <span class="stack-number">02</span><div class="stack-name">Docker &amp; Compose</div>
          <p>Reproducible, configurable inference deployments</p>
        </div>
        <div class="stack-row stack-row--foundation" role="listitem">
          <span class="stack-number">01</span><div class="stack-name">Physical Hardware</div>
          <p>Master gateway, GPU worker nodes and private networking</p>
        </div>
      </div>
      <p class="stack-footnote">This is a functional architecture overview, not a single sequential request path.</p>
    </section>
    <section class="overview-block enter last-block">
      <div class="section-head"><div><div class="eyebrow quiet">GUIDED EXPLORATION</div><h2>Explore the project layers.</h2></div><span class="section-index">${layers.length} AREAS</span></div>
      <div class="layer-grid">${layers.map(layer => `
        <article class="layer-card"><div class="card-top"><span class="layer-number">${layer.label}</span></div><span class="card-category">${layer.category}</span><h3>${htmlSafe(layer.title)}</h3><p>${htmlSafe(layer.tagline)}</p></article>
      `).join("")}</div>
    </section>
  `;
}


function contextMarkup() {
  return \`
    <section class="context-page enter" aria-labelledby="context-title">
      <header class="context-hero">
        <div class="eyebrow"><span class="eyebrow-bar"></span> FOUNDATION / 01 — CONTEXT & OBJECTIVES</div>
        <h1 id="context-title">Private AI infrastructure.<br><span class="accent">One managed platform.</span></h1>
        <p class="lead">SECURAS Inference brings local LLM serving, distributed GPU resources and controlled model access into a single on-premises platform.</p>
        <div class="context-thesis"><span class="context-thesis-mark" aria-hidden="true">!</span><p><strong>The central challenge</strong> is not simply running an LLM. It is operating multiple local models securely, consistently and accessibly across separate machines.</p></div>
      </header>

      <section class="context-section" aria-labelledby="context-why">
        <div class="context-section-heading">
          <span class="context-index">01 / THE NEED</span>
          <h2 id="context-why">Why build it internally?</h2>
          <p>External inference services can introduce third-party dependencies. Running models locally solves the location-of-compute problem, but leaves important operational challenges.</p>
        </div>
        <div class="context-needs">
          <article class="context-need">
            <span class="context-need-count">01</span>
            <h3>Data confidentiality</h3>
            <p>Keep prompts and inference processing within infrastructure under organizational control.</p>
          </article>
          <article class="context-need">
            <span class="context-need-count">02</span>
            <h3>Operational simplicity</h3>
            <p>Avoid manually installing, starting and troubleshooting model services independently on every worker.</p>
          </article>
          <article class="context-need">
            <span class="context-need-count">03</span>
            <h3>Consistent access</h3>
            <p>Give authorized applications one controlled entry point instead of exposing each worker directly.</p>
          </article>
        </div>
      </section>

      <section class="context-section" aria-labelledby="context-goal">
        <div class="context-section-heading">
          <span class="context-index">02 / THE OBJECTIVE</span>
          <h2 id="context-goal">One platform, two responsibilities.</h2>
          <p>The platform separates infrastructure management from inference execution. Both planes operate on the same local infrastructure, but serve different purposes.</p>
        </div>
        <div class="plane-layout">
          <article class="plane-card control-plane" aria-labelledby="control-plane-title">
            <div class="plane-header">
              <span class="plane-label">MANAGEMENT</span>
              <h3 id="control-plane-title">Control Plane</h3>
              <p>Decides <strong>what should run</strong>, where it should run and who may access it.</p>
            </div>
            <div class="plane-flow" aria-label="Administration process">
              <div class="flow-step"><span class="flow-step-index">01</span><div><strong>Admin Dashboard</strong><span>Configuration and operations</span></div></div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step"><span class="flow-step-index">02</span><div><strong>FastAPI + Uvicorn</strong><span>Control API and validation</span></div></div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step"><span class="flow-step-index">03</span><div><strong>Execution Engine + Ansible</strong><span>Deploy and manage worker profiles</span></div></div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step"><span class="flow-step-index">04</span><div><strong>GPU Workers</strong><span>Apply requested runtime changes</span></div></div>
            </div>
            <div class="plane-support"><strong>Supporting services:</strong> PostgreSQL stores managed state; monitoring observes worker health and running services.</div>
          </article>
          <article class="plane-card data-plane" aria-labelledby="data-plane-title">
            <div class="plane-header">
              <span class="plane-label">INFERENCE</span>
              <h3 id="data-plane-title">Data Plane</h3>
              <p>Handles <strong>live model requests</strong> and returns generated responses to applications.</p>
            </div>
            <div class="plane-flow" aria-label="Inference request process">
              <div class="flow-step"><span class="flow-step-index">01</span><div><strong>Client Application</strong><span>Authenticated inference request</span></div></div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step"><span class="flow-step-index">02</span><div><strong>LiteLLM Gateway</strong><span>API key validation and model routing</span></div></div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step"><span class="flow-step-index">03</span><div><strong>vLLM + Local Model</strong><span>GPU-based token generation</span></div></div>
              <span class="flow-arrow" aria-hidden="true">↓</span>
              <div class="flow-step"><span class="flow-step-index">04</span><div><strong>Generated Response</strong><span>Returned through the gateway</span></div></div>
            </div>
            <div class="plane-support"><strong>Serving principle:</strong> Requests are handled by locally deployed models, with no cloud inference fallback.</div>
          </article>
        </div>
        <div class="planes-relationship"><span class="relationship-symbol" aria-hidden="true">↔</span><p><strong>How they connect:</strong> The control plane deploys and monitors inference services; the data plane uses those running services to answer requests.</p></div>
      </section>

      <section class="context-outcome" aria-labelledby="context-outcome-title">
        <div>
          <span class="context-index">03 / EXPECTED OUTCOME</span>
          <h2 id="context-outcome-title">Local intelligence, managed centrally.</h2>
        </div>
        <p>Private deployment, repeatable operations and a unified inference API — without making every application manage a GPU server.</p>
      </section>
    </section>
  \`;
}

function sectionMarkup(layer) {
  return `
    <section class="detail-page enter">
      <div class="eyebrow"><span class="eyebrow-bar"></span> ${layer.category} <span class="small-separator">/</span> SECTION ${layer.label}</div>
      <div class="detail-title-line"><h1>${htmlSafe(layer.title)}<span class="detail-dot">.</span></h1><span class="draft-tag">CONTENT OUTLINE</span></div>
      <p class="lead detail-lead">${htmlSafe(layer.tagline)}</p>
      <div class="topic-panel"><div class="topic-panel-label">WHAT THIS SECTION EXPLAINS</div><p>${htmlSafe(layer.summary)}</p></div>
      <div class="section-head compact"><div><div class="eyebrow quiet">CONTENT TO REFINE TOGETHER</div><h2>Talking points</h2></div></div>
      <div class="point-grid">${layer.focus.map((point, pointIndex) => `<div class="point"><span class="point-count">${String(pointIndex+1).padStart(2,"0")}</span><h3>${htmlSafe(point)}</h3><p>Reserved for the detailed diagram, evidence or explanation.</p></div>`).join("")}</div>
      <div class="holding-note"><span class="holding-icon" aria-hidden="true">◇</span><div><strong>${layer.id === "hardware" ? "Hardware references preserved" : "Section reserved for collaboration"}</strong><p>${layer.id === "hardware" ? "The three supplied machine photographs are stored in assets/hardware-reference but intentionally not displayed. Your initial motherboard and PCIe testing story is on hold until we design this section." : "We will replace the placeholders with project-specific architecture diagrams, verified results and concise explanations, one section at a time."}</p></div></div>
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
  appElement.innerHTML = current ? (current.id === "context" ? contextMarkup() : sectionMarkup(current)) : overviewMarkup();
  crumb.textContent = current ? current.title.toUpperCase() : "OVERVIEW";
  position.textContent = current ? `${current.label} / ${String(layers.length).padStart(2, "0")}` : "Overview";
  document.title = current ? `${current.title} · Securas Inference` : "Securas Inference · Architecture Walkthrough";
  window.scrollTo({top:0,behavior:"instant"});
}

window.addEventListener("hashchange", render);
render();
