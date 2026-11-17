/* Securas Inference — lightweight static hash-routed site. No dependencies. */
const layers = [
  {
    id: "context", category: "FOUNDATION", label: "01", title: "Context & objectives", tagline: "Why private LLM inference?",
    summary: "Why local inference matters, the operational challenge, and how control and data planes work together.",
    focus: ["Privacy and control", "Centralized operations", "Control plane and data plane"], status: "complete"
  },
  {
    id: "hardware", category: "FOUNDATION", label: "02", title: "Hardware & experiments", tagline: "From prototype to a three-node inference platform",
    summary: "Real experiments, power and PCIe constraints, and the resulting on-premises GPU cluster.",
    focus: ["Existing hardware and design goals", "PCIe and single-GPU validation", "Power adaptation", "Final three-node cluster"], status: "complete"
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
  return `
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
  `;
}


function hardwareMarkup() {
  return `
    <article class="hw-page enter" aria-labelledby="hw-title">
      <header class="hw-hero">
        <div class="eyebrow"><span class="eyebrow-bar"></span> FOUNDATION / 02 — HARDWARE &amp; EXPERIMENTS</div>
        <h1 id="hw-title">From first test to <span class="accent">multi-GPU infrastructure.</span></h1>
        <p class="lead">We started with available desktop hardware, validated local inference in a small prototype, solved physical integration challenges, and assembled a master node with two dedicated GPU workers.</p>
        <div class="hw-facts"><span>3 physical machines</span><span>5 × RTX 3090 planned across workers</span><span>1 × RTX 3070 on master</span></div>
      </header>

      <section class="hw-section" aria-labelledby="hw-guides">
        <header class="hw-heading"><span class="hw-kicker">01 / DESIGN DRIVERS</span><h2 id="hw-guides">Building within real constraints</h2><p>The project was designed around the machines we already owned, not an idealized data-center configuration.</p></header>
        <div class="hw-drivers">
          <div class="hw-driver"><span class="hw-driver-icon" aria-hidden="true">▣</span><h3>Reuse available hardware</h3><p>Adapt existing PCs and GPUs instead of buying a dedicated inference server.</p></div>
          <div class="hw-driver"><span class="hw-driver-icon" aria-hidden="true">⌂</span><h3>Entirely local inference</h3><p>Keep deployed models and inference processing on-premises, without cloud fallback.</p></div>
          <div class="hw-driver"><span class="hw-driver-icon" aria-hidden="true">↔</span><h3>Memory &amp; PCIe limits</h3><p>Choose model profiles and parallelism to suit available VRAM and interconnect bandwidth.</p></div>
          <div class="hw-driver"><span class="hw-driver-icon" aria-hidden="true">◎</span><h3>Shared access</h3><p>Make inference available to multiple applications through controlled API access.</p></div>
          <div class="hw-driver"><span class="hw-driver-icon" aria-hidden="true">◇</span><h3>Lightweight operations</h3><p>Manage a small distributed deployment remotely with practical automation.</p></div>
        </div>
      </section>

      <section class="hw-section" aria-labelledby="hw-journey">
        <header class="hw-heading"><span class="hw-kicker">02 / BUILD JOURNEY</span><h2 id="hw-journey">What we tested, changed, and learned</h2><p>A short engineering timeline: motherboard limits → single-GPU proof of concept → external power → scalable worker configurations.</p></header>
        <div class="hw-journey">
          <article class="hw-milestone">
            <div class="hw-step-marker"><span>01</span></div>
            <div class="hw-step-body"><div class="hw-step-copy"><span class="hw-step-type">EXPLORE</span><h3>Understand the motherboard</h3><p>We inspected the physical PCIe slots and power connections before designing GPU expansion. A PCIe x16 slot supported a direct GPU setup, while a PCIe x1 slot suggested an alternative via risers.</p><div class="hw-inline-fact">Decision: test feasibility before scaling.</div></div>
            <figure class="hw-photo hw-photo-diagram"><img src="./assets/hardware/motherboard-layout.png" alt="Annotated motherboard placement guide showing the PCIe x16 and PCIe x1 slots, CPU, memory and power connectors" loading="lazy"><figcaption>Motherboard layout — PCIe slot and power planning</figcaption></figure></div>
          </article>
          <article class="hw-milestone">
            <div class="hw-step-marker"><span>02</span></div>
            <div class="hw-step-body"><div class="hw-step-copy"><span class="hw-step-type">VALIDATE</span><h3>First single-GPU proof of concept</h3><p>We assembled a basic GPU test bench to run local inference before investing in a multi-card setup. In our test, restricted PCIe bandwidth had little visible impact when serving on one GPU.</p><div class="hw-inline-fact">Finding: single-GPU inference remained practical.</div></div>
            <figure class="hw-photo"><img src="./assets/hardware/single-gpu-prototype.jpeg" alt="Early experimental motherboard with one GeForce RTX graphics card installed for local inference testing" loading="lazy"><figcaption>Early physical proof of concept</figcaption></figure></div>
          </article>
          <article class="hw-milestone">
            <div class="hw-step-marker"><span>03</span></div>
            <div class="hw-step-body"><div class="hw-step-copy"><span class="hw-step-type">ADAPT</span><h3>Power delivery for multiple GPUs</h3><p>Adding several high-power cards required careful PSU capacity planning and physical cabling. We tested a secondary-PSU jumper/synchronization arrangement and incorporated a LEPA G1600 supply for the main multi-GPU worker.</p><div class="hw-inline-fact">Decision: separate GPU power planning from motherboard expansion.</div></div>
            <div class="hw-photo-pair">
              <figure class="hw-photo"><img src="./assets/hardware/psu-jumper.jpeg" alt="Prototype dual-power-supply jumper adapter with 24-pin ATX connector" loading="lazy"><figcaption>PSU jumper / synchronization adapter</figcaption></figure>
              <figure class="hw-photo"><img src="./assets/hardware/psu-cabling.jpeg" alt="High-wattage modular PSU showing separate power cable outputs for the GPU setup" loading="lazy"><figcaption>Modular PSU cabling</figcaption></figure>
            </div></div>
          </article>
          <article class="hw-milestone hw-milestone-highlight">
            <div class="hw-step-marker"><span>04</span></div>
            <div class="hw-step-body"><div class="hw-step-copy"><span class="hw-step-type">SCALE</span><h3>PCIe x1 risers changed the multi-GPU equation</h3><p>A single card mainly computes from weights in its own VRAM. With multiple cards collaborating on one model, GPU-to-GPU transfers added latency over the restricted x1 links.</p><p>We therefore favored <strong>Pipeline Parallelism (PP)</strong> in selected model profiles and avoided communication-heavy <strong>Tensor Parallelism (TP)</strong> on the riser-based setup.</p></div>
              <div class="hw-insight"><span class="hw-insight-label">KEY EXPERIMENTAL INSIGHT</span><strong>PCIe bandwidth was manageable for our single-GPU test, but became a constraint when several GPUs needed to cooperate.</strong><span>PP was viable, but communication and pipeline overhead affected speed; TP was unsuitable for this interconnect.</span></div>
            </div>
          </article>
        </div>
      </section>

      <section class="hw-section" aria-labelledby="hw-cluster">
        <header class="hw-heading"><span class="hw-kicker">03 / FINAL ARCHITECTURE</span><h2 id="hw-cluster">The three-machine platform</h2><p>One central master handles network access and orchestration. Two worker nodes provide the primary large-model compute capacity.</p></header>
        <div class="hw-nodes">
          <article class="hw-node">
            <figure class="hw-node-photo"><img src="./assets/hardware-reference/hardware-01.jpeg" alt="Master host in its tower case with GeForce RTX GPU visible" loading="lazy"></figure>
            <div class="hw-node-content"><span class="hw-node-role">MASTER / GATEWAY</span><h3>worker-acer</h3><p>Central control, private network gateway and lightweight auxiliary inference.</p><dl><div><dt>GPU</dt><dd>1 × RTX 3070</dd></div><div><dt>Platform</dt><dd>Ubuntu Server 26.04 LTS</dd></div><div><dt>Role</dt><dd>Control API · Database · LiteLLM · NAT · Tailscale</dd></div></dl></div>
          </article>
          <article class="hw-node">
            <figure class="hw-node-photo"><img src="./assets/hardware-reference/hardware-02.jpeg" alt="Lenovo inference worker with two RTX 3090 graphics cards on a custom open frame" loading="lazy"></figure>
            <div class="hw-node-content"><span class="hw-node-role">INFERENCE WORKER 02</span><h3>worker-lenovo</h3><p>Secondary large-model deployment node, with two RTX 3090 cards.</p><dl><div><dt>Processor</dt><dd>Intel Core i7-6700</dd></div><div><dt>Memory</dt><dd>32 GB RAM</dd></div><div><dt>GPU</dt><dd>2 × RTX 3090 · 24 GB each</dd></div></dl></div>
          </article>
          <article class="hw-node">
            <figure class="hw-node-photo"><img src="./assets/hardware-reference/hardware-03.jpeg" alt="Primary worker with three GeForce RTX cards, green cooling fans and external high-power PSU" loading="lazy"></figure>
            <div class="hw-node-content"><span class="hw-node-role">INFERENCE WORKER 01</span><h3>worker-aero</h3><p>Main multi-GPU inference machine, assembled using PCIe x1 risers and an external power configuration.</p><dl><div><dt>Processor</dt><dd>Intel Core i5-9400F</dd></div><div><dt>Memory</dt><dd>32 GB RAM</dd></div><div><dt>GPU</dt><dd>3 × RTX 3090 target · 24 GB each</dd></div><div><dt>Power</dt><dd>LEPA G1600</dd></div></dl></div>
          </article>
        </div>
        <div class="hw-status-note"><strong>Installed hardware vs. operational capacity.</strong> Five RTX 3090 cards are allocated across the two worker builds, but GPU detection and stability—particularly the third card on worker-aero—have to be checked before claiming all cards are simultaneously active.</div>
      </section>
      <section class="hw-bottom-line"><span>ENGINEERING OUTCOME</span><h2>A working design shaped by real limits.</h2><p>Physical expansion, PSU capacity, PCIe communication, and model placement all influenced the software platform that followed.</p></section>
    </article>
  `;
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
  appElement.innerHTML = current ? (current.id === "context" ? contextMarkup() : current.id === "hardware" ? hardwareMarkup() : sectionMarkup(current)) : overviewMarkup();
  if (current?.id === "hardware") {
    for (const img of appElement.querySelectorAll(".hw-journey .hw-photo img")) {
      const showFallback = () => {
        img.classList.add("hw-image-unavailable");
        img.parentElement.classList.add("hw-missing-photo");
      };
      img.addEventListener("error", showFallback, { once: true });
      if (img.complete && img.naturalWidth === 0) showFallback();
    }
  }
  crumb.textContent = current ? current.title.toUpperCase() : "OVERVIEW";
  position.textContent = current ? `${current.label} / ${String(layers.length).padStart(2, "0")}` : "Overview";
  document.title = current ? `${current.title} · Securas Inference` : "Securas Inference · Architecture Walkthrough";
  window.scrollTo({top:0,behavior:"instant"});
}

window.addEventListener("hashchange", render);
render();
