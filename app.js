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
    id: "network", category: "FOUNDATION", label: "03", title: "Private network", tagline: "LAN, NAT, Tailscale and LiteLLM routing",
    summary: "Real cluster topology, forwarding/NAT rules, WireGuard-based Tailscale access and the LiteLLM gateway network path.",
    focus: ["Private 192.168.100.x LAN", "NAT and forwarding", "Tailnet HTTPS entry points", "LiteLLM inference routing"], status: "complete"
  },
  {
    id: "models", category: "INFERENCE", label: "04", title: "Models & profiles", tagline: "What runs on each GPU worker",
    summary: "Model artifacts, multiple runtime profiles, quantization, and the distinction between dense, MoE and multi-model serving.",
    focus: ["Model inventory", "Profile configurations", "GPU placement", "Model vs runtime"], status: "complete"
  },
  {
    id: "vllm", category: "INFERENCE", label: "05", title: "vLLM runtime", tagline: "From GPU memory to streamed tokens",
    summary: "Local OpenAI-compatible serving, prefill/decode, KV cache and PagedAttention, context scheduling and hardware-aware profiles.",
    focus: ["Prefill and decode", "KV cache and PagedAttention", "Context and concurrent sequences", "GPU profiles and PP/TP"], status: "complete"
  },
  {
    id: "master", category: "CONTROL", label: "06", title: "Master & services", tagline: "The control plane",
    summary: "FastAPI under Uvicorn, PostgreSQL, the execution service, the monitoring service and their responsibilities.",
    focus: ["Control API", "PostgreSQL state", "Job execution", "Monitoring and health"], status: "complete"
  },
  {
    id: "ansible", category: "CONTROL", label: "07", title: "Ansible operations", tagline: "From an admin action to a running service",
    summary: "A simple operations tree covering model install/adopt, profile check/up/down, locks and execution results.",
    focus: ["Main playbooks", "Model completion markers", "Operation locking", "Deploy / stop workflow"], status: "complete"
  },
  {
    id: "dashboard", category: "CONTROL", label: "08", title: "Admin dashboard", tagline: "One interface for the platform",
    summary: "View hosts, GPUs, models and profiles, execute operations and manage users and authorizations.",
    focus: ["Inventory", "Profile actions", "Users, groups, grants", "Health and operations"], status: "outline"
  },
  {
    id: "gateway", category: "DELIVERY", label: "09", title: "LiteLLM gateway", tagline: "Unified API, profiles and access grants",
    summary: "Profile registration, exact-profile routing, direct/group grants, scoped virtual API keys and private vLLM backends.",
    focus: ["Route registration", "Direct and group grants", "Virtual API keys", "Profile-based forwarding"], status: "complete"
  },
  {
    id: "results", category: "DELIVERY", label: "10", title: "Benchmarks & outcomes", tagline: "Evidence, trade-offs, next steps",
    summary: "Verified cluster achievements and an explicitly illustrative comparison of inference profiles.",
    focus: ["Verified infrastructure inventory", "Synthetic benchmark comparison", "TTFT and output tokens per second", "Performance measurement caveats"], status: "complete"
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
        <section class="hw-parallelism" aria-labelledby="hw-parallelism-title">
          <div class="hw-parallelism-heading">
            <span class="hw-kicker">MULTI-GPU MODEL EXECUTION</span>
            <h3 id="hw-parallelism-title">Pipeline Parallelism vs. Tensor Parallelism</h3>
            <p>Both approaches divide one model across multiple GPUs. They differ in <strong>what they split</strong> and <strong>how often GPUs communicate</strong>.</p>
          </div>
          <div class="hw-parallelism-grid">
            <article class="hw-parallel-card hw-parallel-pp">
              <div class="hw-parallel-top"><span class="hw-parallel-icon">PP</span><div><h4>Pipeline Parallelism</h4><span class="hw-parallel-sub">Split model layers into stages</span></div></div>
              <div class="hw-parallel-visual" role="img" aria-label="Pipeline parallelism: GPU zero runs an early group of layers then sends activations to GPU one running later layers">
                <div class="hw-gpu-block"><span>GPU 0</span><strong>Layers 1–N</strong><small>Stage A</small></div>
                <div class="hw-gpu-arrow" aria-hidden="true">→</div>
                <div class="hw-gpu-block"><span>GPU 1</span><strong>Layers N+1–end</strong><small>Stage B</small></div>
              </div>
              <p>Each GPU executes a different group of layers. Activations pass between stages at their boundaries.</p>
              <div class="hw-parallel-bottom"><strong>Our choice:</strong> Reduced cross-GPU communication frequency made PP more workable with PCIe x1 risers, although transfers and pipeline overhead still add latency.</div>
            </article>
            <article class="hw-parallel-card hw-parallel-tp">
              <div class="hw-parallel-top"><span class="hw-parallel-icon">TP</span><div><h4>Tensor Parallelism</h4><span class="hw-parallel-sub">Split computations inside the same layers</span></div></div>
              <div class="hw-parallel-visual" role="img" aria-label="Tensor parallelism: GPU zero and GPU one each execute a shard of the same layer and repeatedly synchronize results">
                <div class="hw-gpu-block"><span>GPU 0</span><strong>Layer shard A</strong><small>Partial computation</small></div>
                <div class="hw-gpu-arrow" aria-hidden="true">↔</div>
                <div class="hw-gpu-block"><span>GPU 1</span><strong>Layer shard B</strong><small>Synchronization</small></div>
              </div>
              <p>Both GPUs work on parts of the same layers. Their partial results require frequent communication and synchronization.</p>
              <div class="hw-parallel-bottom"><strong>Our constraint:</strong> PCIe x1 links provide too little bandwidth for communication-heavy TP to be a practical configuration in this setup.</div>
            </article>
          </div>
          <p class="hw-parallel-caption">Illustrative two-GPU comparison. Actual performance depends on model architecture, GPU topology, batch size and runtime configuration.</p>
        </section>
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


/* ==============================================================
   SECTION 07 — ANSIBLE / OPERATIONS EXPLORER
   Project-specific workflows from securas-inference/ansible and
   docs/05..08. All walkthroughs are illustrative; not executable.
   ============================================================== */

const ansibleOpCatalog = [
  {
    id: "model_install", label: "Install", prefix: "MODEL 01", playbook: "model-install.yml",
    category: "model", mode: "Dashboard + durable operation", symbol: "↓",
    short: "Download a pinned Hugging Face revision to a selected worker and verify it.",
    outcome: "Verified model artifact available at /srv/models/<model-name>.",
    steps: [
      ["Select a missing artifact", "From Models, choose an enabled catalog entry and a reachable worker reporting the artifact as missing.", "Admin UI"],
      ["Create a durable operation", "FastAPI records model_install in PostgreSQL. A restricted launcher starts an isolated systemd operation runner.", "Control plane"],
      ["Resolve the target", "The runner obtains the relevant locks; securasctl resolves the model and worker, and Ansible reads its dynamic inventory.", "Execution engine"],
      ["Stage and verify the model", "model-install.yml downloads the exact pinned revision and validates the model files before writing its completion marker.", "Ansible · worker"],
      ["Report the result", "The runner records success or failure and logs; the status collector can then report the worker artifact as installed.", "Operations history"]
    ]
  },
  {
    id: "model_copy", label: "Copy", prefix: "MODEL 02", playbook: "model-copy.yml",
    category: "model", mode: "Dashboard + durable operation", symbol: "⇢",
    short: "Reuse a verified model already on another worker without downloading again.",
    outcome: "Target worker receives an independently verifiable model artifact.",
    steps: [
      ["Pick source and target", "Select a reachable worker with a verified model and a target worker that reports it missing.", "Admin UI"],
      ["Queue and lock", "FastAPI creates model_copy. The operation runner locks the model/worker resources to prevent conflicting changes.", "Control plane"],
      ["Resolve a safe transfer", "The model-copy wrapper validates both hosts, resolves database configuration and supplies protected variables to Ansible.", "Execution engine"],
      ["Transfer and verify", "model-copy.yml copies the source artifact, checks its identity, and cleans temporary staging on completion.", "Ansible · workers"],
      ["Record the outcome", "Operation history retains the final status, exit code and output for review.", "Operations history"]
    ]
  },
  {
    id: "model_adopt", label: "Adopt", prefix: "MODEL 03", playbook: "model-adopt.yml",
    category: "model", mode: "Administrative CLI · not a dashboard operation", symbol: "✓",
    short: "Bring an existing local model directory under Securas verification and tracking.",
    outcome: "Previously present artifact becomes a managed, verifiable artifact.",
    steps: [
      ["Identify the existing files", "The administrator identifies a model already present on a worker and an explicit model revision.", "Admin CLI"],
      ["Run the supported wrapper", "Use securasctl model adopt MODEL HOST REVISION, not an arbitrary command from the dashboard.", "Administrative shell"],
      ["Inspect the artifact", "model-adopt.yml uses the model verification and adoption path without treating adoption as an update or re-download.", "Ansible · worker"],
      ["Create a valid marker", "Only after checks, the model identity, source repository and revision are recorded in .securas-model.json.", "Ansible · worker"],
      ["Discover the managed state", "The status collector can now distinguish the verified installed artifact from an unverified directory.", "Inventory"]
    ]
  },
  {
    id: "profile_check", label: "Check", prefix: "PROFILE 01", playbook: "profile-check.yml",
    category: "profile", mode: "Dashboard + durable operation", symbol: "◇",
    short: "Preflight the worker, artifact, GPUs and runtime without starting inference.",
    outcome: "Preflight result and logs — no vLLM deployment or LiteLLM route.",
    steps: [
      ["Choose a profile", "The administrator selects a configured model, worker, GPU placement and runtime settings, then clicks Check.", "Admin UI"],
      ["Resolve desired state", "The control service creates profile_check and resolves profile configuration from PostgreSQL.", "Control plane"],
      ["Lock the required resources", "The runner acquires non-blocking resource locks and invokes the supported profile wrapper.", "Execution engine"],
      ["Run preflight checks", "profile-check.yml validates the model artifact, available GPUs, host/port and serving configuration.", "Ansible · worker"],
      ["Show the validation result", "Execution logs and success/failure are retained. Check does not expose a gateway model route.", "Operations history"]
    ]
  },
  {
    id: "profile_up", label: "Up", prefix: "PROFILE 02", playbook: "profile-up.yml",
    category: "profile", mode: "Dashboard + durable operation", symbol: "▶",
    short: "Start the selected vLLM runtime, validate health, then publish its LiteLLM route.",
    outcome: "Healthy local vLLM runtime registered under the exact profile name.",
    steps: [
      ["Request Profile Up", "The administrator chooses a configured Qwen profile on worker-aero and clicks Up.", "Admin UI"],
      ["Create and isolate the operation", "FastAPI creates profile_up in PostgreSQL; a restricted sudo launcher starts a transient systemd runner.", "Control plane"],
      ["Lock and preflight", "The runner locks the target resources and Ansible validates the worker, installed model and GPU configuration.", "Operation runner"],
      ["Start and verify vLLM", "profile-up.yml renders the profile's Docker Compose configuration, starts the container and waits for a healthy backend.", "Ansible · worker-aero"],
      ["Register the gateway route", "After vLLM passes health validation, securasctl registers the exact profile name with LiteLLM.", "LiteLLM gateway"],
      ["Persist execution results", "The runner saves the exit code, result and output; the dashboard displays the operation and running profile.", "PostgreSQL + UI"]
    ]
  },
  {
    id: "profile_down", label: "Down", prefix: "PROFILE 03", playbook: "profile-down.yml",
    category: "profile", mode: "Dashboard + durable operation", symbol: "■",
    short: "Unpublish the LiteLLM route before shutting down its inference backend.",
    outcome: "Profile route removed and the vLLM runtime stopped; allocated GPUs become free.",
    steps: [
      ["Request Profile Down", "The administrator selects a running profile and clicks Down; FastAPI records profile_down.", "Admin UI"],
      ["Reserve the operation", "The runner acquires the relevant resource locks to prevent conflicting lifecycle changes.", "Operation runner"],
      ["Remove the gateway route first", "securasctl unregisters the profile from LiteLLM before any backend shutdown.", "LiteLLM gateway"],
      ["Stop the worker runtime", "Only after gateway removal succeeds, profile-down.yml stops the selected Docker Compose runtime.", "Ansible · worker"],
      ["Retain the operation result", "Final status and logs remain in PostgreSQL; the dashboard reflects the stopped runtime.", "Operations history"]
    ]
  }
];

let ansibleSelectedOperation = "profile_up";
let ansibleSelectedStep = 0;

function ansibleOperationCard(item) {
  const active = item.id === ansibleSelectedOperation;
  return `
    <button type="button" class="ans-op-card ${active ? "is-active" : ""}"
      data-ans-op="${item.id}" aria-pressed="${active ? "true" : "false"}"
      aria-label="Explore ${item.label} operation">
      <span class="ans-card-top"><span class="ans-op-number">${item.prefix}</span><span class="ans-op-symbol" aria-hidden="true">${item.symbol}</span></span>
      <strong>${item.label}<span class="ans-code">${item.playbook}</span></strong>
      <span class="ans-op-description">${item.short}</span>
      <span class="ans-op-mode">${item.id === "model_adopt" ? "CLI ONLY" : "AUDITED OPERATION"} <span aria-hidden="true">→</span></span>
    </button>`;
}

function ansibleScenarioMarkup() {
  const op = ansibleOpCatalog.find(item => item.id === ansibleSelectedOperation) || ansibleOpCatalog[4];
  const index = Math.min(ansibleSelectedStep, op.steps.length - 1);
  const step = op.steps[index];
  return `
    <div class="ans-scenario-head">
      <div>
        <div class="ans-overline">INTERACTIVE EXPLAINER / ${op.prefix}</div>
        <h3>${op.label}: <span>${op.playbook}</span></h3>
        <p>${op.short}</p>
      </div>
      <span class="ans-operation-kind">${op.mode}</span>
    </div>
    <div class="ans-stage-main" role="group" aria-label="Operation walkthrough">
      <div class="ans-steps-track" aria-label="Workflow progress">
        ${op.steps.map((stage, i) => `
          <button type="button" class="ans-step-pill ${i === index ? "current" : i < index ? "completed" : ""}"
            data-ans-step="${i}" aria-label="Jump to step ${i + 1}: ${stage[0]}" aria-current="${i === index ? "step" : "false"}">
            ${String(i + 1).padStart(2, "0")}
          </button>`).join('<span class="ans-step-connector" aria-hidden="true"></span>')}
      </div>
      <div class="ans-stage-card" aria-live="polite" aria-atomic="true">
        <div class="ans-stage-top"><span class="ans-stage-number">STEP ${String(index + 1).padStart(2, "0")} / ${String(op.steps.length).padStart(2, "0")}</span><span class="ans-stage-location">${step[2]}</span></div>
        <h4>${step[0]}</h4>
        <p>${step[1]}</p>
      </div>
    </div>
    <div class="ans-stage-controls">
      <button class="ans-button ans-button-outline" data-ans-move="prev" ${index === 0 ? "disabled" : ""} type="button">← Previous</button>
      <span class="ans-stage-outcome"><strong>Outcome:</strong> ${op.outcome.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</span>
      <button class="ans-button ans-button-primary" data-ans-move="next" type="button">${index === op.steps.length - 1 ? "Replay ↻" : "Next step →"}</button>
    </div>
  `;
}

function ansibleMarkup() {
  ansibleSelectedOperation = "profile_up";
  ansibleSelectedStep = 0;
  return `
  <section class="ans-page enter" aria-labelledby="ans-title">
    <header class="ans-hero">
      <div class="eyebrow"><span class="eyebrow-bar"></span> CONTROL / 07 — AUTOMATION LAYER</div>
      <div class="ans-hero-grid">
        <div>
          <h1 id="ans-title">One action.<br><span class="accent">Repeatable execution.</span></h1>
          <p class="ans-hero-lead">Ansible turns database-defined models and profiles into real GPU services. Administrators operate the cluster from one control plane instead of manually configuring each worker over SSH.</p>
          <div class="ans-hero-meta"><span>6 playbooks</span><span>5 durable UI operations</span><span>2 GPU workers</span></div>
        </div>
        <div class="ans-hero-aside">
          <div class="ans-mini-overline">THE OPERATING PRINCIPLE</div>
          <div class="ans-mini-action">Desired state <span>→</span></div>
          <div class="ans-mini-action">Validated execution <span>→</span></div>
          <div class="ans-mini-action">Observed runtime <span>✓</span></div>
          <p>Configuration originates in PostgreSQL; the runner and Ansible reconcile it with each worker.</p>
        </div>
      </div>
    </header>

    <section class="ans-section" aria-labelledby="ans-architecture">
      <div class="ans-section-heading"><div><span class="ans-overline">01 / EXECUTION ARCHITECTURE</span><h2 id="ans-architecture">From request to GPU runtime.</h2></div><p>An authorized UI request is never an arbitrary shell command on a worker.</p></div>
      <div class="ans-route" role="list" aria-label="Operation execution pipeline">
        <div class="ans-route-node" role="listitem"><span class="ans-route-ordinal">01 / REQUEST</span><span class="ans-route-icon" aria-hidden="true">▦</span><strong>Admin UI</strong><small>Check · Up · Down<br>Install · Copy</small></div>
        <div class="ans-route-arrow" aria-hidden="true">→</div>
        <div class="ans-route-node" role="listitem"><span class="ans-route-ordinal">02 / VALIDATE</span><span class="ans-route-icon" aria-hidden="true">{ }</span><strong>FastAPI + DB</strong><small>Authorization, desired state & operation record</small></div>
        <div class="ans-route-arrow" aria-hidden="true">→</div>
        <div class="ans-route-node" role="listitem"><span class="ans-route-ordinal">03 / ISOLATE</span><span class="ans-route-icon" aria-hidden="true">⌘</span><strong>systemd runner</strong><small>Restricted launcher, resource locks & logs</small></div>
        <div class="ans-route-arrow" aria-hidden="true">→</div>
        <div class="ans-route-node ans-route-highlight" role="listitem"><span class="ans-route-ordinal">04 / AUTOMATE</span><span class="ans-route-icon" aria-hidden="true">A</span><strong>Ansible</strong><small>Dynamic inventory, verified roles & playbooks</small></div>
        <div class="ans-route-arrow" aria-hidden="true">→</div>
        <div class="ans-route-node" role="listitem"><span class="ans-route-ordinal">05 / SERVE</span><span class="ans-route-icon" aria-hidden="true">▣</span><strong>GPU workers</strong><small>Docker Compose, vLLM & model artifacts</small></div>
      </div>
      <div class="ans-route-foot"><span class="ans-route-dot"></span><p><strong>Gateway coordination:</strong> the <code>securasctl</code> wrapper registers the LiteLLM route <strong>after</strong> healthy Profile Up, and unregisters it <strong>before</strong> Profile Down. PostgreSQL retains operation status and history.</p></div>
    </section>

    <section class="ans-section" aria-labelledby="ans-operations">
      <div class="ans-section-heading"><div><span class="ans-overline">02 / IMPLEMENTED PLAYBOOKS</span><h2 id="ans-operations">Six operations. Two lifecycles.</h2></div><p>Select any operation to explore its actual sequence below.</p></div>
      <div class="ans-operation-groups">
        <div class="ans-op-group">
          <div class="ans-op-heading"><div><span class="ans-op-group-icon">01</span><h3>Model lifecycle</h3></div><span>MODEL ARTIFACTS</span></div>
          <div class="ans-op-grid">${ansibleOpCatalog.filter(op => op.category === "model").map(ansibleOperationCard).join("")}</div>
        </div>
        <div class="ans-op-group">
          <div class="ans-op-heading"><div><span class="ans-op-group-icon ans-profile-ordinal">02</span><h3>Profile lifecycle</h3></div><span>INFERENCE SERVICES</span></div>
          <div class="ans-op-grid">${ansibleOpCatalog.filter(op => op.category === "profile").map(ansibleOperationCard).join("")}</div>
        </div>
      </div>
      <div class="ans-cli-note"><strong>Important distinction:</strong> Install, Copy, Check, Up and Down are durable operations available through the dashboard. <strong>Model Adopt</strong> is implemented as an administrator CLI + Ansible playbook, not as a dashboard operation.</div>
    </section>

    <section class="ans-section ans-interactive-section" aria-labelledby="ans-example">
      <div class="ans-section-heading"><div><span class="ans-overline">03 / OPERATION WALKTHROUGH</span><h2 id="ans-example">Follow the execution, step by step.</h2></div><p>Illustrative process based on the implemented Securas playbooks.</p></div>
      <div class="ans-scenario" id="ans-scenario">${ansibleScenarioMarkup()}</div>
    </section>

    <section class="ans-section" aria-labelledby="ans-protections">
      <div class="ans-section-heading"><div><span class="ans-overline">04 / ENGINEERING SAFEGUARDS</span><h2 id="ans-protections">Predictable operations, controlled risk.</h2></div><p>Controls built around constrained GPU resources and durable administration.</p></div>
      <div class="ans-safeguards">
        <article class="ans-safeguard"><span class="ans-safe-symbol">01</span><h3>Preflight before start</h3><p>Checks worker reachability, artifact identity, GPU placement and runtime prerequisites before deploying a profile.</p></article>
        <article class="ans-safeguard"><span class="ans-safe-symbol">02</span><h3>Resource locking</h3><p>Non-blocking locks in <code>/run/securas-inference/locks</code> prevent conflicting changes while allowing independent operations.</p></article>
        <article class="ans-safeguard"><span class="ans-safe-symbol">03</span><h3>Restricted execution</h3><p>FastAPI dispatches an operation ID through a narrow launcher; the runner resolves known commands from database records.</p></article>
        <article class="ans-safeguard"><span class="ans-safe-symbol">04</span><h3>Safe gateway ordering</h3><p>Up registers only after backend health. Down removes the route first; if that fails, the backend is kept running.</p></article>
      </div>
      <div class="ans-failure-note"><strong>Failure behavior matters:</strong> if the LiteLLM registration step fails during Up, Securas reports failure but leaves an already healthy vLLM backend running for repair and retry. It does not silently roll back that container.</div>
    </section>

    <section class="ans-final" aria-labelledby="ans-result">
      <div><span class="ans-overline">05 / SEE THE RESULT</span><h2 id="ans-result">Architecture in theory. Operations in the dashboard.</h2><p>Open the locally mocked Securas Control UI, switch to Operations, and inspect a profile lifecycle, its execution log and history.</p></div>
      <a class="ans-button ans-button-primary ans-final-link" href="./dashboard/#operations">Explore Operations Dashboard <span aria-hidden="true">↗</span></a>
    </section>
  </section>`;
}

function bindAnsibleOperations() {
  const root = appElement.querySelector(".ans-page");
  if (!root) return;
  root.addEventListener("click", event => {
    const opButton = event.target.closest("[data-ans-op]");
    const stepButton = event.target.closest("[data-ans-step]");
    const navButton = event.target.closest("[data-ans-move]");
    if (opButton) {
      ansibleSelectedOperation = opButton.dataset.ansOp;
      ansibleSelectedStep = 0;
      root.querySelectorAll("[data-ans-op]").forEach(button => {
        const active = button.dataset.ansOp === ansibleSelectedOperation;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    } else if (stepButton) {
      ansibleSelectedStep = Number(stepButton.dataset.ansStep);
    } else if (navButton) {
      const op = ansibleOpCatalog.find(item => item.id === ansibleSelectedOperation);
      ansibleSelectedStep = navButton.dataset.ansMove === "prev"
        ? Math.max(0, ansibleSelectedStep - 1)
        : (ansibleSelectedStep + 1) % op.steps.length;
    } else {
      return;
    }
    root.querySelector("#ans-scenario").innerHTML = ansibleScenarioMarkup();
  });
}


/* ==============================================================
   SECTION 06 — MASTER / CONTROL PLANE SERVICES
   Architecture-aligned presentation text, deliberately no backend.
   ============================================================== */
function masterMarkup() {
  return `
    <section class="master-page enter" aria-labelledby="master-title">
      <header class="master-hero">
        <div class="eyebrow"><span class="eyebrow-bar"></span> CONTROL / 06 — MASTER &amp; SERVICES</div>
        <div class="master-hero-grid">
          <div class="master-hero-copy">
            <h1 id="master-title">The master coordinates.<br><span class="accent">The workers compute.</span></h1>
            <p class="master-lead"><strong>worker-acer</strong> is the central control node. It manages the cluster, stores configuration, executes approved operations and provides one secure entry point to local inference.</p>
            <div class="master-pills" aria-label="Master characteristics"><span>One control node</span><span>Two GPU workers</span><span>Private network</span><span>No cloud inference</span></div>
          </div>
          <figure class="master-hero-photo">
            <img src="./assets/hardware-reference/hardware-01.jpeg" alt="The worker-acer master machine used as the Securas control node" loading="lazy">
            <figcaption><strong>worker-acer</strong><span>Master / Gateway · Ubuntu Server</span></figcaption>
          </figure>
        </div>
      </header>

      <section class="master-section" aria-labelledby="master-roles-title">
        <div class="master-section-header"><span class="master-section-number">01 / SERVICES</span><h2 id="master-roles-title">Six services. Clear responsibilities.</h2><p>Each component has one main job. Together, they let a single administrator manage a distributed inference platform.</p></div>
        <div class="master-services">
          <article class="master-service-card">
            <div class="master-service-top"><span class="master-service-index">01</span><span class="master-service-type">CONTROL</span></div>
            <h3>FastAPI + Admin UI</h3><p>The administrator's interface: authentication, model and profile management, access control and validated API requests.</p>
            <div class="master-service-foot">Web application · Uvicorn</div>
          </article>
          <article class="master-service-card">
            <div class="master-service-top"><span class="master-service-index">02</span><span class="master-service-type">STATE</span></div>
            <h3>PostgreSQL</h3><p>Stores the desired configuration: hosts, GPUs, models, profiles, users, grants and persistent operation history.</p>
            <div class="master-service-foot">Source of truth for desired state</div>
          </article>
          <article class="master-service-card">
            <div class="master-service-top"><span class="master-service-index">03</span><span class="master-service-type">EXECUTION</span></div>
            <h3>Operation Runner</h3><p>Receives approved operation IDs, acquires resource locks and launches only supported deployment or model tasks.</p>
            <div class="master-service-foot">systemd units · operation tracking</div>
          </article>
          <article class="master-service-card">
            <div class="master-service-top"><span class="master-service-index">04</span><span class="master-service-type">AUTOMATION</span></div>
            <h3>Ansible Controller</h3><p>Connects to GPU workers over private SSH to install models, validate resources and manage Docker Compose runtimes.</p>
            <div class="master-service-foot">Playbooks · dynamic inventory</div>
          </article>
          <article class="master-service-card">
            <div class="master-service-top"><span class="master-service-index">05</span><span class="master-service-type">OBSERVABILITY</span></div>
            <h3>Status Collector</h3><p>Checks reachable workers, GPU utilization, installed artifacts and running containers to produce a current cluster snapshot.</p>
            <div class="master-service-foot">Docker + nvidia-smi · ~5 s timer</div>
          </article>
          <article class="master-service-card">
            <div class="master-service-top"><span class="master-service-index">06</span><span class="master-service-type">ACCESS</span></div>
            <h3>LiteLLM Gateway</h3><p>Provides a single OpenAI-compatible API, routes calls to the right local vLLM profile and applies API-key access rules.</p>
            <div class="master-service-foot">One gateway · exact profile routes</div>
          </article>
        </div>
      </section>

      <section class="master-section" aria-labelledby="master-paths-title">
        <div class="master-section-header"><span class="master-section-number">02 / REQUEST PATHS</span><h2 id="master-paths-title">Two entry points. Two different jobs.</h2><p>Administration and inference share the master machine, but follow separate workflows.</p></div>
        <div class="master-paths">
          <article class="master-path master-path-admin">
            <div class="master-path-heading"><span class="master-path-number">A</span><div><h3>Administration path</h3><p>Manage infrastructure</p></div></div>
            <div class="master-path-chain" role="list" aria-label="Administration request path">
              <div class="master-path-step" role="listitem"><strong>Administrator</strong><span>Browser</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step" role="listitem"><strong>Tailscale Serve</strong><span>Private HTTPS :443</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step master-path-focus" role="listitem"><strong>FastAPI + PostgreSQL</strong><span>Validate request · record desired state</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step" role="listitem"><strong>Runner + Ansible</strong><span>Check / install / start / stop</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step" role="listitem"><strong>GPU workers</strong><span>Apply changes through SSH</span></div>
            </div>
          </article>
          <article class="master-path master-path-inference">
            <div class="master-path-heading"><span class="master-path-number">B</span><div><h3>Inference path</h3><p>Consume local AI models</p></div></div>
            <div class="master-path-chain" role="list" aria-label="Inference request path">
              <div class="master-path-step" role="listitem"><strong>Client application</strong><span>OpenAI-compatible request + API key</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step" role="listitem"><strong>Tailscale Serve</strong><span>Private HTTPS :8443</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step master-path-focus" role="listitem"><strong>LiteLLM Gateway</strong><span>Authorize key · select exact profile</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step" role="listitem"><strong>vLLM on GPU worker</strong><span>Generate tokens locally</span></div><span class="master-step-arrow" aria-hidden="true">↓</span>
              <div class="master-path-step" role="listitem"><strong>Model response</strong><span>Return generated tokens to client</span></div>
            </div>
          </article>
        </div>
        <p class="master-path-note"><strong>Separation of concerns:</strong> the master controls the platform and exposes its API. The inference workloads run on <strong>worker-aero</strong> and <strong>worker-lenovo</strong>, not through the FastAPI control service.</p>
      </section>

      <section class="master-section" aria-labelledby="master-state-title">
        <div class="master-section-header"><span class="master-section-number">03 / CLUSTER VISIBILITY</span><h2 id="master-state-title">Configured state is not running state.</h2><p>The dashboard needs to know both what we want to run and what is actually available.</p></div>
        <div class="master-state-grid">
          <article class="master-state-card master-desired">
            <span class="master-state-label">DESIRED STATE</span><h3>PostgreSQL</h3>
            <p>What should exist: model catalog, selected worker, GPU assignment, ports and profile configuration.</p>
            <div class="master-state-example">Example: Qwen profile <strong>enabled</strong> on worker-aero.</div>
          </article>
          <span class="master-state-compare" aria-hidden="true">+</span>
          <article class="master-state-card master-observed">
            <span class="master-state-label">OBSERVED STATE</span><h3>Status Collector</h3>
            <p>What exists now: worker health, real GPU availability, installed model files and running vLLM containers.</p>
            <div class="master-state-example">Example: Profile <strong>stopped</strong>; GPUs available.</div>
          </article>
        </div>
        <div class="master-state-result"><span class="master-state-result-icon" aria-hidden="true">✓</span><p><strong>Dashboard = desired configuration + observed reality.</strong> A configured profile is not necessarily running; an enabled model is not necessarily installed on every worker.</p></div>
      </section>

      <section class="master-final">
        <div><span class="master-section-number">NEXT / FROM CONTROL TO ACTION</span><h2>The master decides <em>what</em>. Ansible applies <em>how</em>.</h2><p>See how a dashboard request becomes an auditable operation that changes a GPU worker.</p></div>
        <a class="master-next-button" href="#/ansible">Explore Ansible Operations <span aria-hidden="true">→</span></a>
      </section>
    </section>`;
}


/* ==============================================================
   SECTION 10 — OUTCOMES AND ILLUSTRATIVE PERFORMANCE
   Inventory values verified against documented stable snapshot.
   Benchmark values intentionally synthetic, NOT measured.
   ============================================================== */
const resultsProfiles = [
  {
    kind: "Single-GPU profile",
    name: "GPT-OSS 20B",
    worker: "worker-lenovo",
    deployment: "1 × RTX 3090 · TP 1 / PP 1",
    profile: "gpt-oss-20b-lenovo-1gpu-balanced",
    ttft: 1.1,
    speed: 49,
    memory: 20.8,
    concurrency: 4,
    context: "16,384",
    className: "results-a"
  },
  {
    kind: "Multi-GPU profile",
    name: "Qwen3.8 27B FP8",
    worker: "worker-aero",
    deployment: "2 × RTX 3090 · TP 1 / PP 2",
    profile: "qwen3.8-27b-fp8-aero-2gpu-balanced",
    ttft: 2.9,
    speed: 22,
    memory: 22.1,
    concurrency: 2,
    context: "10,000",
    className: "results-b"
  }
];

function resultsBenchmarkCard(model) {
  return `
    <article class="results-model-card ${model.className}">
      <div class="results-model-head">
        <span class="results-model-tag">${model.kind}</span>
        <span class="results-model-icon" aria-hidden="true">${model.className === "results-a" ? "01" : "02"}</span>
      </div>
      <h3>${model.name}</h3>
      <p class="results-model-hardware">${model.worker} · ${model.deployment}</p>
      <div class="results-model-stats">
        <div><span>Time to first token</span><strong>${model.ttft.toFixed(1)} <small>s</small></strong></div>
        <div><span>Generation throughput</span><strong>${model.speed} <small>tok/s</small></strong></div>
        <div><span>Peak VRAM / GPU</span><strong>${model.memory.toFixed(1)} <small>GiB</small></strong></div>
        <div><span>Concurrent requests</span><strong>${model.concurrency} <small>requests</small></strong></div>
      </div>
      <div class="results-model-foot"><span>Configured maximum context</span><strong>${model.context} tokens</strong></div>
      <div class="results-model-profile">${model.profile}</div>
    </article>`;
}

function resultsMarkup() {
  return `
  <section class="results-page enter" aria-labelledby="results-title">
    <header class="results-hero">
      <div class="eyebrow"><span class="eyebrow-bar"></span> DELIVERY / 10 — BENCHMARKS &amp; OUTCOMES</div>
      <h1 id="results-title">From hardware to<br><span class="accent">managed AI services.</span></h1>
      <p class="results-lead">What was delivered in Securas Inference — and how different inference profiles could behave under a representative workload.</p>
      <div class="results-hero-line">
        <span class="results-evidence"><span class="results-evidence-dot"></span> Verified platform inventory</span>
        <span class="results-hero-separator" aria-hidden="true"></span>
        <span class="results-demo-label">Performance figures are illustrative only</span>
      </div>
    </header>

    <section class="results-section" aria-labelledby="results-achievements-title">
      <div class="results-section-header">
        <div><span class="results-section-number">01 / DELIVERED INFRASTRUCTURE</span><h2 id="results-achievements-title">The platform at a glance.</h2></div>
        <p>Actual inventory from the stable Securas repository, not simulated benchmark output.</p>
      </div>
      <div class="results-kpi-grid">
        <article class="results-kpi"><span class="results-kpi-index">01 / INFRASTRUCTURE</span><div class="results-kpi-number">03</div><h3>Physical nodes</h3><p>1 master + 2 GPU inference workers</p></article>
        <article class="results-kpi"><span class="results-kpi-index">02 / COMPUTE</span><div class="results-kpi-number">05</div><h3>RTX 3090 GPUs</h3><p>120 GiB aggregate physical VRAM</p></article>
        <article class="results-kpi"><span class="results-kpi-index">03 / MODEL CATALOG</span><div class="results-kpi-number">04</div><h3>Cataloged models</h3><p>GPT-OSS and Qwen model families</p></article>
        <article class="results-kpi"><span class="results-kpi-index">04 / DEPLOYMENT</span><div class="results-kpi-number">13</div><h3>Defined profiles</h3><p>Alternative GPU, context and batch configurations</p></article>
      </div>
      <p class="results-inventory-note">The 120 GiB total is the sum of five 24 GiB RTX 3090 GPUs, not a single shared memory pool. The master also has a separate RTX 3070 reserved for auxiliary use.</p>
    </section>

    <section class="results-section" aria-labelledby="results-bench-title">
      <div class="results-section-header">
        <div><span class="results-section-number">02 / PERFORMANCE COMPARISON</span><h2 id="results-bench-title">Different profiles. Different trade-offs.</h2></div>
        <p>Illustrative values to demonstrate how a benchmark comparison would be presented.</p>
      </div>
      <div class="results-disclosure" role="note" aria-label="Synthetic benchmark disclosure">
        <div class="results-disclosure-mark" aria-hidden="true">!</div>
        <div><strong>SYNTHETIC EXAMPLE — NOT MEASURED</strong><p>The figures below are plausible placeholders chosen for presentation design. They were <strong>not</strong> collected from the Securas hardware and must not be presented as test results.</p></div>
      </div>
      <div class="results-protocol">
        <div><strong>Illustrative test setup</strong><p>Warm model · 512 input tokens · 128 output tokens · one active request for latency and generation speed. Concurrency figures represent a separate hypothetical load scenario.</p></div>
        <div><strong>Profiles from real inventory</strong><p>The worker placement, GPU count, parallelism and configured context limits match the documented profiles. The timing, speed, utilization and concurrency figures are synthetic.</p></div>
      </div>
      <div class="results-model-grid">
        ${resultsProfiles.map(resultsBenchmarkCard).join("")}
      </div>

      <div class="results-compare-grid">
        <article class="results-comparison">
          <div class="results-chart-heading"><div><span class="results-chart-index">METRIC A</span><h3>Time to first token</h3><p>Lower is better · seconds</p></div><span class="results-chart-icon">↓</span></div>
          <div class="results-bars">
            ${resultsProfiles.map(model => `
              <div class="results-bar-item ${model.className}">
                <div class="results-bar-caption"><span>${model.name}</span><strong>${model.ttft.toFixed(1)} s</strong></div>
                <div class="results-bar-track"><div class="results-bar-fill" style="width:${(model.ttft / 3.2 * 100).toFixed(1)}%"></div></div>
              </div>`).join("")}
          </div>
        </article>
        <article class="results-comparison">
          <div class="results-chart-heading"><div><span class="results-chart-index">METRIC B</span><h3>Generation throughput</h3><p>Higher is better · output tokens / second</p></div><span class="results-chart-icon">↑</span></div>
          <div class="results-bars">
            ${resultsProfiles.map(model => `
              <div class="results-bar-item ${model.className}">
                <div class="results-bar-caption"><span>${model.name}</span><strong>${model.speed} tok/s</strong></div>
                <div class="results-bar-track"><div class="results-bar-fill" style="width:${(model.speed / 55 * 100).toFixed(1)}%"></div></div>
              </div>`).join("")}
          </div>
        </article>
      </div>
      <p class="results-interpretation"><strong>How to interpret:</strong> GPT-OSS 20B and Qwen3.8 27B FP8 are different models on different GPU configurations, so this is a profile illustration — <em>not</em> a controlled model-speed ranking. Actual figures require repeated measurements on the physical cluster.</p>
    </section>

    <footer class="results-finish">
      <span class="results-section-number">PROJECT OUTCOME</span>
      <h2>Private inference is now an <span>operable platform.</span></h2>
      <p>Distributed GPU machines are managed through one control plane, reusable model profiles and a controlled client API. Benchmark measurements remain a separate validation task.</p>
    </footer>
  </section>`;
}

/* ==============================================================
   SECTION 04 — MODELS & PROFILES
   Documented model catalog and configured runtime profiles.
   Static teaching UI; no API, no live runtime claims.
   ============================================================== */

const modelCatalogPresentation = [
  { id: "gpt-oss-20b", name: "GPT-OSS 20B", family: "OpenAI · GPT-OSS",
    source: "openai/gpt-oss-20b", type: "Mixture of Experts",
    format: "Catalog model", description: "A local 20B-class model with single-GPU profiles on both workers." },
  { id: "qwen3.6-27b-fp8", name: "Qwen3.6 27B FP8", family: "Qwen · 27B",
    source: "Qwen/Qwen3.6-27B-FP8", type: "Dense",
    format: "FP8", description: "A 27B dense model with balanced, long-context and throughput-oriented profiles." },
  { id: "qwen3.6-35b-a3b-fp8", name: "Qwen3.6 35B A3B FP8", family: "Qwen · 35B A3B",
    source: "Qwen/Qwen3.6-35B-A3B-FP8", type: "Mixture of Experts",
    format: "FP8", description: "A sparse MoE model with approximately 3B activated parameters per token." },
  { id: "qwen3.8-27b-fp8", name: "Qwen3.8 27B FP8", family: "Qwen · 27B",
    source: "Qwen/Qwen3.8-27B-FP8", type: "Dense",
    format: "FP8", description: "The model used for the final browser-to-gateway end-to-end validation on both workers." }
];

const modelProfilesPresentation = [
  ["qwen3.6-27b-fp8","qwen3.6-27b-fp8-aero-2gpu-balanced","worker-aero","0, 1",1,2,"10,000",1,8192],
  ["qwen3.6-27b-fp8","qwen3.6-27b-fp8-aero-2gpu-longctx","worker-aero","0, 1",1,2,"32,768",2,8192],
  ["qwen3.6-27b-fp8","qwen3.6-27b-fp8-aero-2gpu-throughput","worker-aero","0, 1",1,2,"8,192",24,16384],
  ["qwen3.6-27b-fp8","qwen3.6-27b-fp8-lenovo-2gpu-balanced","worker-lenovo","0, 1",1,2,"16,384",16,8192],
  ["qwen3.6-35b-a3b-fp8","qwen3.6-35b-a3b-fp8-aero-2gpu-balanced","worker-aero","0, 1",1,2,"16,384",4,8192],
  ["qwen3.6-35b-a3b-fp8","qwen3.6-35b-a3b-fp8-aero-2gpu-longctx","worker-aero","0, 1",1,2,"32,768",2,4096],
  ["qwen3.6-35b-a3b-fp8","qwen3.6-35b-a3b-fp8-aero-2gpu-throughput","worker-aero","0, 1",1,2,"8,192",8,8192],
  ["qwen3.6-35b-a3b-fp8","qwen3.6-35b-a3b-fp8-lenovo-2gpu-balanced","worker-lenovo","0, 1",1,2,"16,384",4,null],
  ["qwen3.8-27b-fp8","qwen3.8-27b-fp8-aero-2gpu-balanced","worker-aero","1, 2",1,2,"10,000",2,8192],
  ["qwen3.8-27b-fp8","qwen3.8-27b-fp8-lenovo-2gpu-balanced","worker-lenovo","0, 1",1,2,"10,000",4,8192],
  ["gpt-oss-20b","gpt-oss-20b-lenovo-1gpu-balanced","worker-lenovo","0",1,1,"16,384",32,8192],
  ["gpt-oss-20b","gpt-oss-20b-aero-1gpu-balanced","worker-aero","0",1,1,"13,000",2,8192],
  ["gpt-oss-20b","gpt-oss-20b-aero-1gpu-throughput","worker-aero","1",1,1,"4,000",9,3000]
].map(([modelId, name, worker, gpuIndices, tp, pp, context, maxSeqs, batchTokens]) =>
  ({modelId, name, worker, gpuIndices, tp, pp, context, maxSeqs, batchTokens})
);

let selectedModelPresentation = "qwen3.6-27b-fp8";

function modelCatalogCardPresentation(model) {
  const count = modelProfilesPresentation.filter(p => p.modelId === model.id).length;
  const active = selectedModelPresentation === model.id;
  return `
    <button type="button" class="model-catalog-card ${active ? "is-selected" : ""}"
      data-model-id="${model.id}" aria-pressed="${active ? "true" : "false"}">
      <span class="model-card-row">
        <span class="model-card-type">${model.type}</span>
        <span class="model-card-arrow" aria-hidden="true">↗</span>
      </span>
      <strong>${model.name}</strong>
      <span class="model-card-source">${model.source}</span>
      <span class="model-card-description">${model.description}</span>
      <span class="model-card-footer">
        <span>${model.format}</span>
        <span>${count} profile${count === 1 ? "" : "s"}</span>
      </span>
    </button>`;
}

function modelProfileNamePresentation(profile) {
  const ending = profile.name.split("-").pop();
  if (ending === "balanced") return "Balanced";
  if (ending === "longctx") return "Long context";
  if (ending === "throughput") return "Throughput";
  return "Configured";
}

function modelProfileDetailsPresentation() {
  const model = modelCatalogPresentation.find(item => item.id === selectedModelPresentation)
    || modelCatalogPresentation[1];
  const matching = modelProfilesPresentation.filter(profile => profile.modelId === model.id);
  return `
    <div class="model-profile-panel-header">
      <div>
        <span class="model-panel-eyebrow">SELECTED MODEL / CONFIGURED PROFILES</span>
        <h3>${model.name}</h3>
        <p>One model artifact can support different serving configurations depending on the worker, GPU placement, and workload.</p>
      </div>
      <span class="model-profile-count">${matching.length} profiles</span>
    </div>
    <div class="model-profile-table-wrap">
      <table class="model-profile-table">
        <thead><tr><th>Profile</th><th>Worker · GPUs</th><th>TP / PP</th><th>Max context</th><th>Max sequences</th></tr></thead>
        <tbody>${matching.map(p => `
          <tr>
            <td><strong>${modelProfileNamePresentation(p)}</strong><span class="model-profile-name">${p.name}</span></td>
            <td><strong>${p.worker}</strong><span class="model-profile-sub">GPU indexes ${p.gpuIndices}</span></td>
            <td class="model-mono">${p.tp} / ${p.pp}</td>
            <td class="model-mono">${p.context}</td>
            <td class="model-mono">${p.maxSeqs}</td>
          </tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="model-profile-table-note">Values are <strong>configured limits</strong>, not measured throughput or proven concurrent-request capacity. Profiles that share GPUs or ports are alternative configurations, not assumed to run simultaneously.</div>
  `;
}

function modelMarkup() {
  selectedModelPresentation = "qwen3.6-27b-fp8";
  return `
  <section class="models-page enter" aria-labelledby="models-title">
    <header class="models-hero">
      <div class="eyebrow"><span class="eyebrow-bar"></span> INFERENCE / 04 — MODELS &amp; PROFILES</div>
      <h1 id="models-title">One model.<br><span class="accent">Multiple ways to serve it.</span></h1>
      <p class="models-lead">Securas separates <strong>model artifacts</strong> from <strong>runtime profiles</strong>, so administrators can choose exactly where and how a local LLM runs.</p>
      <div class="models-hero-pills"><span>04 model entries</span><span>13 defined profiles</span><span>2 GPU workers</span><span>Local inference only</span></div>
    </header>

    <section class="models-section" aria-labelledby="models-catalog-title">
      <div class="models-section-heading">
        <div><span class="models-section-number">01 / MODEL CATALOG</span><h2 id="models-catalog-title">Four models in one central catalog.</h2></div>
        <p>Select a model to explore its runtime configurations below.</p>
      </div>
      <div class="model-catalog-grid">
        ${modelCatalogPresentation.map(modelCatalogCardPresentation).join("")}
      </div>
      <div class="models-catalog-note"><strong>Artifacts:</strong> the stable inventory documents these four model directories on both workers under <code>/srv/models</code>. The catalog keeps their source repositories and pinned revisions; the collector separately verifies what is installed.</div>
      <div class="models-concepts" aria-label="Model architecture and quantization terms">
        <div><strong>Dense</strong><p>Most model parameters participate in each token's forward pass.</p></div>
        <div><strong>MoE</strong><p>A router activates a subset of experts per token rather than every expert.</p></div>
        <div><strong>FP8</strong><p>Lower-precision weight storage can reduce GPU memory requirements.</p></div>
      </div>
    </section>

    <section class="models-section" aria-labelledby="models-distinction-title">
      <div class="models-section-heading">
        <div><span class="models-section-number">02 / KEY ARCHITECTURAL IDEA</span><h2 id="models-distinction-title">Model ≠ Profile ≠ Running service.</h2></div>
        <p>The three concepts are deliberately independent.</p>
      </div>
      <div class="models-lifecycle" role="list" aria-label="From model to running inference">
        <div class="models-lifecycle-card" role="listitem">
          <span class="models-lifecycle-number">01 / ARTIFACT</span>
          <h3>Model</h3>
          <p>Weights, tokenizer, configuration and a pinned source revision.</p>
          <span class="models-lifecycle-code">/srv/models/&lt;model-name&gt;</span>
        </div>
        <span class="models-lifecycle-arrow" aria-hidden="true">→</span>
        <div class="models-lifecycle-card models-lifecycle-middle" role="listitem">
          <span class="models-lifecycle-number">02 / DESIRED STATE</span>
          <h3>Profile</h3>
          <p>Selected worker, GPUs, TP/PP, context, batching and memory settings.</p>
          <span class="models-lifecycle-code">PostgreSQL · profiles</span>
        </div>
        <span class="models-lifecycle-arrow" aria-hidden="true">→</span>
        <div class="models-lifecycle-card" role="listitem">
          <span class="models-lifecycle-number">03 / ACTUAL RUNTIME</span>
          <h3>Serving</h3>
          <p>Docker Compose starts vLLM; a healthy backend receives an exact LiteLLM route.</p>
          <span class="models-lifecycle-code">vLLM + LiteLLM</span>
        </div>
      </div>
      <div class="models-lifecycle-summary"><strong>Why this separation?</strong> We can prepare several alternative serving profiles without copying model weights or automatically starting all their containers.</div>
    </section>

    <section class="models-section" aria-labelledby="models-profiles-title">
      <div class="models-section-heading">
        <div><span class="models-section-number">03 / CONFIGURED SERVING PROFILES</span><h2 id="models-profiles-title">Same weights. Different workloads.</h2></div>
        <p>Click any model card above to update this table.</p>
      </div>
      <div class="model-profile-panel" id="model-profile-panel">${modelProfileDetailsPresentation()}</div>
    </section>

    <section class="models-section" aria-labelledby="models-placement-title">
      <div class="models-section-heading">
        <div><span class="models-section-number">04 / GPU PLACEMENT</span><h2 id="models-placement-title">Two workers, explicit GPU allocation.</h2></div>
        <p>Examples from the final Qwen3.8 validation profiles.</p>
      </div>
      <div class="models-worker-grid">
        <article class="models-worker-card">
          <div class="models-worker-heading"><div><span>INFERENCE WORKER 01</span><h3>worker-aero</h3></div><strong>3 × RTX 3090</strong></div>
          <div class="models-gpu-line">
            <div class="models-gpu-chip"><span>GPU 0</span><small>Not selected</small></div>
            <div class="models-gpu-chip is-allocated"><span>GPU 1</span><small>Profile GPU</small></div>
            <div class="models-gpu-chip is-allocated"><span>GPU 2</span><small>Profile GPU</small></div>
          </div>
          <div class="models-placement-detail"><strong>Qwen3.8 27B FP8 — balanced</strong><span>TP 1 / PP 2 · host port 8004 · context 10,000</span></div>
        </article>
        <article class="models-worker-card">
          <div class="models-worker-heading"><div><span>INFERENCE WORKER 02</span><h3>worker-lenovo</h3></div><strong>2 × RTX 3090</strong></div>
          <div class="models-gpu-line">
            <div class="models-gpu-chip is-allocated"><span>GPU 0</span><small>Profile GPU</small></div>
            <div class="models-gpu-chip is-allocated"><span>GPU 1</span><small>Profile GPU</small></div>
          </div>
          <div class="models-placement-detail"><strong>Qwen3.8 27B FP8 — balanced</strong><span>TP 1 / PP 2 · host port 8005 · context 10,000</span></div>
        </article>
      </div>
      <div class="models-placement-insight"><strong>TP 1 / PP 2</strong> means one tensor-parallel partition and two pipeline stages: the model's layers are split between two GPUs. This design suits the cluster's multi-GPU configurations connected through PCIe risers.</div>
    </section>

    <footer class="models-final">
      <div>
        <span class="models-section-number">TAKEAWAY</span>
        <h2>Profiles make local inference <span>repeatable and controllable.</span></h2>
        <p>The model defines <strong>what</strong> we run. The profile defines <strong>where and how</strong>. vLLM and the gateway provide the serving endpoint.</p>
      </div>
      <a class="models-final-link" href="#/vllm">Explore vLLM Runtime <span aria-hidden="true">→</span></a>
    </footer>
  </section>`;
}

function bindModelCatalogPresentation() {
  const root = appElement.querySelector(".models-page");
  if (!root) return;
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-model-id]");
    if (!button) return;
    selectedModelPresentation = button.dataset.modelId;
    root.querySelectorAll("[data-model-id]").forEach(card => {
      const active = card.dataset.modelId === selectedModelPresentation;
      card.classList.toggle("is-selected", active);
      card.setAttribute("aria-pressed", String(active));
    });
    root.querySelector("#model-profile-panel").innerHTML = modelProfileDetailsPresentation();
  });
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

function dashboardMarkup() {
  return `
    <section class="detail-page enter">
      <div class="eyebrow"><span class="eyebrow-bar"></span> CONTROL / SECTION 08 — ADMIN DASHBOARD</div>
      <h1>One interface.<br><span class="accent">Full cluster control.</span></h1>
      <p class="lead detail-lead">Explore a faithful, interactive reproduction of the Securas Control admin UI, populated with representative hosts, models, profiles, operations, users, grants, and API keys.</p>
      <div class="topic-panel">
        <div class="topic-panel-label">INTERACTIVE APPLICATION DEMO</div>
        <p>The dashboard opens as a separate local page without authentication or a live backend. GPU figures, account identities, and operation events are simulated; actions cannot change real infrastructure.</p>
        <p style="margin-top:22px"><a class="text-link" href="./dashboard/" style="display:inline-flex;background:#14865c;color:white;padding:16px 22px;border-radius:12px">Open Securas Control demo →</a></p>
      </div>
      <div class="section-head compact"><div><div class="eyebrow quiet">ADMIN WORKFLOWS</div><h2>Explore all nine sections.</h2></div></div>
      <div class="point-grid">
        <div class="point"><h3>Cluster & inventory</h3><p>Overview, worker health, GPU memory, model artifact locations.</p></div>
        <div class="point"><h3>Model lifecycle</h3><p>Model catalog, installation, copy and runtime profile configuration.</p></div>
        <div class="point"><h3>Operations</h3><p>Preflight, up/down lifecycle, simulated logs and execution history.</p></div>
        <div class="point"><h3>Security & access</h3><p>Users, groups, explicit grants, callable contexts and API keys.</p></div>
      </div>
    </section>`;
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
  appElement.innerHTML = current ? (current.id === "context" ? contextMarkup() : current.id === "hardware" ? hardwareMarkup() : current.id === "network" ? networkMarkup() : current.id === "models" ? modelMarkup() : current.id === "master" ? masterMarkup() : current.id === "ansible" ? ansibleMarkup() : current.id === "dashboard" ? dashboardMarkup() : current.id === "gateway" ? gatewayMarkup() : current.id === "vllm" ? vllmMarkup() : current.id === "results" ? resultsMarkup() : sectionMarkup(current)) : overviewMarkup();
  if (current?.id === "ansible") bindAnsibleOperations();
  if (current?.id === "models") bindModelCatalogPresentation();
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
