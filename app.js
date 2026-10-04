(() => {
      "use strict";
      const STORAGE_KEY = "youvibe-state-v1";
      const DB_NAME = "youvibe-media-v1";
      const DB_STORE = "media";
      const SIM_SPEED = 60;
      const AD_THRESHOLD = 1000;
      const AD_RATES = [3, 5, 8.5, 12, 20];
      const AD_FREQUENCIES = [1, 2, 5];
      const AD_FORMATS = ["preroll", "midroll", "display", "mixed"];
      const AD_FORMAT_FACTORS = { preroll: 1, midroll: 1.25, display: 0.65, mixed: 1.45 };
      const MAX_BYTES = 100 * 1024 * 1024;
      const formatter = new Intl.NumberFormat("pl-PL");
      const gridIds = ["content-grid", "channel-grid", "uploads-grid"];
      let state = loadState();
      let selectedFile = null;
      let dbPromise;
      let activeLive = null;
      let cameraStream = null;
      let chatTimer = null;
      let lastAutosave = Date.now();
      const previewUrls = new Map();
      const $ = (id) => document.getElementById(id);

      function loadState() {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
          return {
            uploads: Array.isArray(saved.uploads) ? saved.uploads : [],
            liveStats: {
              views: Math.max(0, Number(saved.liveStats?.views) || 0),
              likes: Math.max(0, Number(saved.liveStats?.likes) || 0),
              subs: Math.max(0, Number(saved.liveStats?.subs) || 0)
            },
            ads: {
              unlockedAt: Number(saved.ads?.unlockedAt) || null,
              viewsAtUnlock: Math.max(0, Number(saved.ads?.viewsAtUnlock) || 0),
              enabled: saved.ads?.enabled !== false,
              format: AD_FORMATS.includes(saved.ads?.format) ? saved.ads.format : "preroll",
              frequency: AD_FREQUENCIES.includes(Number(saved.ads?.frequency)) ? Number(saved.ads.frequency) : 2,
              rate: AD_RATES.includes(Number(saved.ads?.rate)) ? Number(saved.ads.rate) : 8.5,
              monetizedViews: Math.max(0, Number(saved.ads?.monetizedViews) || 0),
              balance: Math.max(0, Number(saved.ads?.balance) || 0),
              lastProcessedViews: typeof saved.ads?.lastProcessedViews === "number" && Number.isFinite(saved.ads.lastProcessedViews)
                ? saved.ads.lastProcessedViews
                : null
            }
          };
        } catch (error) {
          console.error("Nie udało się odczytać danych YouVibe:", error);
          return {
            uploads: [],
            liveStats: { views: 0, likes: 0, subs: 0 },
            ads: { unlockedAt: null, viewsAtUnlock: 0, enabled: true, format: "preroll", frequency: 2, rate: 8.5, monetizedViews: 0, balance: 0, lastProcessedViews: null }
          };
        }
      }
      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          lastAutosave = Date.now();
        }
        catch (error) { showToast("Nie udało się zapisać statystyk w przeglądarce."); console.error(error); }
      }
      function openDb() {
        if (!("indexedDB" in window)) return Promise.reject(new Error("Ta przeglądarka nie obsługuje lokalnego zapisu plików."));
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, 1);
          request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE, { keyPath: "id" });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error || new Error("Nie udało się otworzyć lokalnej biblioteki plików."));
        });
        return dbPromise;
      }
      async function storeFile(record) {
        const db = await openDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(DB_STORE, "readwrite");
          tx.objectStore(DB_STORE).put(record);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error || new Error("Nie udało się zapisać pliku."));
          tx.onabort = () => reject(tx.error || new Error("Zapisywanie pliku zostało przerwane."));
        });
      }
      async function getFile(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
          const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error || new Error("Nie udało się odczytać pliku."));
        });
      }
      function showToast(message) {
        const toast = $("toast");
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove("show"), 2700);
      }
      function metrics(upload, index) {
        const age = Math.max(0, (Date.now() - upload.createdAt) / 1000) * SIM_SPEED;
        const reach = upload.reach;
        const views = age >= reach.decaySeconds * 7
          ? reach.maxViews
          : Math.min(reach.maxViews, Math.floor(reach.maxViews * (1 - Math.exp(-age / reach.decaySeconds))));
        return { views, likes: Math.floor(views * 0.064), subs: Math.floor(views * 0.012) };
      }
      function createReach(upload, subscribers) {
        const roll = Math.random();
        let tier;
        let reachFraction;
        if (roll < 0.5225) {
          tier = "spokojny";
          reachFraction = 0.5 + Math.random() * 0.15;
        } else if (roll < 0.8075) {
          tier = "standardowy";
          reachFraction = 0.65 + Math.random() * 0.15;
        } else if (roll < 0.95) {
          tier = "mocny";
          reachFraction = 0.8 + Math.random() * 0.15;
        } else {
          tier = "viralowy";
          reachFraction = 100;
        }
        const safeSubscribers = Math.max(0, subscribers);
        const channelViewCap = safeSubscribers < 100
          ? 2500 + Math.floor(safeSubscribers / 10) * 300
          : safeSubscribers ** 2;
        const maxViews = Math.floor(channelViewCap * reachFraction);
        const decayRanges = {
          spokojny: [600, 1800],
          standardowy: [1800, 3600],
          mocny: [3600, 7200],
          viralowy: [7200, 14400]
        };
        const [minimumDecay, maximumDecay] = decayRanges[tier];
        upload.reach = {
          modelVersion: 4,
          subscribersAtPublish: subscribers,
          channelViewCap,
          maxViews,
          decaySeconds: Math.floor(minimumDecay + Math.random() * (maximumDecay - minimumDecay)),
          tier
        };
      }
      function migrateUploadReach() {
        let changed = false;
        const knownSubscribers = state.liveStats.subs + state.uploads.reduce((sum, upload, index) => {
          if (!upload.reach || !Number.isFinite(upload.reach.maxViews) || !Number.isFinite(upload.reach.decaySeconds)) return sum;
          return sum + metrics(upload, index).subs;
        }, 0);
        state.uploads.forEach((upload) => {
          if (upload.reach?.modelVersion === 4
            && Number.isFinite(upload.reach.maxViews)
            && Number.isFinite(upload.reach.decaySeconds)) return;
          const subscribersAtPublish = Number.isFinite(upload.reach?.subscribersAtPublish)
            ? upload.reach.subscribersAtPublish
            : knownSubscribers;
          createReach(upload, subscribersAtPublish);
          changed = true;
        });
        if (changed) saveState();
      }
      function totals() {
        const total = state.uploads.reduce((sum, upload, index) => {
          const value = metrics(upload, index);
          sum.views += value.views;
          sum.likes += value.likes;
          sum.subs += value.subs;
          return sum;
        }, { views: 0, likes: 0, subs: 0 });
        total.views += state.liveStats.views;
        total.likes += state.liveStats.likes;
        total.subs += state.liveStats.subs;
        return total;
      }
      function accrueAds(totalViews) {
        if (!state.ads.unlockedAt) return false;
        if (state.ads.lastProcessedViews === null) {
          state.ads.lastProcessedViews = totalViews;
          return true;
        }
        const currentViews = Math.max(totalViews, state.ads.lastProcessedViews);
        const newViews = currentViews - state.ads.lastProcessedViews;
        state.ads.lastProcessedViews = currentViews;
        if (state.ads.enabled && newViews > 0) {
          state.ads.monetizedViews += newViews;
          state.ads.balance += newViews / state.ads.frequency / 1000 * state.ads.rate * AD_FORMAT_FACTORS[state.ads.format];
        }
        return newViews > 0;
      }
      function formatMoney(value) {
        return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
      }
      function liveViewers() {
        if (!activeLive) return 0;
        const subscribers = totals().subs;
        const growth = 1 - Math.exp(-activeLive.elapsedSeconds / 30);
        return Math.min(100000, Math.max(1, Math.floor((4 + Math.sqrt(subscribers) * 2.2) * activeLive.reachFactor * growth)));
      }
      function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;
        return [hours, minutes, remainder].map((part) => String(part).padStart(2, "0")).join(":");
      }
      function addChatMessage(name, message) {
        const container = $("chat-messages");
        const placeholder = container.querySelector(".chat-placeholder");
        if (placeholder) placeholder.remove();
        const line = document.createElement("div");
        line.className = "chat-message";
        const username = document.createElement("strong");
        username.textContent = name;
        line.append(username, document.createTextNode(message));
        container.append(line);
        while (container.children.length > 50) container.firstElementChild.remove();
        container.scrollTop = container.scrollHeight;
      }
      function scheduleChatMessage() {
        if (!activeLive) return;
        const messages = [
          ["Maja", "Hej! Wpadłam na live 👋"],
          ["Kacper", "Pozdrowienia dla wszystkich!"],
          ["Ola", "Mega klimat! ✨"],
          ["Filip", "Kiedy kolejny film?"],
          ["Zuzia", "Ale super transmisja!"],
          ["Bartek", "Pozdro z Krakowa!"],
          ["Kuba", "Właśnie dołączyłem, co mnie ominęło?"],
          ["Nina", "Zostawiam łapkę w górę 👍"],
          ["Mati", "O której następny live?"],
          ["Lena", "Fajnie, że robisz transmisję!"],
          ["Adrian", "Ile czasu zajmuje montaż filmu?"],
          ["Wiki", "Oglądam od początku 😄"],
          ["Oskar", "Ten kanał rośnie w oczach!"],
          ["Iga", "Jaki temat następnego odcinka?"],
          ["Dawid", "Pozdrawiam ekipę! 🔥"],
          ["Szymon", "Dobra energia na tym live"],
          ["Ania", "Pokażesz kulisy nagrywania?"],
          ["Tomek", "Pierwszy raz tutaj, zostaję!"],
          ["Pola", "Super pomysł z tym materiałem"],
          ["Michał", "Dzięki za odpowiedź!"],
          ["Emilia", "Kto ogląda z Warszawy?"],
          ["Rafał", "Ale szybko leci ten live"],
          ["Nadia", "Subik leci!"],
          ["Patryk", "Może zrobisz Q&A?"],
          ["Kinga", "Czekam na nowy film ❤️"],
          ["Wojtek", "Jaki sprzęt polecasz na start?"],
          ["Sara", "Miłego oglądania wszystkim!"],
          ["Igor", "Gratulacje za progres kanału!"],
          ["Ewa", "Możesz opowiedzieć więcej?"],
          ["Łukasz", "Dźwięk jest super"],
          ["Zosia", "Ale fajna społeczność!"],
          ["Maks", "Już prawie 1k subów?"],
          ["Alicja", "Kto czeka na kolejny odcinek?"],
          ["Janek", "Dobra robota, twórco!"]
        ];
        const viewers = liveViewers();
        const commentChance = Math.min(0.92, 0.2 + Math.log10(viewers + 1) * 0.22);
        if (Math.random() < commentChance) {
          const [name, message] = messages[Math.floor(Math.random() * messages.length)];
          addChatMessage(name, message);
        }
        const delay = Math.max(650, 12000 / (1 + Math.sqrt(viewers) * 0.45));
        chatTimer = setTimeout(scheduleChatMessage, delay);
      }
      function stopCamera() {
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          cameraStream = null;
        }
        const preview = $("camera-preview");
        preview.srcObject = null;
        preview.hidden = true;
        $("stage-placeholder").hidden = false;
        $("camera-button").textContent = "Włącz kamerę";
      }
      function stopLive() {
        if (!activeLive) return;
        activeLive = null;
        clearInterval(chatTimer);
        chatTimer = null;
        stopCamera();
        state.liveStats.likes = Math.floor(state.liveStats.views * 0.064);
        state.liveStats.subs = Math.floor(state.liveStats.views * 0.012);
        saveState();
        render();
        showToast("Transmisja zakończona. Jej statystyki zapisano na kanale.");
      }
      function updateLive() {
        if (!activeLive) return;
        activeLive.elapsedSeconds += 1;
        state.liveStats.views += Math.round(liveViewers() * SIM_SPEED / 120);
        state.liveStats.likes = Math.floor(state.liveStats.views * 0.064);
        state.liveStats.subs = Math.floor(state.liveStats.views * 0.012);
      }
      function shortNumber(value) {
        if (value >= 1000000) return (value / 1000000).toLocaleString("pl-PL", { maximumFractionDigits: 1 }) + " mln";
        if (value >= 10000) return (value / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 }) + " tys.";
        return formatter.format(value);
      }
      function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
      }
      function timeAgo(time) {
        const minutes = Math.max(1, Math.floor((Date.now() - time) / 60000));
        if (minutes < 60) return minutes + (minutes === 1 ? " min temu" : " min temu");
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + (hours === 1 ? " godz. temu" : " godz. temu");
        return Math.floor(hours / 24) + " dni temu";
      }
      function cardHTML(upload, index, idPrefix) {
        const m = metrics(upload, index);
        const type = upload.type.startsWith("video/") ? "FILM" : "ZDJĘCIE";
        const placeholder = upload.type.startsWith("video/") ? "▷" : "▧";
        return `<article class="card" data-title="${escapeHTML(upload.title.toLowerCase())}">
          <div class="thumb" id="${idPrefix}-${upload.id}"><span class="thumb-placeholder">${placeholder}</span><span class="kind">${type}</span></div>
          <div class="card-body"><h3 class="card-title" title="${escapeHTML(upload.title)}">${escapeHTML(upload.title)}</h3>
          <div class="card-meta">${timeAgo(upload.createdAt)} · <span class="reach-meta"></span></div>
          <div class="metrics"><span class="metric">◉ <b>${shortNumber(m.views)}</b></span><span class="metric">♡ <b>${shortNumber(m.likes)}</b></span><span class="metric">♙ <b>${shortNumber(m.subs)}</b></span></div></div></article>`;
      }
      function addPreview(upload, elementId) {
        if (previewUrls.has(upload.id)) {
          installPreview(upload, elementId, previewUrls.get(upload.id));
          return;
        }
        getFile(upload.id).then((record) => {
          if (!record) return;
          const url = URL.createObjectURL(record.blob);
          previewUrls.set(upload.id, url);
          installPreview(upload, elementId, url);
        }).catch((error) => { console.error("Nie udało się wyświetlić pliku:", error); });
      }
      function installPreview(upload, elementId, url) {
          const target = $(elementId);
          if (!target) return;
          const media = document.createElement(upload.type.startsWith("video/") ? "video" : "img");
          media.src = url;
          if (media.tagName === "VIDEO") { media.muted = true; media.preload = "metadata"; }
          media.alt = upload.type.startsWith("video/") ? "" : upload.title;
          target.replaceChildren(media);
          const badge = document.createElement("span");
          badge.className = "kind";
          badge.textContent = upload.type.startsWith("video/") ? "FILM" : "ZDJĘCIE";
          target.append(badge);
      }
      function render() {
        const total = totals();
        if (!state.ads.unlockedAt && total.subs >= AD_THRESHOLD) {
          state.ads.unlockedAt = Date.now();
          state.ads.viewsAtUnlock = total.views;
          state.ads.lastProcessedViews = total.views;
          saveState();
          showToast("Gratulacje! Odblokowano zarabianie z reklam 🎉");
        }
        accrueAds(total.views);
        $("total-views").textContent = shortNumber(total.views);
        $("total-subs").textContent = shortNumber(total.subs);
        $("total-likes").textContent = shortNumber(total.likes);
        $("total-posts").textContent = formatter.format(state.uploads.length);
        ["stats-views"].forEach((id) => { $(id).textContent = shortNumber(total.views); });
        $("stats-subs").textContent = shortNumber(total.subs);
        $("stats-likes").textContent = shortNumber(total.likes);
        $("stats-posts").textContent = formatter.format(state.uploads.length);
        $("channel-subs").textContent = shortNumber(total.subs);
        $("channel-posts").textContent = formatter.format(state.uploads.length);
        $("live-total-views").textContent = shortNumber(state.liveStats.views);
        $("live-total-likes").textContent = shortNumber(state.liveStats.likes);
        $("live-total-subs").textContent = shortNumber(state.liveStats.subs);
        $("live-status-value").textContent = activeLive ? "● Live" : "Offline";
        $("live-viewers").textContent = formatter.format(liveViewers());
        $("live-timer").textContent = activeLive ? formatDuration(activeLive.elapsedSeconds) : "00:00";
        $("live-badge").hidden = !activeLive;
        $("stage-placeholder").hidden = Boolean(cameraStream);
        $("stage-placeholder").querySelector("strong").textContent = activeLive ? activeLive.title : "Twoje studio jest gotowe";
        $("stage-placeholder").querySelector("span:last-child").textContent = activeLive ? "Widzowie dołączają do transmisji" : "Włącz kamerę lub rozpocznij transmisję";
        $("start-live").hidden = Boolean(activeLive);
        $("stop-live").hidden = !activeLive;
        $("live-title").disabled = Boolean(activeLive);
        $("camera-button").textContent = cameraStream ? "Wyłącz kamerę" : "Włącz kamerę";
        $("chat-status").textContent = activeLive ? "NA ŻYWO" : "OCZEKIWANIE";
        $("chat-status").classList.toggle("live", Boolean(activeLive));

        $("ad-balance").textContent = formatMoney(state.ads.balance);
        $("eligible-views").textContent = shortNumber(state.ads.monetizedViews);
        $("ad-rate-display").textContent = formatMoney(state.ads.rate);
        $("monetization-progress-label").textContent = `${formatter.format(Math.min(total.subs, AD_THRESHOLD))} / ${formatter.format(AD_THRESHOLD)}`;
        $("monetization-progress-bar").style.width = `${Math.min(100, total.subs / AD_THRESHOLD * 100)}%`;
        $("monetization-card").classList.toggle("unlocked", Boolean(state.ads.unlockedAt));
        $("monetization-status").textContent = state.ads.unlockedAt ? "PROGRAM PARTNERSKI ODBLOKOWANY" : "WYMAGANE 1 000 SUBSKRYBENTÓW";
        $("monetization-title").textContent = state.ads.unlockedAt ? "Zarabianie z reklam jest aktywne!" : "Jeszcze chwila do zarabiania";
        $("monetization-copy").textContent = state.ads.unlockedAt
          ? "Przychody naliczają się od wyświetleń zdobytych po odblokowaniu."
          : "Zdobądź 1 000 subskrybentów, by odblokować przychody z reklam.";
        const formatNames = { preroll: "przed filmem", midroll: "w trakcie filmu", display: "banerowe", mixed: "mieszane" };
        $("ad-settings-note").textContent = !state.ads.enabled
          ? "Reklamy są wyłączone — nowe wyświetlenia nie zwiększają salda."
          : state.ads.unlockedAt
            ? `Aktywne: reklamy ${formatNames[state.ads.format]}, co ${state.ads.frequency} wyświetl. Format wpływa na stawkę.`
            : "Ustawienia są zapisane. Reklamy zaczną przynosić przychód po osiągnięciu 1 000 subskrybentów.";

        const levels = [
          { name:"Początkujący twórca", target:1000 },
          { name:"Wschodząca gwiazda", target:10000 },
          { name:"Internetowa sensacja", target:100000 },
          { name:"Legendarna sława", target:1000000 }
        ];
        let level = levels.find((item) => total.subs < item.target) || levels[levels.length - 1];
        const previousTarget = level.target === 1000 ? 0 : level.target / 10;
        const progress = Math.max(0, Math.min(100, (total.subs - previousTarget) / (level.target - previousTarget) * 100));
        $("rank-name").textContent = total.subs >= 1000000 ? "Legendarna sława" : level.name;
        $("rank-progress").textContent = total.subs >= 1000000 ? "Maksymalny poziom!" : `${shortNumber(total.subs)} / ${shortNumber(level.target)} subów`;
        $("rank-bar").style.width = `${total.subs >= 1000000 ? 100 : progress}%`;

        gridIds.forEach((id) => {
          const grid = $(id);
          const empty = id === "content-grid" ? $("empty-state") : null;
          const signature = state.uploads.map((upload) => upload.id).join(",");
          if (grid.dataset.signature !== signature) {
            grid.querySelectorAll(".card").forEach((card) => card.remove());
            if (empty) empty.style.display = state.uploads.length ? "none" : "block";
            state.uploads.forEach((upload, index) => {
              grid.insertAdjacentHTML("beforeend", cardHTML(upload, index, id + "-media"));
              addPreview(upload, `${id}-media-${upload.id}`);
            });
            grid.dataset.signature = signature;
          }
          state.uploads.forEach((upload, index) => {
            const value = metrics(upload, index);
            const card = grid.querySelector(`#${CSS.escape(id + "-media-" + upload.id)}`)?.closest(".card");
            if (!card) return;
            const counts = card.querySelectorAll(".metrics b");
            counts[0].textContent = shortNumber(value.views);
            counts[1].textContent = shortNumber(value.likes);
            counts[2].textContent = shortNumber(value.subs);
            const capped = value.views >= upload.reach.maxViews;
            const reachLabel = { spokojny: "spokojny zasięg", standardowy: "standardowy zasięg", mocny: "mocne wybicie", viralowy: "viral" }[upload.reach.tier];
            card.querySelector(".reach-meta").textContent = capped
              ? `algorytm wygasił · limit ${shortNumber(upload.reach.maxViews)}`
              : `${reachLabel} · limit ${shortNumber(upload.reach.maxViews)}`;
          });
        });
        applySearch();
      }
      function applySearch() {
        const query = $("search").value.trim().toLowerCase();
        document.querySelectorAll(".card").forEach((card) => { card.hidden = !card.dataset.title.includes(query); });
      }
      function openModal() {
        $("modal").classList.add("open");
        $("title-input").focus();
      }
      function closeModal() {
        $("modal").classList.remove("open");
        $("upload-form").reset();
        selectedFile = null;
        $("file-label").textContent = "Kliknij lub przeciągnij plik tutaj";
        $("publish-button").disabled = true;
      }
      function selectFile(file) {
        if (!file) return;
        if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
          showToast("Wybierz plik ze zdjęciem albo filmem.");
          return;
        }
        if (file.size > MAX_BYTES) {
          showToast("Plik jest za duży. Maksymalny rozmiar to 100 MB.");
          return;
        }
        selectedFile = file;
        $("file-label").textContent = file.name;
        $("publish-button").disabled = false;
        if (!$("title-input").value) $("title-input").value = file.name.replace(/\.[^.]+$/, "").slice(0, 90);
      }

      document.querySelectorAll(".upload-open").forEach((button) => button.addEventListener("click", openModal));
      $("close-modal").addEventListener("click", closeModal);
      $("modal").addEventListener("click", (event) => { if (event.target === $("modal")) closeModal(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
      $("camera-button").addEventListener("click", async () => {
        if (cameraStream) {
          stopCamera();
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          showToast("Podgląd kamery wymaga zgody na kamerę i strony HTTPS albo localhost.");
          return;
        }
        $("camera-button").disabled = true;
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          $("camera-preview").srcObject = cameraStream;
          $("camera-preview").hidden = false;
          $("stage-placeholder").hidden = true;
          render();
        } catch (error) {
          console.error("Nie udało się włączyć kamery:", error);
          showToast(error.name === "NotAllowedError"
            ? "Nie udzielono zgody na kamerę."
            : "Nie udało się uruchomić kamery. Sprawdź, czy jest dostępna.");
        } finally {
          $("camera-button").disabled = false;
        }
      });
      $("start-live").addEventListener("click", () => {
        const title = $("live-title").value.trim() || "Transmisja na żywo";
        $("live-title").value = title;
        activeLive = { title, elapsedSeconds: 0, reachFactor: 0.75 + Math.random() * 0.5 };
        $("chat-messages").replaceChildren();
        addChatMessage("YouVibe", "Transmisja wystartowała! Miłego oglądania ✨");
        addChatMessage("Maja", "Hej! Wpadłam na live 👋");
        addChatMessage("Kacper", "Pozdrowienia dla wszystkich!");
        scheduleChatMessage();
        render();
        showToast("Transmisja wystartowała! Widzowie czekają na Ciebie.");
      });
      $("stop-live").addEventListener("click", stopLive);
      function saveAdSettings() {
        accrueAds(totals().views);
        state.ads.enabled = $("ad-enabled").checked;
        state.ads.format = $("ad-format").value;
        state.ads.frequency = Number($("ad-frequency").value);
        state.ads.rate = Number($("ad-rate").value);
        saveState();
        render();
        showToast("Zapisano ustawienia reklam.");
      }
      $("ad-enabled").addEventListener("change", saveAdSettings);
      $("ad-format").addEventListener("change", saveAdSettings);
      $("ad-frequency").addEventListener("change", saveAdSettings);
      $("ad-rate").addEventListener("change", saveAdSettings);
      $("file-input").addEventListener("change", (event) => selectFile(event.target.files[0]));
      $("dropzone").addEventListener("dragover", (event) => { event.preventDefault(); $("dropzone").classList.add("dragging"); });
      $("dropzone").addEventListener("dragleave", () => $("dropzone").classList.remove("dragging"));
      $("dropzone").addEventListener("drop", (event) => {
        event.preventDefault();
        $("dropzone").classList.remove("dragging");
        selectFile(event.dataTransfer.files[0]);
      });
      $("upload-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!selectedFile) return;
        const button = $("publish-button");
        button.disabled = true;
        try {
          const upload = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title: $("title-input").value.trim() || selectedFile.name,
            type: selectedFile.type,
            createdAt: Date.now()
          };
          createReach(upload, totals().subs);
          await storeFile({ id: upload.id, blob: selectedFile });
          state.uploads.unshift(upload);
          saveState();
          closeModal();
          render();
          showToast("Opublikowano! Twoja kariera nabiera tempa ✨");
        } catch (error) {
          console.error("Nie udało się opublikować materiału:", error);
          showToast(error.message || "Nie udało się zapisać pliku. Spróbuj ponownie.");
          button.disabled = false;
        }
      });
      $("search").addEventListener("input", applySearch);
      document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item === button));
        document.querySelectorAll(".page-view").forEach((page) => { page.hidden = page.id !== button.dataset.page; });
      }));
      migrateUploadReach();
      $("ad-enabled").checked = state.ads.enabled;
      $("ad-format").value = state.ads.format;
      $("ad-frequency").value = String(state.ads.frequency);
      $("ad-rate").value = String(state.ads.rate);
      render();
      setInterval(() => {
        updateLive();
        render();
        if (Date.now() - lastAutosave >= 5000) saveState();
      }, 1000);
    })();
