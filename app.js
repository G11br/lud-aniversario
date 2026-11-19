(function () {
  "use strict";

  const C = window.PARTY_CONFIG;
  const GIFTS = window.GIFT_LIST;
  const $ = (id) => document.getElementById(id);

  // ---------- small storage helpers (never throw) ----------
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

  // Each browser gets a random token so guests can undo their own choices.
  let token = store.get("lud.token", null);
  if (!token) {
    token = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    store.set("lud.token", token);
  }

  // ---------- slug ids for gifts ----------
  const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  GIFTS.forEach((cat) => cat.items.forEach((it) => { it.id = it.id || slug(it.name); }));

  // ============================================================
  //  API — Google Apps Script when configured, local demo otherwise
  // ============================================================
  const remote = {
    async gifts() {
      const r = await fetch(C.APPS_SCRIPT_URL + "?action=gifts&token=" + encodeURIComponent(token), { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "erro");
      return j.gifts; // [{id, count, mine}]
    },
    async post(body) {
      const r = await fetch(C.APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(body) // text/plain → no CORS preflight
      });
      const j = await r.json();
      if (!j.ok) { const e = new Error(j.error || "erro"); e.code = j.code; throw e; }
      return j;
    }
  };

  const local = {
    async gifts() {
      const rows = store.get("lud.demo.gifts", []);
      const map = {};
      rows.forEach((r) => {
        map[r.id] = map[r.id] || { id: r.id, count: 0, mine: false };
        map[r.id].count++; if (r.token === token) map[r.id].mine = true;
      });
      return Object.values(map);
    },
    async post(body) {
      await new Promise((r) => setTimeout(r, 350));
      if (body.action === "rsvp") { store.set("lud.demo.rsvp." + body.token, body); return { ok: true }; }
      const rows = store.get("lud.demo.gifts", []);
      if (body.action === "reserve") {
        const n = rows.filter((r) => r.id === body.id).length;
        if (n >= body.max) { const e = new Error("taken"); e.code = "taken"; throw e; }
        rows.push({ id: body.id, token: body.token, name: body.name });
        store.set("lud.demo.gifts", rows); return { ok: true };
      }
      if (body.action === "unreserve") {
        store.set("lud.demo.gifts", rows.filter((r) => !(r.id === body.id && r.token === body.token)));
        return { ok: true };
      }
      return { ok: false };
    }
  };

  // Gifts are shared between guests only when the Google Sheet is connected.
  const SHARED = !!C.APPS_SCRIPT_URL;
  const api = SHARED ? remote : local;

  // ---------- WhatsApp ----------
  const waLink = (text) => "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(text);
  function openWhatsApp(url) {
    const w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
  }
  const n = C.WHATSAPP;
  $("waNumberLabel").textContent = n.length === 13
    ? `(${n.slice(2, 4)}) ${n.slice(4, 5)} ${n.slice(5, 9)}-${n.slice(9)}`
    : "+" + n;

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  // ============================================================
  //  HERO
  // ============================================================
  const PALETTE = [
    { bg: "#f7cfdf", fg: "#b8336c", font: "Abril Fatface" },
    { bg: "#2b1c22", fg: "#f7cfdf", font: "Bungee" },
    { bg: "#f2e2b3", fg: "#2b1c22", font: "Playfair Display", italic: true },
    { bg: "#e4518f", fg: "#fff", font: "Rubik Mono One" },
    { bg: "#fbf6f2", fg: "#e4518f", font: "Shrikhand" },
    { bg: "#c9e3d6", fg: "#2b1c22", font: "Abril Fatface" },
    { bg: "#f6b98f", fg: "#7a2a12", font: "Bungee" },
    { bg: "#bcd3f2", fg: "#1d3a6b", font: "Playfair Display", italic: true }
  ];
  const ROT = [-6, 4, -2, 7, -4, 3, -7, 2, 5, -3];

  document.querySelectorAll("[data-ransom]").forEach((el, n) => {
    const text = el.dataset.ransom;
    el.textContent = "";
    let i = n * 3;
    text.split(" ").forEach((word) => {
      const w = document.createElement("span");
      w.className = "word"; w.setAttribute("aria-hidden", "true");
      [...word].forEach((ch) => {
        const p = PALETTE[(i * 5 + 1) % PALETTE.length];
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = (i % 3 === 1) ? ch.toLowerCase() : ch.toUpperCase();
        s.style.background = p.bg;
        s.style.color = p.fg;
        s.style.fontFamily = `"${p.font}", Georgia, serif`;
        if (p.italic) s.style.fontStyle = "italic";
        s.style.setProperty("--r", ROT[i % ROT.length] + "deg");
        s.style.animationDelay = (i * 45) + "ms";
        w.appendChild(s); i++;
      });
      el.appendChild(w);
    });
  });

  $("dateLabel").textContent = C.dateLabel;
  $("timeLabel").textContent = C.timeLabel;
  $("addressLabel").textContent = C.address;
  $("hoodLabel").textContent = C.neighborhood;

  const fullAddress = `${C.address}, ${C.neighborhood.replace("–", ",")}, RN`;
  $("mapsLink").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(fullAddress);

  const start = new Date(C.dateISO);
  const end = new Date(start.getTime() + 6 * 3600e3);
  const gcal = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  $("calLink").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(`Aniversário de ${C.age} anos da ${C.name}`) +
    "&dates=" + gcal(start) + "/" + gcal(end) +
    "&location=" + encodeURIComponent(fullAddress) +
    "&details=" + encodeURIComponent(location.href.split("#")[0]);

  function tick() {
    const ms = start - Date.now();
    const el = $("countdown");
    if (ms <= 0) {
      el.textContent = ms > -6 * 3600e3 ? "É hoje!!!" : "Obrigada por comemorar comigo ♡";
      return;
    }
    const d = Math.floor(ms / 864e5);
    const h = Math.floor((ms % 864e5) / 36e5);
    el.textContent = d > 0 ? `Faltam ${d} ${d === 1 ? "dia" : "dias"} e ${h}h` : `Faltam ${h}h ${Math.floor((ms % 36e5) / 6e4)}min`;
  }
  tick(); setInterval(tick, 60e3);

  // ============================================================
  //  TABS (hash routing)
  // ============================================================
  const TABS = ["presenca", "presentes", "playlist"];
  let giftsLoaded = false;

  function showTab(name, scroll) {
    if (!TABS.includes(name)) name = "presenca";
    TABS.forEach((t) => {
      $("panel-" + t).hidden = t !== name;
      $("tab-" + t).setAttribute("aria-selected", String(t === name));
    });
    if (name === "presentes" && !giftsLoaded) loadGifts();
    if (scroll) {
      const nav = document.querySelector(".tabs");
      const y = nav.getBoundingClientRect().top + window.scrollY - 1;
      if (window.scrollY > y || scroll === "force") window.scrollTo({ top: y });
    }
  }
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1), "force"));
  showTab(location.hash.slice(1), false);

  // ============================================================
  //  RSVP
  // ============================================================
  const form = $("rsvpForm");
  const guestsField = $("guestsField");

  form.addEventListener("change", (e) => {
    if (e.target.name === "attending") guestsField.hidden = e.target.value !== "sim";
  });

  function rsvpText(d) {
    const first = `Oi, ${C.name}! 🎀`;
    if (d.attending !== "sim") {
      return [first, `Infelizmente não vou poder ir no seu aniversário (${C.dateLabel}) 😢`, `Nome: ${d.name}`,
        d.message ? `Recado: ${d.message}` : ""].filter(Boolean).join("\n");
    }
    const g = Number(d.guests) || 0;
    return [first, `Confirmo presença no seu aniversário de ${C.age} anos! 🥳`, `📅 ${C.dateLabel}, ${C.timeLabel}`, "",
      `Nome: ${d.name}`,
      `Pessoas: ${g === 0 ? "só eu" : `eu + ${g} (${g + 1} no total)`}`,
      d.message ? `Recado: ${d.message}` : ""].filter((x) => x !== "").join("\n");
  }

  function showDone(data) {
    const yes = data.attending === "sim";
    $("rsvpDoneStamp").textContent = yes ? "Confirmado!" : "Resposta enviada";
    $("rsvpDoneTitle").textContent = yes ? `Te espero lá, ${data.name.split(" ")[0]}!` : `Que pena, ${data.name.split(" ")[0]}!`;
    const g = Number(data.guests) || 0;
    $("rsvpDoneText").textContent = yes
      ? `${g === 0 ? "Você" : `Você + ${g}`} no dia ${C.dateLabel}, às ${C.timeLabel}. Só confere se a mensagem foi enviada no WhatsApp!`
      : "Obrigada por avisar. Só confere se a mensagem foi enviada no WhatsApp ♡";
    $("rsvpResend").href = waLink(rsvpText(data));
    form.hidden = true;
    $("rsvpDone").hidden = false;
  }

  const savedRsvp = store.get("lud.rsvp", null);
  if (savedRsvp) {
    $("rsvpName").value = savedRsvp.name || "";
    (savedRsvp.attending === "nao" ? $("attNo") : $("attYes")).checked = true;
    guestsField.hidden = savedRsvp.attending !== "sim";
    $("rsvpGuests").value = savedRsvp.guests || "0";
    $("rsvpMsg").value = savedRsvp.message || "";
    showDone(savedRsvp);
  }

  $("rsvpEdit").addEventListener("click", () => {
    $("rsvpDone").hidden = true; form.hidden = false; $("rsvpName").focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("rsvpName").value.trim();
    $("rsvpNameError").hidden = !!name;
    if (!name) { $("rsvpName").focus(); return; }

    const attending = form.querySelector("input[name=attending]:checked").value;
    const data = {
      name,
      attending,
      guests: attending === "sim" ? $("rsvpGuests").value : "0",
      message: $("rsvpMsg").value.trim()
    };
    openWhatsApp(waLink(rsvpText(data)));
    store.set("lud.rsvp", data);
    showDone(data);
  });

  // ============================================================
  //  GIFTS
  // ============================================================
  let giftState = {};       // id -> {count, mine}
  let activeCat = "all";
  let openReserve = null;   // gift id with the inline form open
  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>';

  // chips
  const chips = $("giftChips");
  [{ id: "all", title: "Tudo" }, ...GIFTS].forEach((c) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.cat = c.id;
    b.textContent = c.id === "all" ? "Tudo" : c.title.split(" & ")[0];
    b.setAttribute("aria-pressed", String(c.id === activeCat));
    b.addEventListener("click", () => {
      activeCat = c.id;
      chips.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.cat === activeCat)));
      renderGifts();
    });
    chips.appendChild(b);
  });
  $("onlyAvailable").addEventListener("change", renderGifts);
  $("onlyAvailable").closest(".toggle").hidden = !SHARED;
  $("giftHowTo").textContent = SHARED
    ? "Escolha um item para ele aparecer como reservado e ninguém repetir."
    : "Escolheu um item? Toca em “Vou dar este” e me avisa pelo WhatsApp.";

  async function loadGifts() {
    giftsLoaded = true;
    $("giftStatus").textContent = "Carregando a lista…";
    try {
      const rows = await api.gifts();
      giftState = {};
      rows.forEach((r) => { giftState[r.id] = { count: r.count, mine: !!r.mine }; });
      renderGifts();
    } catch {
      giftsLoaded = false;
      renderGifts();
      $("giftStatus").textContent = "Não consegui ver quais itens já foram escolhidos. Recarregue a página para tentar de novo.";
    }
  }

  function renderGifts() {
    const only = $("onlyAvailable").checked;
    const list = $("giftList");
    list.textContent = "";
    let total = 0, taken = 0, mine = 0;

    GIFTS.forEach((cat) => {
      cat.items.forEach((it) => {
        const s = giftState[it.id] || { count: 0, mine: false };
        total++;
        if (!it.multi && s.count > 0) taken++;
        if (s.mine) mine++;
      });
      if (activeCat !== "all" && cat.id !== activeCat) return;

      const items = cat.items.filter((it) => {
        const s = giftState[it.id] || { count: 0, mine: false };
        return !only || s.mine || it.multi || s.count === 0;
      });
      if (!items.length) return;

      const sec = document.createElement("section");
      sec.className = "gift-cat";
      const h = document.createElement("h3");
      h.className = "cat-title"; h.textContent = cat.title;
      const ul = document.createElement("ul");
      ul.className = "gifts";
      items.forEach((it) => ul.appendChild(giftItem(it)));
      sec.append(h, ul);
      list.appendChild(sec);
    });

    $("giftStatus").textContent =
      (SHARED ? `${total - taken} de ${total} itens disponíveis` : `${total} itens na lista`) +
      (mine ? ` · você escolheu ${mine}` : "");
    if (!list.children.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.textContent = "Todos os itens desta categoria já foram escolhidos. Olha as outras categorias!";
      list.appendChild(p);
    }
  }

  function giftItem(it) {
    const s = giftState[it.id] || { count: 0, mine: false };
    const isTaken = !it.multi && s.count > 0 && !s.mine;

    const li = document.createElement("li");
    li.className = "gift" + (s.mine ? " is-mine" : "") + (isTaken ? " is-taken" : "");

    const box = document.createElement("span");
    box.className = "box"; box.innerHTML = CHECK;

    const body = document.createElement("div");
    body.className = "gift-body";

    const name = document.createElement("span");
    name.className = "gift-name"; name.textContent = it.name;
    body.appendChild(name);

    const meta = document.createElement("div");
    meta.className = "gift-meta";
    if (s.mine) {
      meta.innerHTML = '<span class="pill pill-mine">Você escolheu</span>';
    } else if (isTaken) {
      meta.innerHTML = '<span class="pill">Já escolhido</span>';
    } else if (it.multi && SHARED) {
      meta.textContent = s.count > 0
        ? `${s.count} ${s.count === 1 ? "pessoa já escolheu" : "pessoas já escolheram"} · pode repetir`
        : "Pode ser mais de um";
    }
    if (meta.textContent || meta.innerHTML) body.appendChild(meta);

    if (!isTaken) {
      if (openReserve === it.id && !s.mine) body.appendChild(reserveForm(it));
      else {
        const actions = document.createElement("div");
        actions.className = "gift-actions";
        const b = document.createElement("button");
        b.type = "button";
        if (s.mine) {
          b.className = "btn btn-ghost btn-sm"; b.textContent = "Desfazer";
          b.addEventListener("click", () => unreserve(it, b));
        } else {
          b.className = "btn btn-primary btn-sm"; b.textContent = "Vou dar este";
          b.addEventListener("click", () => { openReserve = it.id; renderGifts(); focusReserve(); });
        }
        actions.appendChild(b);
        body.appendChild(actions);
      }
    }

    li.append(box, body);
    return li;
  }

  function focusReserve() {
    const el = document.getElementById("reserveName");
    if (el) el.focus();
  }

  function reserveForm(it) {
    const f = document.createElement("form");
    f.className = "reserve-form";
    const label = document.createElement("label");
    label.htmlFor = "reserveName"; label.className = "gift-meta"; label.textContent = SHARED ? "Seu nome (só a Lud vê)" : "Seu nome";
    const input = document.createElement("input");
    input.type = "text"; input.id = "reserveName"; input.maxLength = 80; input.required = true;
    input.autocomplete = "name";
    input.value = (store.get("lud.rsvp", null) || {}).name || store.get("lud.giftName", "");
    const actions = document.createElement("div");
    actions.className = "gift-actions";
    const ok = document.createElement("button");
    ok.type = "submit"; ok.className = "btn btn-primary btn-sm"; ok.textContent = SHARED ? "Confirmar" : "Avisar pelo WhatsApp";
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.className = "btn btn-ghost btn-sm"; cancel.textContent = "Cancelar";
    cancel.addEventListener("click", () => { openReserve = null; renderGifts(); });
    actions.append(ok, cancel);
    f.append(label, input, actions);

    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) { input.focus(); return; }
      store.set("lud.giftName", name);
      if (!SHARED) openWhatsApp(waLink(`Oi, ${C.name}! 🎁 Vou te dar de presente: ${it.name} ♡\n— ${name}`));
      ok.disabled = true; ok.textContent = "Salvando…";
      try {
        await api.post({ action: "reserve", token, id: it.id, gift: it.name, name, max: (it.multi || !SHARED) ? 999 : 1 });
        const s = giftState[it.id] || { count: 0, mine: false };
        giftState[it.id] = { count: s.count + 1, mine: true };
        openReserve = null;
        renderGifts();
        toast(`Anotado: ${it.name} ♡`);
      } catch (err) {
        openReserve = null;
        if (err.code === "taken") toast("Ops, alguém escolheu esse item agorinha. Escolhe outro?");
        else toast("Não consegui salvar. Tenta de novo.");
        loadGifts();
      }
    });
    return f;
  }

  async function unreserve(it, btn) {
    btn.disabled = true; btn.textContent = "Desfazendo…";
    try {
      await api.post({ action: "unreserve", token, id: it.id });
      const s = giftState[it.id] || { count: 1 };
      giftState[it.id] = { count: Math.max(0, s.count - 1), mine: false };
      renderGifts();
      toast("Item liberado");
    } catch {
      btn.disabled = false; btn.textContent = "Desfazer";
      toast("Não consegui desfazer. Tenta de novo.");
    }
  }

  // ============================================================
  //  PLAYLIST
  // ============================================================
  if (C.SPOTIFY_URL) {
    $("spotifyBtn").href = C.SPOTIFY_URL;
    const m = C.SPOTIFY_URL.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?playlist\/([A-Za-z0-9]+)/);
    if (m) {
      const iframe = document.createElement("iframe");
      iframe.src = `https://open.spotify.com/embed/playlist/${m[1]}?utm_source=generator&theme=0`;
      iframe.loading = "lazy";
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.title = "Playlist da festa no Spotify";
      $("spotifyEmbed").appendChild(iframe);
      $("spotifyEmbed").hidden = false;
    }
  } else {
    $("spotifyBtn").hidden = true;
    $("spotifySoon").hidden = false;
  }
})();
