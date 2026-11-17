/* Securas Inference presentation — browser-only mock API.
   No credentials, backend requests, or real cluster operations. All writes are ephemeral. */
(function () {
  "use strict";
  window.SECURAS_DEMO_PHOTOS = {
    "worker-acer": "../assets/hardware-reference/hardware-01.jpeg",
    "worker-lenovo": "../assets/hardware-reference/hardware-02.jpeg",
    "worker-aero": "../assets/hardware-reference/hardware-03.jpeg"
  };

  const stamp = (mins) => new Date(Date.now() - mins * 60000).toISOString();
  const revisions = [
    "6cee5e81ee83917806bbde320786a8fb61efebee",
    "e89b16ebf1988b3d6befa7de50abc2d76f26eb09",
    "95a723d08a9490559dae23d0cff1d9466213d989",
    "017b9c7af6b5689d5dd426a76e0bc077eb5ca20a"
  ];
  const models = [
    {id:1,name:"gpt-oss-20b",display_name:"GPT-OSS 20B",source_ref:"openai/gpt-oss-20b",revision:revisions[0],enabled:true,runtime_options:{}},
    {id:2,name:"qwen3.6-27b-fp8",display_name:"Qwen3.6 27B FP8",source_ref:"Qwen/Qwen3.6-27B-FP8",revision:revisions[1],enabled:true,runtime_options:{reasoning_parser:"qwen3"}},
    {id:3,name:"qwen3.6-35b-a3b-fp8",display_name:"Qwen3.6 35B A3B FP8",source_ref:"Qwen/Qwen3.6-35B-A3B-FP8",revision:revisions[2],enabled:true,runtime_options:{}},
    {id:4,name:"qwen3.8-27b-fp8",display_name:"Qwen3.8 27B FP8",source_ref:"Qwen/Qwen3.8-27B-FP8",revision:revisions[3],enabled:true,runtime_options:{reasoning_parser:"qwen3"}}
  ];
  const hosts = [
    {id:1,name:"worker-acer",role:"control_plane",cluster_ip:"192.168.100.16",enabled:true},
    {id:2,name:"worker-aero",role:"inference",cluster_ip:"192.168.100.31",enabled:true},
    {id:3,name:"worker-lenovo",role:"inference",cluster_ip:"192.168.100.33",enabled:true}
  ];
  const gpus = [
    {id:1,host_id:2,host_index:0,name:"NVIDIA GeForce RTX 3090",enabled:true,uuid:"GPU-DEMO-AERO-0"},
    {id:2,host_id:2,host_index:1,name:"NVIDIA GeForce RTX 3090",enabled:true,uuid:"GPU-DEMO-AERO-1"},
    {id:3,host_id:2,host_index:2,name:"NVIDIA GeForce RTX 3090",enabled:true,uuid:"GPU-DEMO-AERO-2"},
    {id:4,host_id:3,host_index:0,name:"NVIDIA GeForce RTX 3090",enabled:true,uuid:"GPU-DEMO-LENOVO-0"},
    {id:5,host_id:3,host_index:1,name:"NVIDIA GeForce RTX 3090",enabled:true,uuid:"GPU-DEMO-LENOVO-1"}
  ];
  const specs = [
    [1,2,2,[0,1],8001,1,2,10000,8192,1],
    [2,2,2,[0,1],8001,1,2,32768,8192,2],
    [3,2,2,[0,1],8001,1,2,8192,16384,24],
    [4,3,2,[0,1],8003,1,2,16384,8192,4],
    [5,3,2,[0,1],8003,1,2,32768,4096,2],
    [6,3,2,[0,1],8003,1,2,8192,8192,8],
    [7,1,3,[0],8002,1,1,16384,8192,32],
    [8,2,3,[0,1],8001,1,2,16384,8192,16],
    [9,3,3,[0,1],8003,1,2,16384,8192,4],
    [11,4,2,[1,2],8004,1,2,10000,8192,2],
    [12,4,3,[0,1],8005,1,2,10000,8192,4],
    [13,1,2,[0],8001,1,1,13000,8192,2],
    [14,1,2,[1],8011,1,1,4000,3000,9]
  ];
  const profileName = {
    1:"qwen3.6-27b-fp8-aero-2gpu-balanced",
    2:"qwen3.6-27b-fp8-aero-2gpu-longctx",
    3:"qwen3.6-27b-fp8-aero-2gpu-throughput",
    4:"qwen3.6-35b-a3b-fp8-aero-2gpu-balanced",
    5:"qwen3.6-35b-a3b-fp8-aero-2gpu-longctx",
    6:"qwen3.6-35b-a3b-fp8-aero-2gpu-throughput",
    7:"gpt-oss-20b-lenovo-1gpu-balanced",
    8:"qwen3.6-27b-fp8-lenovo-2gpu-balanced",
    9:"qwen3.6-35b-a3b-fp8-lenovo-2gpu-balanced",
    11:"qwen3.8-27b-fp8-aero-2gpu-balanced",
    12:"qwen3.8-27b-fp8-lenovo-2gpu-balanced",
    13:"gpt-oss-20b-aero-1gpu-balanced",
    14:"gpt-oss-20b-aero-1gpu-throughput"
  };
  const profiles = specs.map(([id,model_id,host_id,indices,port,tp,pp,context,batch,seq]) => ({
    id,name:profileName[id],model_id,model_name:models.find(x => x.id === model_id).name,
    host_id,host_name:hosts.find(x => x.id === host_id).name,
    host_port:port,gpus:indices.map(i => ({id:gpus.find(g => g.host_id === host_id && g.host_index === i).id,host_index:i})),
    tensor_parallel_size:tp,pipeline_parallel_size:pp,max_model_len:context,
    max_num_batched_tokens:batch,max_num_seqs:seq,gpu_memory_utilization:0.90,
    dtype:"auto",distributed_executor_backend:"mp",enable_prefix_caching:true,
    enable_chunked_prefill:true,runtime_options:{},enabled:true
  }));
  const running = new Set([1,7]);
  const installations = {2:new Set([1,2,3,4]),3:new Set([1,2,4])};
  const users = [
    {id:1,username:"demo.admin",email:"admin@securas.demo",role:"admin",enabled:true},
    {id:2,username:"inference.dev",email:"inference.dev@securas.demo",role:"user",enabled:true},
    {id:3,username:"pentest.agent",email:"pentest.agent@securas.demo",role:"user",enabled:true},
    {id:4,username:"researcher",email:"researcher@securas.demo",role:"user",enabled:true},
    {id:5,username:"legacy.client",email:"legacy.client@securas.demo",role:"user",enabled:false}
  ];
  const groups = [{id:1,name:"Engineering",enabled:true},{id:2,name:"Security Agents",enabled:true},{id:3,name:"Research",enabled:true}];
  const memberships = [{user_id:2,group_id:1},{user_id:3,group_id:2},{user_id:4,group_id:3},{user_id:1,group_id:1},{user_id:2,group_id:2}];
  const grants = [
    {id:1,principal_type:"group",principal_id:1,target_type:"model",target_id:2},
    {id:2,principal_type:"group",principal_id:2,target_type:"profile",target_id:7},
    {id:3,principal_type:"group",principal_id:3,target_type:"model",target_id:4},
    {id:4,principal_type:"user",principal_id:3,target_type:"profile",target_id:1},
    {id:5,principal_type:"user",principal_id:2,target_type:"model",target_id:1}
  ];
  const apiKeys = [
    {user_id:2,label:"development-client",key_alias:"sk-demo-••••-A1",context_name:"Engineering",models:[profileName[1],profileName[7]],blocked:false,spend:0,expires:stamp(-60*24*25),last_active:stamp(45)},
    {user_id:3,label:"pentest-agent",key_alias:"sk-demo-••••-B2",context_name:"Security Agents",models:[profileName[7]],blocked:false,spend:0,expires:stamp(-60*24*10),last_active:stamp(180)},
    {user_id:4,label:"research-demo",key_alias:"sk-demo-••••-C3",context_name:"Research",models:[profileName[11]],blocked:true,spend:0,expires:stamp(-60*24*5),last_active:stamp(2000)}
  ];
  const operations = [
    [65,"profile_up","succeeded",1,2,18],
    [64,"profile_check","succeeded",1,2,24],
    [63,"profile_up","succeeded",7,3,36],
    [62,"profile_down","succeeded",8,3,106],
    [61,"model_copy","succeeded",4,3,170],
    [60,"profile_check","failed",9,3,390],
    [59,"model_install","succeeded",3,2,750],
    [58,"profile_down","succeeded",4,2,910],
    [57,"model_install","succeeded",1,3,1500]
  ].map(([id,kind,status,target,host_id,mins]) => ({
    id,kind,status,host_id,worker_id:host_id,host_name:hosts.find(h=>h.id===host_id).name,
    profile_name:kind.startsWith("profile") ? profileName[target] : null,
    model_name:kind.startsWith("model") ? models.find(m=>m.id===target).name : null,
    requested_by_username:"demo.admin",requested_at:stamp(mins + 1),started_at:stamp(mins),
    finished_at:stamp(mins - 1),exit_code:status==="failed"?1:0,
    result_summary:status==="failed"?"Preflight failed: conflicting resource allocation":"Completed successfully",
    log_tail:status==="failed"?
      "TASK [profile_preflight] GPU allocation rejected\nfatal: [worker-lenovo]: FAILED! => PCIe / allocation conflict\nPLAY RECAP: failed=1":
      "PLAY [Securas inference operation]\nTASK [Validate worker and model] ok\nTASK [Verify GPU resources] ok\nTASK [Execute requested lifecycle] changed\nTASK [Update gateway registration] ok\nPLAY RECAP: ok=4 changed=1 failed=0"
  }));
  let nextId = 66;
  const ok = (value, status=200) => new Response(JSON.stringify(value), {status,headers:{"Content-Type":"application/json"}});
  const err = (message,status=400) => ok({detail:message},status);
  const paginate = (items, q) => {
    const pageSize=Math.max(1,Number(q.get("page_size")||25));
    const pages=Math.max(1,Math.ceil(items.length/pageSize));
    const page=Math.max(1,Math.min(pages,Number(q.get("page")||1)));
    return {data:items.slice((page-1)*pageSize,page*pageSize),pagination:{page,page_size:pageSize,total:items.length,pages}};
  };
  const byId = (arr,id) => arr.find(x => Number(x.id)===Number(id));
  const namedGrants = () => grants.map(g => Object.assign({},g,{
    principal_name:g.principal_type==="user"?(byId(users,g.principal_id)?.username||"Unknown"):(byId(groups,g.principal_id)?.name||"Unknown"),
    principal_email:g.principal_type==="user"?byId(users,g.principal_id)?.email:null,
    target_name:g.target_type==="model"?byId(models,g.target_id)?.name:byId(profiles,g.target_id)?.name
  }));
  function effectiveFor(grantSet) {
    const ids=new Set();
    grantSet.forEach(g=>{
      if(g.target_type==="profile") ids.add(g.target_id);
      else profiles.filter(p=>p.model_id===g.target_id).forEach(p=>ids.add(p.id));
    });
    const allowed=profiles.filter(p=>ids.has(p.id)&&p.enabled&&byId(models,p.model_id)?.enabled);
    return {
      available:true,
      models:[...new Set(allowed.map(p=>p.model_id))].map(id=>({model_name:byId(models,id).name,profiles:allowed.filter(p=>p.model_id===id).map(p=>p.name)})),
      profiles:allowed.map(p=>({profile_name:p.name,model_name:p.model_name,contexts:["Direct / group"],grant_sources:["group_model"]}))
    };
  }
  function userWorkspace(id) {
    const user=byId(users,id);
    const assigned=memberships.filter(m=>m.user_id===user.id).map(m=>byId(groups,m.group_id)).filter(Boolean);
    const direct=namedGrants().filter(g=>g.principal_type==="user"&&g.principal_id===user.id);
    const related=grants.filter(g=>(g.principal_type==="user"&&g.principal_id===user.id)||(g.principal_type==="group"&&assigned.some(x=>x.id===g.principal_id)));
    return {user,memberships:assigned,direct_grants:direct,effective_access:effectiveFor(related)};
  }
  function groupWorkspace(id) {
    const group=byId(groups,id);
    const members=memberships.filter(m=>m.group_id===group.id).map(m=>byId(users,m.user_id)).filter(Boolean);
    const direct=namedGrants().filter(g=>g.principal_type==="group"&&g.principal_id===group.id);
    return {group,members,direct_grants:direct,effective_access:effectiveFor(direct)};
  }
  function dashboard() {
    const runningProfiles=profiles.filter(p=>running.has(p.id)).map(p=>({
      name:p.name,model:p.model_name,worker:p.host_name,
      gpus:p.gpus.map(g=>g.host_index),runtime:"running",health:"healthy",gateway:"registered"
    }));
    const occupied = new Set();
    profiles.filter(p=>running.has(p.id)).forEach(p=>p.gpus.forEach(g=>occupied.add(g.id)));
    const workers=hosts.map(h=>{
      const workerGpus=gpus.filter(g=>g.host_id===h.id).map(g=>{
        const p=profiles.find(p=>running.has(p.id)&&p.gpus.some(pg=>pg.id===g.id));
        const allocated=occupied.has(g.id);
        return {index:g.host_index,name:g.name,allocated,profile:p?.name||null,
          memory_used_mib:allocated?20720:340,memory_total_mib:24576,
          utilization_percent:allocated?63:1,temperature_c:allocated?69:38};
      });
      if (h.role==="control_plane") workerGpus.push({
        index:0,name:"NVIDIA GeForce RTX 3070 · auxiliary agent",allocated:false,profile:null,
        memory_used_mib:1700,memory_total_mib:8192,utilization_percent:9,temperature_c:41
      });
      return Object.assign({},h,{state:"online",reachable:true,
        system:{load1:h.role==="control_plane"?0.31:h.id===2?2.48:1.37,
          memory_used_mib:h.role==="control_plane"?12500:21400,memory_total_mib:32768,
          model_disk:{available_bytes:h.id===2?162000000000:h.id===3?229000000000:68000000000}},
        gpus:workerGpus,
        artifacts:h.role==="inference"?models.map(m=>({model_id:m.id,status:installations[h.id]?.has(m.id)?"installed":"missing"})):[]
      });
    });
    return {generated_at:new Date().toISOString(),stale:false,workers,running_profiles:runningProfiles,
      recent_operations:operations.slice(0,6),
      summary:{workers_online:2,workers_total:2,gpus_total:5,gpus_free:5-occupied.size,
        profiles_running:running.size,operations_running:0,gateway_healthy:true}};
  }
  function newOperation(kind,profileOrModel,hostId,failReason) {
    const isProfile=kind.startsWith("profile");
    const op={id:nextId++,kind,status:failReason?"failed":"succeeded",host_id:hostId,worker_id:hostId,
      host_name:byId(hosts,hostId)?.name,profile_name:isProfile?profileOrModel.name:null,
      model_name:isProfile?null:profileOrModel.name,requested_by_username:"demo.admin",
      requested_at:stamp(0.1),started_at:stamp(0.09),finished_at:new Date().toISOString(),
      exit_code:failReason?1:0,result_summary:failReason||"Demo operation completed",
      log_tail:failReason?"PLAY [Preflight]\nTASK [Validate GPU resources] FAILED: "+failReason:
        "PLAY [Securas Inference — simulated]\nTASK [Reach worker] ok\nTASK [Verify model artifact] ok\nTASK [Run Ansible task] changed\nTASK [Refresh LiteLLM route] ok\nPLAY RECAP: ok=4 changed=1 failed=0"};
    operations.unshift(op);return op;
  }
  function contextData(id) {
    const user=byId(users,id);
    const workspace=userWorkspace(id);
    const groupsForUser=workspace.memberships;
    return {contexts:[
      {context_id:"direct",name:"Direct user grants",available:user.enabled,
        models:workspace.effective_access.profiles.map(p=>p.profile_name)},
      ...groupsForUser.map(g=>({context_id:"group:"+g.id,name:g.name,available:user.enabled&&g.enabled,
        models:effectiveFor(grants.filter(x=>x.principal_type==="group"&&x.principal_id===g.id)).profiles.map(p=>p.profile_name)}))
    ]};
  }
  function changeEnabled(kind,id,value) {
    const row=byId(({models,profiles,users,groups})[kind],id);
    if(!row)return err("Not found",404);
    row.enabled=value;return ok(row);
  }
  async function handle(path,method,body) {
    const url=new URL(path,location.origin),route=url.pathname,q=url.searchParams;
    const parts=route.split("/").filter(Boolean), tail=parts.slice(3); // /api/v1/admin/...
    if(route==="/api/v1/auth/me")return ok({user:users[0]});
    if(route==="/api/v1/auth/csrf")return ok({csrf_token:"demo-only"});
    if(route==="/api/v1/auth/logout")return ok({success:true});
    if(route==="/api/v1/admin/dashboard")return ok(dashboard());
    if(route==="/api/v1/admin/hosts")return ok({hosts});
    if(route==="/api/v1/admin/gpus")return ok({gpus});
    if(tail[0]==="models") {
      const id=Number(tail[1]);
      if(tail.length===1&&method==="GET")return ok({models});
      if(tail.length===1&&method==="POST") {
        const model={id:Math.max(...models.map(x=>x.id))+1,name:body.name||"new-model",
          display_name:body.display_name||body.name||"New model",source_ref:body.source_ref||"",
          revision:body.revision||revisions[0],enabled:true,runtime_options:body.runtime_options||{}};
        models.push(model);return ok(model,201);
      }
      if(tail.length===3&&tail[2]==="upstream")return ok({model_id:id,pinned_revision:byId(models,id)?.revision,upstream_revision:byId(models,id)?.revision,up_to_date:true,status:"up_to_date"});
      if(tail.length===3&&(tail[2]==="enable"||tail[2]==="disable"))return changeEnabled("models",id,tail[2]==="enable");
      if(tail.length===2&&method!=="GET"){Object.assign(byId(models,id)||{},body);return ok(byId(models,id));}
      if(tail.length===3&&(tail[2]==="install"||tail[2]==="copy")) {
        const hostId=Number(body.host_id||body.target_host_id||body.destination_host_id||body.target);
        const dest=hostId===2||hostId===3?hostId:3;
        installations[dest].add(id);
        return ok(newOperation(tail[2]==="install"?"model_install":"model_copy",byId(models,id),dest));
      }
    }
    if(tail[0]==="profiles") {
      const id=Number(tail[1]),p=byId(profiles,id);
      if(tail.length===1&&method==="GET")return ok({profiles});
      if(tail.length===1&&method==="POST") {
        const model=byId(models,Number(body.model_id)),host=byId(hosts,Number(body.host_id));
        const indices=(body.gpu_ids||[]).map(gid=>byId(gpus,Number(gid))?.host_index).filter(x=>x!==undefined);
        const profile=Object.assign({
          id:Math.max(...profiles.map(x=>x.id))+1,name:"custom-demo-profile",model_id:model?.id||1,
          model_name:model?.name||models[0].name,host_id:host?.id||2,host_name:host?.name||hosts[1].name,
          host_port:8006,gpus:indices.map(i=>({id:gpus.find(x=>x.host_id===(host?.id||2)&&x.host_index===i)?.id,host_index:i})),
          tensor_parallel_size:1,pipeline_parallel_size:1,max_model_len:8192,gpu_memory_utilization:0.9,
          runtime_options:{},enabled:true
        },body);
        profile.model_name=model?.name||profile.model_name;
        profile.host_name=host?.name||profile.host_name;
        profiles.push(profile);return ok(profile,201);
      }
      if(tail.length===3&&["up","down","check"].includes(tail[2])){
        if(!p)return err("Profile not found",404);
        if(tail[2]==="up"){
          const occupied=profiles.filter(other=>running.has(other.id)&&other.host_id===p.host_id&&other.id!==p.id);
          if(occupied.some(other=>other.gpus.some(g=>p.gpus.some(pg=>pg.id===g.id))))
            return ok(newOperation("profile_up",p,p.host_id,"Selected GPUs are allocated to another running profile."));
          running.add(p.id);
        }
        if(tail[2]==="down")running.delete(p.id);
        return ok(newOperation("profile_"+tail[2],p,p.host_id));
      }
      if(tail.length===3&&(tail[2]==="enable"||tail[2]==="disable"))return changeEnabled("profiles",id,tail[2]==="enable");
      if(tail.length===2&&method!=="GET"){Object.assign(p||{},body);return ok(p||{});}
    }
    if(tail[0]==="operations"){
      if(tail[1])return ok(byId(operations,Number(tail[1]))||{});
      let result=operations.slice();
      if(q.get("kind"))result=result.filter(o=>o.kind===q.get("kind"));
      if(q.get("status"))result=result.filter(o=>o.status===q.get("status"));
      if(q.get("worker_id"))result=result.filter(o=>String(o.host_id)===q.get("worker_id"));
      if(q.get("from"))result=result.filter(o=>o.requested_at>=q.get("from"));
      if(q.get("to"))result=result.filter(o=>o.requested_at<=q.get("to"));
      const page=paginate(result,q);return ok({operations:page.data,pagination:page.pagination});
    }
    if(tail[0]==="users"){
      const id=Number(tail[1]);
      if(tail.length===1&&method==="GET"){
        let result=users.slice();
        if(q.get("email"))result=result.filter(u=>u.email.toLowerCase().includes(q.get("email").toLowerCase()));
        if(q.get("role"))result=result.filter(u=>u.role===q.get("role"));
        const page=paginate(result,q);return ok({users:q.get("paginated")==="true"?page.data:result,pagination:page.pagination});
      }
      if(tail.length===1&&method==="POST"){
        const u={id:Math.max(...users.map(x=>x.id))+1,username:body.username||"new.user",
          email:body.email||"new.user@securas.demo",role:"user",enabled:true};
        users.push(u);return ok(u,201);
      }
      if(tail[2]==="workspace")return ok(userWorkspace(id));
      if(tail[2]==="api-key-contexts")return ok(contextData(id));
      if(tail[2]==="api-keys"){
        if(tail[3]&&method!=="GET"){
          const key=apiKeys.find(k=>k.key_alias===decodeURIComponent(tail[3]));if(key)key.blocked=true;
          return ok({success:true});
        }
        if(method==="GET")return ok({api_keys:apiKeys.filter(k=>k.user_id===id)});
        const contexts=contextData(id).contexts;
        const ctx=contexts.find(c=>String(c.context_id)===String(body.context_id))||contexts[0];
        const key={user_id:id,key_alias:"sk-demo-••••-"+String(apiKeys.length+1),label:body.label||"demo-key",
          context_name:ctx?.name||"Demo",models:ctx?.models||[],blocked:false,
          spend:0,expires:stamp(-60*24*(body.duration_days||30)),last_active:null};
        apiKeys.unshift(key);return ok(Object.assign({},key,{key:"sk-demo-NONFUNCTIONAL-PRESENTATION-ONLY"}),201);
      }
      if(tail[2]==="groups"&&tail.length===4){
        const group_id=Number(tail[3]);
        if(method==="DELETE"){const at=memberships.findIndex(m=>m.user_id===id&&m.group_id===group_id);if(at>=0)memberships.splice(at,1);}
        else if(!memberships.some(m=>m.user_id===id&&m.group_id===group_id))memberships.push({user_id:id,group_id});
        return ok({success:true});
      }
      if(tail[2]==="enable"||tail[2]==="disable")return changeEnabled("users",id,tail[2]==="enable");
      if(tail.length>=2&&method!=="GET"){Object.assign(byId(users,id)||{},body);return ok(byId(users,id)||{success:true});}
    }
    if(tail[0]==="groups"){
      const id=Number(tail[1]);
      if(tail.length===1&&method==="GET"){
        let result=groups.slice();
        if(q.get("name"))result=result.filter(g=>g.name.toLowerCase().includes(q.get("name").toLowerCase()));
        if(q.has("enabled"))result=result.filter(g=>String(g.enabled)===q.get("enabled"));
        const page=paginate(result,q);return ok({groups:q.get("paginated")==="true"?page.data:result,pagination:page.pagination});
      }
      if(tail.length===1&&method==="POST"){
        const group={id:Math.max(...groups.map(x=>x.id))+1,name:body.name||"New group",enabled:true};
        groups.push(group);return ok(group,201);
      }
      if(tail[2]==="workspace")return ok(groupWorkspace(id));
      if(tail[2]==="members"&&tail[3]){
        const user_id=Number(tail[3]);
        if(method==="DELETE"){const at=memberships.findIndex(m=>m.group_id===id&&m.user_id===user_id);if(at>=0)memberships.splice(at,1);}
        else if(!memberships.some(m=>m.group_id===id&&m.user_id===user_id))memberships.push({group_id:id,user_id});
        return ok({success:true});
      }
      if(tail[2]==="enable"||tail[2]==="disable")return changeEnabled("groups",id,tail[2]==="enable");
      if(tail.length===2&&method!=="GET"){Object.assign(byId(groups,id)||{},body);return ok(byId(groups,id)||{});}
    }
    if(tail[0]==="grants"){
      if(method==="DELETE"){
        const at=grants.findIndex(g=>g.id===Number(tail[1]));if(at>=0)grants.splice(at,1);
        return ok({success:true});
      }
      if(method==="POST"){
        const grant=Object.assign({id:Math.max(0,...grants.map(x=>x.id))+1},body);
        grants.push(grant);return ok(grant,201);
      }
      let result=namedGrants();
      if(q.get("principal_type"))result=result.filter(g=>g.principal_type===q.get("principal_type"));
      if(q.get("subject"))result=result.filter(g=>(g.principal_name+" "+(g.principal_email||"")).toLowerCase().includes(q.get("subject").toLowerCase()));
      if(q.get("target_type"))result=result.filter(g=>g.target_type===q.get("target_type"));
      if(q.get("target"))result=result.filter(g=>g.target_name.toLowerCase().includes(q.get("target").toLowerCase()));
      const page=paginate(result,q);return ok({grants:q.get("paginated")==="true"?page.data:result,pagination:page.pagination});
    }
    return err("This action is not available in the offline demo: "+method+" "+route,404);
  }
  const realFetch=window.fetch.bind(window);
  window.fetch=function(input,init) {
    const path=typeof input==="string"?input:input?.url||"";
    if(!path.startsWith("/api/v1/"))return realFetch(input,init);
    let body={};try{body=init?.body?JSON.parse(init.body):{};}catch{}
    return Promise.resolve().then(()=>handle(path,init?.method||"GET",body)).catch(e=>err("Mock API: "+e.message,500));
  };
})();
