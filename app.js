(function () {
  "use strict";

  const C = window.PARTY_CONFIG;
  const $ = (id) => document.getElementById(id);

  // ---------- small storage helpers (never throw) ----------
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
  };

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
  const TABS = ["presenca", "playlist"];

  function showTab(name, scroll) {
    if (!TABS.includes(name)) name = "presenca";
    TABS.forEach((t) => {
      $("panel-" + t).hidden = t !== name;
      $("tab-" + t).setAttribute("aria-selected", String(t === name));
    });
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
