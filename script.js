const nodeData=[
["Node 01","Zone A","Online","Acoustic + Camera","94%"],
["Node 02","Zone A","Online","Acoustic","91%"],
["Node 03","Zone B","Online","Camera","88%"],
["Node 04","Zone B","Online","Acoustic + Camera","93%"],
["Node 05","Zone C","Online","Acoustic","90%"],
["Node 06","North Trail","Online","Acoustic","86%"],
["Node 07","East Ridge","Online","Camera","89%"],
["Node 08","South Gate","Online","Acoustic + Camera","92%"]
];

const positions=[[22,30],[31,44],[69,34],[78,53],[48,72],[18,63],[57,18],[76,78]];
const nodes=document.getElementById("nodes");
const list=document.getElementById("sensorList");
const detail=document.getElementById("sensorDetail");
const activity=document.getElementById("activityLog");
let networkOnline=true,alertCount=3,rangerNearby=false;

function log(message){
  const d=document.createElement("div");
  d.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+" · "+message;
  activity.appendChild(d);
  activity.scrollTop=activity.scrollHeight;
}

function popup(el,text){
  const p=document.getElementById("mapPopup");
  p.innerHTML=text;p.style.display="block";
  p.style.left=(el.offsetLeft+22)+"px";p.style.top=(el.offsetTop-5)+"px";
  setTimeout(()=>p.style.display="none",2200);
}

nodeData.forEach((n,i)=>{
  const e=document.createElement("div");
  e.className="sensor";
  e.style.left=positions[i][0]+"%";
  e.style.top=positions[i][1]+"%";

  const icon = n[3].includes("Camera") && n[3].includes("Acoustic")
    ? "◉"
    : n[3].includes("Camera") ? "▣" : "⌁";

  e.innerHTML = `${icon}<span class="sensor-label">${n[0]} · ${n[1]}</span>`;
  e.title = `${n[0]} · ${n[1]} · ${n[3]}`;

  e.style.pointerEvents="auto";
  e.addEventListener("click",()=>{
    detail.innerHTML =
      `<b>${n[0]}</b> · ${n[1]} · ${n[3]} · AI confidence ${n[4]} · ${n[2]}`;
    popup(e,`<b>${n[0]}</b><br>${n[1]}<br>${icon} ${n[3]}<br><span style="color:#67e8a1">● ${n[2]}</span>`);
    log("Inspected "+n[0]);
  });

  nodes.appendChild(e);
});

const rangerPositions=[
  [15,42,"Ranger 01","Zone A","On patrol"],
  [72,24,"Ranger 02","Zone B","On patrol"],
  [55,60,"Ranger 03","Zone C","Available"],
  [84,70,"Ranger 04","South Gate","Standby"]
];
const rangers=document.getElementById("rangers");
rangerPositions.forEach((r,i)=>{
  const el=document.createElement("div");
  el.className="ranger-marker";
  el.style.left=r[0]+"%"; el.style.top=r[1]+"%";
  el.innerHTML=`🛡️<span class="ranger-label">${r[2]} · ${r[3]}</span>`;
  el.title=`${r[2]} · ${r[3]} · ${r[4]}`;
  el.onclick=()=>{
    popup(el,`<b>${r[2]}</b><br>${r[3]}<br><span style="color:#67e8a1">● ${r[4]}</span>`);
    log("Inspected "+r[2]);
  };
  rangers.appendChild(el);
});

function render(filter="all"){
  list.innerHTML="";
  nodeData.forEach((n,i)=>{
    const on=n[2]=="Online";
    if(filter=="online"&&!on || filter=="offline"&&on)return;
    list.innerHTML+=`<div class="sensor-row" data-i="${i}" style="cursor:pointer">
      <div><div class="sensor-name">${n[0]}</div><div class="sensor-meta">${n[1]} · ${n[3]}</div></div>
      <div class="${on?'online':'offline-net'}">● ${n[2]}</div>
    </div>`;
  });
  document.querySelectorAll(".sensor-row").forEach(r=>r.onclick=()=>{
    const n=nodeData[+r.dataset.i];
    detail.innerHTML=`<b>${n[0]}</b> · ${n[1]} · ${n[3]} · ${n[4]} · ${n[2]}`;
    log("Selected "+n[0]);
  });
}
render();

function toast(message){
  const t=document.getElementById("toast");
  t.textContent=message;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2400);
}

function createEvent(type){
  alertCount++;
  document.getElementById("alertCount").textContent=alertCount;

  let conf,zone,evidence,markerClass,markerLeft,markerTop,badgeClass;
  if(type==="Gunshot"){
    conf=90+Math.floor(Math.random()*9);
    zone="Zone A"; evidence="Audio";
    markerLeft=28; markerTop=37; badgeClass="threat-badge";
  }else{
    conf=82+Math.floor(Math.random()*12);
    zone="Zone B"; evidence="Audio";
    markerLeft=61; markerTop=55; badgeClass="threat-badge";
  }

  document.getElementById("confidence").textContent=conf+"%";
  document.getElementById("eventConfidence").textContent=conf+"%";
  document.getElementById("eventTitle").textContent=type;
  document.getElementById("eventZone").textContent=zone;
  document.getElementById("eventEvidence").textContent=evidence;
  document.getElementById("eventStatus").textContent=networkOnline
    ? (rangerNearby ? "Ranger nearby — awaiting verification" : "Pending verification")
    : "Queued — no backhaul";
  document.getElementById("eventStatus").style.color="";

  const badge=document.getElementById("eventBadge");
  badge.textContent="THREAT DETECTED";
  badge.className="badge "+badgeClass;

  document.getElementById("eventTime").textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  document.getElementById("evidenceTitle").textContent="Acoustic signature";
  document.getElementById("evidenceFile").textContent=
    type==="Chainsaw" ? "simulated_chainsaw_0217.wav" : "simulated_gunshot_0217.wav";
  document.getElementById("cameraEvidence").textContent=
    rangerNearby ? "Ranger 04 nearby — awaiting officer verification" : "Human activity detected nearby";
  document.getElementById("cameraConfidence").textContent=rangerNearby ? "96%" : "88%";

  document.getElementById("events").innerHTML=
    `<div class="threat-marker" style="left:${markerLeft}%;top:${markerTop}%">
       ⚠
       <span class="threat-label">${type} threat</span>
     </div>`;

  // Detection never advances the workflow. It remains at Sense
  // until the authorized officer clicks Verify Alert.
  setWorkflow(0);

  log(`${type} detected · ${conf}% confidence`);
  toast("⚠ "+type+" alert received");
}

document.getElementById("simulateBtn").onclick=()=>createEvent("Gunshot");
document.getElementById("simulateChainsaw").onclick=()=>createEvent("Chainsaw");

document.getElementById("verifyBtn").onclick=()=>{
  document.getElementById("eventStatus").textContent="Verified by duty officer";
  document.getElementById("eventStatus").style.color="#67e8a1";

  // ONLY a supervisor/officer clicking Verify Alert changes the workflow.
  setWorkflow(4);
  document.getElementById("workflowStatus").innerHTML="<strong>Current stage:</strong> Verify — alert confirmed by authorized officer";

  log("Alert verified by authorized officer");
  toast("✓ Alert verified — workflow moved to VERIFY");
};



function setWorkflow(stage){
  const steps=[
    document.getElementById("stepSense"),
    document.getElementById("stepUnderstand"),
    document.getElementById("stepLocate"),
    document.getElementById("stepConnect"),
    document.getElementById("stepVerify")
  ];
  steps.forEach((s,i)=>{
    s.classList.remove("active","completed","alerted","verify-step");
    if(i < stage) s.classList.add("completed");
    if(i === stage) s.classList.add("active");
  });
  if(stage === 4) steps[4].classList.add("verify-step");

  const messages=[
    "Sense — monitoring field sensors",
    "Understand — AI is analysing the detected event",
    "Locate — estimating the event area",
    "Connect — alert routed to the ranger network",
    "Verify — ranger nearby has been alerted"
  ];
  document.getElementById("workflowStatus").innerHTML="<strong>Current stage:</strong> "+messages[stage];
}


function showRangers(){
  const layer=document.getElementById("rangers");
  if(!layer) return;
  layer.style.display="block";
  layer.innerHTML=`
    <div class="ranger-pin" style="left:42%;top:32%;pointer-events:auto" title="Ranger 01 · Zone A">🛡️<span class="ranger-label">Ranger 01</span></div>
    <div class="ranger-pin" style="left:70%;top:46%;pointer-events:auto" title="Ranger 02 · Zone B">🛡️<span class="ranger-label">Ranger 02</span></div>
    <div class="ranger-pin" style="left:57%;top:66%;pointer-events:auto" title="Ranger 03 · Zone C">🛡️<span class="ranger-label">Ranger 03</span></div>
    <div class="ranger-pin" style="left:55%;top:58%;pointer-events:auto" title="Ranger 04 · 350 m">🛡️<span class="ranger-label">Ranger 04 · 350m</span></div>
  `;
}
function hideRangers(){
  const layer=document.getElementById("rangers");
  if(layer){
    layer.style.display="none";
    layer.innerHTML="";
  }
}

document.getElementById("simulateRanger").onclick=()=>{
  rangerNearby=!rangerNearby;
  const btn=document.getElementById("simulateRanger");
  const events=document.getElementById("events");

  if(rangerNearby){
    btn.textContent="🛡️ Ranger Nearby: ON";
    showRangers();
    const existing=document.getElementById("rangerPin");
    if(existing) existing.remove();
    rangers.insertAdjacentHTML("beforeend",
      '<div id="rangerPin" class="ranger-marker" style="left:55%;top:58%">🛡️<span class="ranger-label">Ranger 04 · 350 m</span></div>'
    );
    document.getElementById("eventStatus").textContent="Ranger nearby — verification available";
    document.getElementById("eventStatus").style.color="#67e8a1";
    document.getElementById("cameraEvidence").textContent="Authorized ranger activity detected nearby";
    document.getElementById("cameraConfidence").textContent="96%";
    log("Ranger 04 detected nearby · Zone C · 350 m");
    document.getElementById("rangerStatus").textContent="Ranger 04 · On patrol · 350 m";
    // Ranger availability does not advance the workflow.
    setWorkflow(0);
    log("Ranger 04 alerted and standing by for supervisor verification");
    toast("🛡️ Ranger 04 alerted — awaiting verification");
  }else{
    btn.textContent="🛡️ Ranger Nearby";
    hideRangers();
    const pin=document.getElementById("rangerPin");
    if(pin) pin.remove();
    document.getElementById("eventStatus").textContent=networkOnline?"Pending verification":"Queued — no backhaul";
    document.getElementById("eventStatus").style.color="";
    document.getElementById("cameraEvidence").textContent="Human activity detected nearby";
    document.getElementById("cameraConfidence").textContent="88%";
    log("Ranger 04 left simulated patrol area");
    document.getElementById("rangerStatus").textContent="No ranger nearby";
    setWorkflow(0);
    toast("🛡️ Ranger no longer nearby");
  }
};

document.getElementById("toggleNetwork").onclick=()=>{
  networkOnline=!networkOnline;
  document.getElementById("toggleNetwork").textContent=networkOnline?"📡 Toggle Network":"📴 Network Offline";
  const status=document.getElementById("networkStatus");
  status.textContent=networkOnline?"ONLINE":"OFFLINE";
  status.classList.toggle("offline-net",!networkOnline);
  log(networkOnline?"Backhaul restored":"Backhaul unavailable — local LoRa mode");
  toast(networkOnline?"📡 Backhaul restored":"📴 No internet — local gateway mode");
};

document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active-filter"));
  b.classList.add("active-filter");
  render(b.dataset.filter);
});

document.addEventListener("keydown",e=>{
  if(e.key.toLowerCase()=="g")createEvent("Gunshot");
  if(e.key.toLowerCase()=="c")createEvent("Chainsaw");
});
