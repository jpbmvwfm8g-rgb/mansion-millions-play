(function(){
  const stops = {
    "index.html": ["board.jpg","The board","The gold path is under your feet."],
    "jasons-place.html": ["explore.jpg","Jason's Place","The gates open. Friends wait on the lawn."],
    "store.html": ["album.jpg","The store","The album room. Stories sit on the table."]
  };
  const veil = document.createElement("div");
  veil.id = "journey";
  veil.innerHTML = '<div class="cap"><p id="jk"></p><h2 id="jt"></h2><p id="jd"></p></div>';
  document.body.appendChild(veil);
  function walk(href, title, line, img){
    veil.style.backgroundImage = "url("+(img||"board.jpg")+")";
    document.getElementById("jk").textContent = "On the path";
    document.getElementById("jt").textContent = title;
    document.getElementById("jd").textContent = line;
    veil.classList.add("on");
    setTimeout(()=>location.href = href, 700);
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if(!a) return;
    const href = a.getAttribute("href");
    if(!href || href.startsWith("http") || href.startsWith("#")) return;
    const key = href.split("/").pop();
    const trip = stops[key];
    if(!trip) return;
    e.preventDefault();
    walk(href, trip[1], trip[2], trip[0]);
  });
  const here = location.pathname.split("/").pop() || "index.html";
  const trip = stops[here];
  if(trip && !sessionStorage.getItem("mm-arrived")){
    veil.style.backgroundImage = "url("+trip[0]+")";
    document.getElementById("jk").textContent = "You arrive";
    document.getElementById("jt").textContent = trip[1];
    document.getElementById("jd").textContent = trip[2];
    veil.classList.add("on");
    sessionStorage.setItem("mm-arrived","1");
    setTimeout(()=>veil.classList.remove("on"), 900);
  }
  window.mmJourney = walk;
})();
