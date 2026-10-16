/* Mansion Millions play FX (2026-10-15)
   - Real game-piece token (the player's selected piece from the 39-token set) hops tile to tile with a bounce.
   - Gold coin dice: two 3D dice tumble with sparkle.
   - Cash-out: tile pop, coin + bill rain, rolling Mansion Dollars counter, then the prize clip for that prize type.
   Free play money only: no paid dice, nothing random for sale, Mansion Dollars have no cash value.
   Loaded after the inline game script; reuses its globals S, STOPS, WINGS, hud, money, $. */
(function(){
  "use strict";
  var d=document, reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TOK="assets/tokens/", CLIPS="assets/clips/", KEY="mm-token";
  // one clip per prize type (all self-hosted, 6 s, muted, inline)
  var PRIZES={
    Fountain:{t:"Coin Fountain",clip:"prizes/coin-fountain"},
    Greenhouse:{t:"Sparkle Bonus",clip:"prizes/sparkle-bonus"},
    Arch:{t:"Estate Bonus",clip:"prizes/estate-bonus"},
    Pool:{t:"Yacht Day",clip:"prizes/yacht"},
    Trophy:{t:"Crown Jackpot",clip:"prizes/crown-jackpot"},
    Gazebo:{t:"Dream Vacation",clip:"prizes/vacation"},
    Falls:{t:"Private Jet",clip:"prizes/private-jet"},
    Court:{t:"Supercar",clip:"prizes/supercar"},
    doubles:{t:"Lucky Doubles",clip:"prizes/lucky-doubles"},
    wingMax:{t:"Wing Complete",clip:null} // no clip made yet: celebration without video
  };
  window.MM_PRIZES=PRIZES;
  var tokens=[{id:"hat",name:"The Millionaire Mansion Magical Golden Hat"}];
  function tokenId(){ try{ return localStorage.getItem(KEY)||"hat"; }catch(e){ return "hat"; } }
  function wait(ms){ return new Promise(function(r){ setTimeout(r,reduce?Math.min(ms,60):ms); }); }

  // ---------- token piece ----------
  var tokEl=$("token"); tokEl.innerHTML='<img alt="Your game piece" src="'+TOK+tokenId()+'.webp">';
  function setToken(id){ try{ localStorage.setItem(KEY,id); }catch(e){} tokEl.firstChild.src=TOK+id+".webp"; var bi=d.querySelector("#tokenBtn img"); if(bi) bi.src=TOK+"thumb/"+id+".webp"; }
  var hdr=d.querySelector("header .pills"), tb=d.createElement("button"); tb.id="tokenBtn"; tb.className="pill"; tb.type="button"; tb.setAttribute("aria-label","Choose your game piece");
  tb.innerHTML='<img alt="" src="'+TOK+"thumb/"+tokenId()+'.webp">Piece'; hdr.insertBefore(tb,hdr.firstChild);
  d.querySelector("header .pill").setAttribute("title","Mansion Dollars (pretend game money)");

  // ---------- full token selection screen ----------
  var pick=d.createElement("section"); pick.id="mmPick"; pick.setAttribute("role","dialog"); pick.setAttribute("aria-modal","true"); pick.setAttribute("aria-label","Choose your game piece");
  pick.innerHTML='<header><h2>Choose your game piece<small>Every piece is free. Pieces only change your look on the board.</small></h2><button class="x" type="button" aria-label="Close">✕</button></header><div class="grid"></div>';
  d.body.appendChild(pick);
  function renderPick(){ var cur=tokenId(); pick.querySelector(".grid").innerHTML=tokens.map(function(t){
    return '<button type="button" class="tk" data-tk="'+t.id+'" aria-pressed="'+(t.id===cur)+'"><img loading="lazy" alt="" src="'+TOK+'thumb/'+t.id+'.webp"><span>'+t.name+'</span></button>'; }).join(""); }
  function openPick(){ renderPick(); pick.classList.add("on"); }
  tb.onclick=openPick; pick.querySelector(".x").onclick=function(){ pick.classList.remove("on"); };
  pick.querySelector(".grid").addEventListener("click",function(e){ var b=e.target.closest("[data-tk]"); if(!b)return; var id=b.dataset.tk;
    setToken(id); pick.classList.remove("on"); playClip("tokens/"+id,"Your piece",b.textContent); });
  fetch(TOK+"tokens.json").then(function(r){ return r.json(); }).then(function(m){ tokens=tokens.concat(m.tokens||[]); window.MM_TOKENS=tokens; }).catch(function(){});
  try{ if(!localStorage.getItem(KEY)){ var iv=setInterval(function(){ var intro=$("intro"); if(intro&&intro.style.display==="none"){ clearInterval(iv); setTimeout(openPick,400); } },500); } }catch(e){}

  // ---------- gold coin dice ----------
  var PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
  function faceHTML(n){ var h=""; for(var i=0;i<9;i++) h+=PIPS[n].indexOf(i)>-1?"<i></i>":"<span></span>"; return h; }
  var dice=d.createElement("div"); dice.id="mmDice"; dice.setAttribute("aria-hidden","true");
  dice.innerHTML=[0,1].map(function(){ return '<div class="mmd">'+[1,2,3,4,5,6].map(function(n){ return '<div class="f f'+n+'">'+faceHTML(n)+'</div>'; }).join("")+'</div>'; }).join("");
  $("stage").appendChild(dice);
  var ORI={1:[0,0],6:[0,180],2:[0,-90],5:[0,90],3:[-90,0],4:[90,0]};
  function sparks(host,n,x,y){ if(reduce)return; for(var k=0;k<n;k++){ var s=d.createElement("i"),a=Math.random()*6.283,m=30+Math.random()*60; s.className="mmspark"+(k%3?"":" star");
    if(x!=null){ s.style.left=x; s.style.top=y; } s.style.setProperty("--dx",Math.cos(a)*m+"px"); s.style.setProperty("--dy",Math.sin(a)*m+"px"); host.appendChild(s); (function(s){ setTimeout(function(){ s.remove(); },850); })(s); } }
  function rollDice(a,b){ var ds=dice.querySelectorAll(".mmd"); dice.classList.add("on");
    [a,b].forEach(function(v,i){ var el=ds[i], o=ORI[v], sx=360*(3+i), sy=360*(2+(i?2:1));
      el.classList.remove("tumble"); el.style.transition="none"; el.style.transform="rotateX(0) rotateY(0)"; void el.offsetWidth;
      el.classList.add("tumble"); el.style.transition=reduce?"none":"transform 1.1s cubic-bezier(.2,.75,.3,1)";
      el.style.transform="rotateX("+(o[0]+sx-18)+"deg) rotateY("+(o[1]+sy+18)+"deg)"; });
    return wait(1150).then(function(){ ds.forEach(function(el){ sparks(el,12); }); }); }

  // ---------- hop tile to tile ----------
  function place(i){ var t=STOPS[i]; tokEl.style.left=t.x+"%"; tokEl.style.top=t.y+"%"; }
  async function hopSteps(n){ var passed=false;
    for(var s=0;s<n;s++){ S.pos=(S.pos+1)%STOPS.length; if(S.pos===0&&s<n-1) passed=true; place(S.pos);
      if(!reduce){ tokEl.classList.remove("hop"); void tokEl.offsetWidth; tokEl.classList.add("hop"); }
      await wait(270); }
    tokEl.classList.remove("hop"); void tokEl.offsetWidth; tokEl.classList.add("land"); setTimeout(function(){ tokEl.classList.remove("land"); },450);
    return passed; }

  // ---------- cash-out ----------
  function pop(i){ var t=STOPS[i], p=d.createElement("div"); p.className="mmpop"; p.style.left=t.x+"%"; p.style.top=t.y+"%"; $("stage").appendChild(p); sparks($("stage"),16,t.x+"%",t.y+"%"); setTimeout(function(){ p.remove(); },900); }
  function coinRain(n){ if(reduce)return; for(var k=0;k<n;k++){ var c=d.createElement("i"); c.className="mmcoin"+(k%5===4?" bill":"");
    c.style.left=(Math.random()*100)+"vw"; c.style.setProperty("--dx",(Math.random()*80-40)+"px"); c.style.setProperty("--r",(Math.random()*540-270)+"deg"); c.style.setProperty("--t",(1.3+Math.random()*.9)+"s"); c.style.animationDelay=(Math.random()*.6)+"s";
    d.body.appendChild(c); (function(c){ setTimeout(function(){ c.remove(); },3000); })(c); } }
  var big=d.createElement("div"); big.id="mmCash"; big.setAttribute("aria-live","polite"); big.innerHTML='<b>+0</b><small>Mansion Dollars</small>'; d.body.appendChild(big);
  function countUp(from,amount,label){ return new Promise(function(done){ var cash=$("mmHudCash")||$("cash"), t0=performance.now(), dur=reduce?1:1400;
    big.querySelector("small").textContent=label+" · Mansion Dollars"; big.classList.add("on"); cash.parentNode.classList.remove("bump"); void cash.offsetWidth; cash.parentNode.classList.add("bump");
    (function f(now){ var k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,3), v=amount*e; big.querySelector("b").textContent="+"+money(v); cash.textContent=money(from+v);
      if(k<1) requestAnimationFrame(f); else setTimeout(function(){ big.classList.remove("on"); done(); },650); })(t0); }); }

  // ---------- prize clip ----------
  function playClip(clip,kicker,title){ return new Promise(function(done){ if(!clip||reduce){ done(); return; }
    var r=d.createElement("div"); r.id="mmClip"; r.setAttribute("role","dialog"); r.setAttribute("aria-label",title);
    var poster=clip.indexOf("prizes/")===0?' poster="'+CLIPS+clip+'.jpg"':"";
    r.innerHTML='<p class="k"></p><h3></h3><video muted playsinline webkit-playsinline autoplay preload="auto"'+poster+'><source src="'+CLIPS+clip+'.mp4" type="video/mp4"></video><button type="button">Collect</button>';
    r.querySelector(".k").textContent=kicker; r.querySelector("h3").textContent=title; d.body.appendChild(r);
    var v=r.querySelector("video"), fin=false, t; function end(){ if(fin)return; fin=true; clearTimeout(t); try{v.pause();}catch(e){} r.remove(); done(); }
    r.querySelector("button").onclick=end; v.addEventListener("ended",end); v.muted=true; var p=v.play(); if(p&&p.catch)p.catch(function(){}); t=setTimeout(end,7000); }); }

  // ---------- roll loop (replaces the old dot glide + single white die) ----------
  var rb=$("roll"); $("stage").appendChild(rb); function rollLabel(){ rb.innerHTML='ROLL<span class="dd"><span class="mini"></span><span class="mini"></span></span>'; } rollLabel();
  var hc=d.createElement("div"); hc.className="mmhud cash"; hc.innerHTML='<i class="ic"></i><b id="mmHudCash">0</b><small>MD</small>'; $("stage").appendChild(hc);
  var hd=d.createElement("div"); hd.className="mmhud dice"; hd.innerHTML='<i class="ic"></i><b id="mmHudDice">0</b>'; $("stage").appendChild(hd);
  var tot=d.createElement("div"); tot.id="mmTotal"; tot.setAttribute("aria-live","polite"); $("stage").appendChild(tot);
  function syncHud(){ $("mmHudCash").textContent=$("cash").textContent; $("mmHudDice").textContent=$("dice").textContent; }
  new MutationObserver(syncHud).observe($("cash"),{childList:true,characterData:true,subtree:true}); new MutationObserver(syncHud).observe($("dice"),{childList:true,characterData:true,subtree:true}); syncHud();
  rb.onclick=async function(){
    if(S.dice<=0||rb.disabled) return;
    S.dice--; rb.disabled=true; hud();
    var a=1+Math.floor(Math.random()*6), b=1+Math.floor(Math.random()*6), n=a+b;
    await rollDice(a,b); tot.textContent=a+" + "+b+" = "+n; tot.classList.add("on"); await wait(450); tot.classList.remove("on");
    await hopSteps(n); dice.classList.remove("on");
    var stop=STOPS[S.pos], prize=PRIZES[stop.n]||{t:stop.n,clip:null};
    var pay=800+(S.lv[WINGS[S.pos%5]]||0)*900, from=S.cash; // payout rule unchanged
    S.cash+=pay; var dbl=a===b; if(dbl){ S.stickers++; S.dice+=2; }
    localStorage.setItem("mm3",JSON.stringify(S));
    pop(S.pos); coinRain(dbl?44:28); await countUp(from,pay,prize.t); hud();
    await playClip(prize.clip,"Prize won",prize.t+" · +"+money(pay));
    if(dbl) await playClip(PRIZES.doubles.clip,"Doubles: sticker + 2 free dice",PRIZES.doubles.t);
    rb.disabled=false; rollLabel();
  };
  // celebratory pop on landmark upgrades (wings)
  d.body.addEventListener("click",function(e){ var w=e.target.dataset&&e.target.dataset.up; if(!w)return; var before=S.lv[w]||0;
    setTimeout(function(){ if((S.lv[w]||0)>before){ coinRain(S.lv[w]>=5?40:16); sparks(e.target,14); if(S.lv[w]>=5) playClip(PRIZES.wingMax.clip,"Landmark",w+" complete"); } },0); },true);
  hud(); place(S.pos);
})();
