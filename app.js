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
      const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
      const COLLABORATION_THRESHOLD = 10000n;
      const COLLABORATION_CAMPAIGN_NAMES = [
        "Auralis", "Bevel Labs", "Clover & Co", "Dayglow", "Evertrail", "Fable Foods", "Goodfolk", "Hush House", "Ivory Peak", "Juniper Works",
        "Kindred Supply", "Luma Living", "Morrow Goods", "Nectar North", "Openfield", "Pine & Pixel", "Quiet Current", "Ramble Studio", "Solstice Social", "Trueform",
        "Upwell", "Velvet Fern", "Wildwood Market", "Yonderly", "Zephyr & Stone", "Amberline", "Brightside Co", "Cloudberry", "Driftwell", "Elm Street Goods",
        "Foxglove Foundry", "Golden Hour", "Harborlight", "Indigo Thread", "Jollygood", "Kite & Key", "Little Orbit", "Moonmilk", "Northstar Supply", "Olive Theory",
        "Paper Tiger", "Quarry & Cove", "Redwood Ritual", "Sunday Standard", "Tandem Works", "Umbra Studio", "Vivid Vale", "Woven Wonder", "Yellow Finch", "Zenith Bloom",
        "Arbor & Ash", "Bluebird Market", "Copperfield", "Dapple Goods", "Eastward Co", "Fieldnote", "Greenroom Labs", "Hearthside", "Ironwood Isle", "Joyful Matter",
        "Koru Collective", "Lantern Lane", "Maple Motion", "Newday Nutrition", "Oat & Oak", "Pebble People", "Quicksilver Craft", "Riverstone", "Soft Focus", "Timber Theory",
        "Uncommon Union", "Vera Vida", "Westward Works", "Wild Mint", "Young Mountain", "Alba Atelier", "Bramble & Birch", "Common Ground", "Dawn Patrol", "Ember & Echo",
        "Faraway Found", "Goodweather", "Highline Home", "Isla Market", "Keen & Kind", "Larkspur Lane", "Mellow Fellow", "Nook & Nest", "Orchard Origin", "Poppyseed Studio",
        "Rooftop Ritual", "Slow Sunday", "Thistle & Thread", "Understory", "Violet Hour", "Wilderwise", "Yarrow House", "Zest Theory", "Daymark Goods", "Evergreen Edit"
      ];
      const COLLABORATION_CATEGORIES = [
        ["Technologia", "Pokaż widzom przydatne rozwiązanie dla twórców."],
        ["Jedzenie i napoje", "Dodaj krótkie lokowanie produktu do swojego materiału."],
        ["Moda i uroda", "Zaprezentuj produkt, który pasuje do Twojego stylu."],
        ["Dom i styl życia", "Opowiedz o rzeczy, która ułatwia codzienność."],
        ["Gaming", "Pokaż sprzęt lub dodatek podczas nagrania."],
        ["Sport i outdoor", "Podziel się produktem, który wspiera aktywny tryb życia."],
        ["Kultura i rozrywka", "Poleć społeczności ciekawą nowość."],
        ["Edukacja", "Pokaż narzędzie, z którego korzystasz przy nauce i pracy."]
      ];
      const COLLABORATION_CAMPAIGNS = COLLABORATION_CAMPAIGN_NAMES.map((name, index) => {
        const [category, description] = COLLABORATION_CATEGORIES[index % COLLABORATION_CATEGORIES.length];
        return {
          id: `brand-${index + 1}`,
          name,
          category,
          description,
          minSubs: COLLABORATION_THRESHOLD,
          baseViews: 100000n + BigInt(index) * 25000n,
          baseReward: 1000n + BigInt(index) * 75n,
          rewardPerThousandSubs: 30n + BigInt(index % 12) * 5n
        };
      });
      const LIVE_CHAT_NAMES = [
        "Maja", "Kacper", "Ola", "Filip", "Zuzia", "Bartek", "Kuba", "Nina", "Mati", "Lena",
        "Adrian", "Wiki", "Oskar", "Iga", "Dawid", "Szymon", "Ania", "Tomek", "Pola", "Michał",
        "Emilia", "Rafał", "Nadia", "Patryk", "Kinga", "Wojtek", "Sara", "Igor", "Ewa", "Łukasz",
        "Zosia", "Maks", "Alicja", "Janek", "pixelowy_kot", "KawaZ mlekiem", "Luna.exe",
        "misiek_online", "Kaktusik", "pan_od_memow", "niebieski_smok", "TurboMarchewka",
        "księżycowy_wilk", "kocur_z_netem", "PandaNaLive", "spokojny_widz", "MistrzKliku",
        "malina🍓", "GraczBezNicka", "SzybkiJeż", "nocny_marek", "KosmicznaMysz", "hejka_tu_ja",
        "BananowySzejk", "RudyLis", "SowaPoGodzinach", "wiatr_z_polnocy", "MiniNinja",
        "CichyObserwator", "ziom_z_sasiedztwa", "TostowyRycerz", "Piegus", "FioletowaChmurka",
        "MrocznyToast", "RowerowyKuba", "KropkaTV", "ChillowyTryb", "SzefKanapek",
        "WiewiorkaLive", "Kompocik", "EchoCzatu", "zielony_ludek", "MruczekOnline",
        "Błyskawica", "KsiążkowyRekin", "SernikTeam", "widz_123", "PaniOdKawy",
        "KrolikNaCzacie", "JedenZWidzow", "Kredka", "ChrupkiMaster", "NocnaSowa",
        "PikselowyLis", "MiodowyMiś", "DobraFala", "KotekZOsiedla", "WafelWafelek",
        "Lisek_77", "WpadlemNaChwile", "ZłotyBorsuk", "MalaPlaneta", "ziomalski_klimat",
        "Kropelka", "MangoManiak", "SzalonyOgórek", "TajemniczyWidz", "RóżowyPingwin",
        "PiatekWieczor", "BłękitnySen", "KapitanHerbata", "KredensowyNinja", "FokaNaFali",
        "MalyWulkan", "KrisuLive", "CynamonowyToast", "KropkaNaMapie", "ZwyklyGracz",
        "PuchatyChomik", "Kawa_i_stream", "NiezlyVibe", "ZaspanyKot", "CzatowyDuch",
        "MorskaBryza", "KubekKakao", "PstrykPstryk", "Borsuk_Online", "MilaMila",
        "SrebrnyWilk", "LimonkowyNick", "JestemTu", "EkipaLive", "WidzZPrzypadku"
      ];
      const formatter = new Intl.NumberFormat("pl-PL");
      const compactFormatter = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });
      const illionPrefixes = [
        "mi", "bi", "try", "kwadry", "kwinty", "seksty", "septy", "okty", "nony", "decy",
        "undecy", "duodecy", "tredecy", "kwattuordecy", "kwindecy", "seksdecy", "septendecy",
        "oktodecy", "nowemdecy", "wiginty"
      ];
      const compoundPrefixes = ["un", "duo", "tres", "kwattuor", "kwin", "seks", "septem", "okto", "nowem"];
      const decadePrefixes = ["", "", "wiginty", "tryginty", "kwadraginty", "kwinkwaginty", "seksaginty", "septuaginty", "oktoginty", "nonaginty"];
      for (let decade = 2; decade <= 9; decade += 1) {
        if (decade > 2) illionPrefixes.push(decadePrefixes[decade]);
        compoundPrefixes.forEach((compound) => illionPrefixes.push(compound + decadePrefixes[decade]));
      }
      illionPrefixes.push("centy");
      const largeNumberUnits = illionPrefixes.flatMap((prefix, index) => {
        const ion = `${prefix}lion`;
        if (index === illionPrefixes.length - 1) {
          return [[ion, `${ion}a`, `${ion}y`, `${ion}ów`]];
        }
        const milliard = index === 0 ? "miliard" : `${prefix}liard`;
        return [
          [ion, `${ion}a`, `${ion}y`, `${ion}ów`],
          [milliard, `${milliard}a`, `${milliard}y`, `${milliard}ów`]
        ];
      });
      const gridIds = ["content-grid", "channel-grid", "uploads-grid"];
      let selectedFile = null;
      let dbPromise;
      let activeLive = null;
      let cameraStream = null;
      let chatTimer = null;
      let lastAutosave = Date.now();
      const previewUrls = new Map();
      const profileImageUrls = { avatar: { id: null, url: null }, banner: { id: null, url: null } };
      const $ = (id) => document.getElementById(id);
      const asCount = (value) => {
        try { return BigInt(value ?? 0); }
        catch { return 0n; }
      };
      let state = loadState();

      function loadState() {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
          return {
            uploads: Array.isArray(saved.uploads) ? saved.uploads : [],
            liveStats: {
              views: asCount(saved.liveStats?.views).toString(),
              likes: asCount(saved.liveStats?.likes).toString(),
              subs: asCount(saved.liveStats?.subs).toString(),
              donations: asCount(saved.liveStats?.donations).toString(),
              donationBalanceMicros: saved.liveStats?.donationBalanceMicros == null
                ? (asCount(saved.liveStats?.donations) * 1000000n).toString()
                : asCount(saved.liveStats.donationBalanceMicros).toString()
            },
            profile: {
              name: typeof saved.profile?.name === "string" && saved.profile.name.trim() ? saved.profile.name.trim().slice(0, 40) : "Twórca",
              bio: typeof saved.profile?.bio === "string" ? saved.profile.bio.slice(0, 280) : "",
              avatarId: typeof saved.profile?.avatarId === "string" ? saved.profile.avatarId : null,
              bannerId: typeof saved.profile?.bannerId === "string" ? saved.profile.bannerId : null
            },
            collaborations: {
              balanceMicros: asCount(saved.collaborations?.balanceMicros).toString(),
              activeIds: Array.isArray(saved.collaborations?.activeIds)
                ? saved.collaborations.activeIds.filter((id) => COLLABORATION_CAMPAIGNS.some((campaign) => campaign.id === id))
                : [],
              offerIds: Array.isArray(saved.collaborations?.offerIds)
                ? saved.collaborations.offerIds.filter((id) => COLLABORATION_CAMPAIGNS.some((campaign) => campaign.id === id))
                : []
            },
            ads: {
              unlockedAt: Number(saved.ads?.unlockedAt) || null,
              viewsAtUnlock: Math.max(0, Number(saved.ads?.viewsAtUnlock) || 0),
              enabled: saved.ads?.enabled !== false,
              format: AD_FORMATS.includes(saved.ads?.format) ? saved.ads.format : "preroll",
              frequency: AD_FREQUENCIES.includes(Number(saved.ads?.frequency)) ? Number(saved.ads.frequency) : 2,
              rate: AD_RATES.includes(Number(saved.ads?.rate)) ? Number(saved.ads.rate) : 8.5,
              monetizedViews: asCount(saved.ads?.monetizedViews).toString(),
              balanceMicros: saved.ads?.balanceMicros == null
                ? BigInt(Math.round(Math.max(0, Number(saved.ads?.balance) || 0) * 1000000)).toString()
                : asCount(saved.ads.balanceMicros).toString(),
              lastProcessedViews: saved.ads?.lastProcessedViews == null ? null : asCount(saved.ads.lastProcessedViews).toString()
            }
          };
        } catch (error) {
          console.error("Nie udało się odczytać danych YouVibe:", error);
          return {
            uploads: [],
            liveStats: { views: "0", likes: "0", subs: "0", donations: "0", donationBalanceMicros: "0" },
            profile: { name: "Twórca", bio: "", avatarId: null, bannerId: null },
            collaborations: { balanceMicros: "0", activeIds: [], offerIds: [] },
            ads: { unlockedAt: null, viewsAtUnlock: 0, enabled: true, format: "preroll", frequency: 2, rate: 8.5, monetizedViews: "0", balanceMicros: "0", lastProcessedViews: null }
          };
        }
      }
      function saveState() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state, (_, value) => typeof value === "bigint" ? value.toString() : value));
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
      async function deleteFile(id) {
        if (!id) return;
        const db = await openDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(DB_STORE, "readwrite");
          tx.objectStore(DB_STORE).delete(id);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error || new Error("Nie udało się usunąć pliku profilu."));
          tx.onabort = () => reject(tx.error || new Error("Usuwanie pliku profilu zostało przerwane."));
        });
      }
      async function clearMediaStore() {
        const db = await openDb();
        await new Promise((resolve, reject) => {
          const tx = db.transaction(DB_STORE, "readwrite");
          tx.objectStore(DB_STORE).clear();
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error || new Error("Nie udało się usunąć zapisanych materiałów."));
          tx.onabort = () => reject(tx.error || new Error("Reset zapisanych materiałów został przerwany."));
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
          ? asCount(reach.maxViews)
          : asCount(reach.maxViews) * BigInt(Math.floor((1 - Math.exp(-age / reach.decaySeconds)) * 1e9)) / 1000000000n;
        const naturalSubs = views * 12n / 1000n;
        const subs = upload.guaranteedInitialSubscriber && naturalSubs === 0n ? 1n : naturalSubs;
        return { views, likes: views * 64n / 1000n, subs };
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
        const safeSubscribers = asCount(subscribers);
        const subscriberViewCap = safeSubscribers * 1000n;
        const channelViewCap = subscriberViewCap < 50n ? 50n : subscriberViewCap;
        const calculatedMaxViews = channelViewCap * BigInt(Math.floor(reachFraction * 10000)) / 10000n;
        const maxViews = safeSubscribers === 0n && calculatedMaxViews < 50n ? 50n : calculatedMaxViews;
        const decayRanges = {
          spokojny: [600, 1800],
          standardowy: [1800, 3600],
          mocny: [3600, 7200],
          viralowy: [7200, 14400]
        };
        const [minimumDecay, maximumDecay] = decayRanges[tier];
        upload.reach = {
          modelVersion: 7,
          subscribersAtPublish: safeSubscribers.toString(),
          channelViewCap: channelViewCap.toString(),
          maxViews: maxViews.toString(),
          decaySeconds: Math.floor(minimumDecay + Math.random() * (maximumDecay - minimumDecay)),
          tier
        };
      }
      function migrateUploadReach() {
        let changed = false;
        const knownSubscribers = asCount(state.liveStats.subs) + state.uploads.reduce((sum, upload, index) => {
          if (!upload.reach || !Number.isFinite(upload.reach.decaySeconds)) return sum;
          return sum + metrics(upload, index).subs;
        }, 0n);
        state.uploads.forEach((upload) => {
          if (upload.reach?.modelVersion === 7
            && typeof upload.reach.maxViews === "string"
            && Number.isFinite(upload.reach.decaySeconds)) return;
          const subscribersAtPublish = upload.reach?.subscribersAtPublish != null
            ? asCount(upload.reach.subscribersAtPublish)
            : knownSubscribers;
          createReach(upload, subscribersAtPublish);
          changed = true;
        });
        if (changed) saveState();
      }
      function guaranteeFirstSubscriber() {
        const firstUpload = state.uploads.reduce((first, upload) =>
          !first || upload.createdAt < first.createdAt ? upload : first, null);
        let changed = false;
        state.uploads.forEach((upload) => {
          const shouldGuarantee = upload === firstUpload;
          if (Boolean(upload.guaranteedInitialSubscriber) === shouldGuarantee) return;
          upload.guaranteedInitialSubscriber = shouldGuarantee;
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
        }, { views: 0n, likes: 0n, subs: 0n });
        total.views += asCount(state.liveStats.views);
        total.likes += asCount(state.liveStats.likes);
        total.subs += asCount(state.liveStats.subs);
        return total;
      }
      function accrueAds(totalViews) {
        if (!state.ads.unlockedAt) return false;
        const currentTotal = asCount(totalViews);
        if (state.ads.lastProcessedViews === null) {
          state.ads.lastProcessedViews = currentTotal.toString();
          return true;
        }
        const previousViews = asCount(state.ads.lastProcessedViews);
        const currentViews = currentTotal > previousViews ? currentTotal : previousViews;
        const newViews = currentViews - previousViews;
        state.ads.lastProcessedViews = currentViews.toString();
        if (state.ads.enabled && newViews > 0n) {
          state.ads.monetizedViews = (asCount(state.ads.monetizedViews) + newViews).toString();
          const rateMicros = BigInt(Math.round(state.ads.rate * 1000000));
          const formatHundredths = BigInt(Math.round(AD_FORMAT_FACTORS[state.ads.format] * 100));
          const divisor = BigInt(state.ads.frequency * 100000);
          const earnedMicros = newViews * rateMicros * formatHundredths / divisor;
          state.ads.balanceMicros = (asCount(state.ads.balanceMicros) + earnedMicros).toString();
        }
        return newViews > 0;
      }
      function formatMoney(value) {
        return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
      }
      function formatBalance(value) {
        const cents = (asCount(value) + 5000n) / 10000n;
        const whole = cents / 100n;
        const fraction = (cents % 100n).toString().padStart(2, "0");
        return whole >= 1000n ? `${shortNumber(whole)} zł` : `${formatter.format(whole)},${fraction} zł`;
      }
      function collaborationOffer(campaign, subscribers) {
        const currentSubscribers = asCount(subscribers);
        const targetViews = campaign.baseViews > currentSubscribers * 10n ? campaign.baseViews : currentSubscribers * 10n;
        const reward = campaign.baseReward + currentSubscribers / 1000n * campaign.rewardPerThousandSubs;
        return { targetViews, rewardMicros: reward * 1000000n };
      }
      function activeCollaborations(subscribers = totals().subs) {
        if (asCount(subscribers) < COLLABORATION_THRESHOLD) return [];
        const activeIds = new Set(state.collaborations.activeIds);
        return COLLABORATION_CAMPAIGNS.filter((campaign) => activeIds.has(campaign.id));
      }
      function ensureCollaborationOffers() {
        if (totals().subs < COLLABORATION_THRESHOLD) return false;
        const originalOffers = state.collaborations.offerIds.join(",");
        const offers = new Set(state.collaborations.offerIds);
        const active = new Set(state.collaborations.activeIds);
        state.collaborations.offerIds = Array.from(offers).slice(0, 4);
        while (state.collaborations.offerIds.length < 4) {
          const available = COLLABORATION_CAMPAIGNS.filter((campaign) =>
            !active.has(campaign.id) && !state.collaborations.offerIds.includes(campaign.id));
          if (!available.length) break;
          const next = available[Math.floor(Math.random() * available.length)];
          state.collaborations.offerIds.push(next.id);
        }
        const changed = originalOffers !== state.collaborations.offerIds.join(",");
        if (changed) saveState();
        return changed;
      }
      function activateCollaboration(campaignId) {
        const subscribers = totals().subs;
        if (subscribers < COLLABORATION_THRESHOLD) {
          showToast("Współprace odblokują się przy 10 000 subskrybentów.");
          return;
        }
        if (!state.collaborations.offerIds.includes(campaignId)) return;
        const campaign = COLLABORATION_CAMPAIGNS.find((item) => item.id === campaignId);
        if (!campaign) return;
        state.collaborations.activeIds.push(campaign.id);
        state.collaborations.offerIds = state.collaborations.offerIds.filter((id) => id !== campaign.id);
        ensureCollaborationOffers();
        saveState();
        render();
        showToast(`Aktywowano współpracę z ${campaign.name}.`);
      }
      function renderCollaborationOptions() {
        const container = $("sponsorship-list");
        const active = activeCollaborations();
        const checked = new Set(Array.from(container.querySelectorAll("input:checked"), (input) => input.value));
        if (!active.length) {
          container.innerHTML = '<p class="empty-collaborations">Wraz z rozwojem kanału pojawią się tu oferty.</p>';
          return;
        }
        container.innerHTML = active.map((campaign) => {
          const offer = collaborationOffer(campaign);
          return `<label class="sponsor-option"><input type="checkbox" value="${campaign.id}"${checked.has(campaign.id) ? " checked" : ""}><span><strong>${escapeHTML(campaign.name)}</strong><small>Cel: ${shortNumber(offer.targetViews)} wyświetleń · wypłata ${formatBalance(offer.rewardMicros)}</small></span></label>`;
        }).join("");
      }
      function renderCollaborationPage() {
        const subscribers = totals().subs;
        $("collaboration-balance").textContent = formatBalance(state.collaborations.balanceMicros);
        const grid = $("collaboration-grid");
        if (subscribers < COLLABORATION_THRESHOLD) {
          grid.innerHTML = `<div class="collaboration-locked-notice"><span class="collaboration-brand-icon">✦</span><strong>Współprace odblokują się przy ${shortNumber(COLLABORATION_THRESHOLD)} subskrybentów</strong><small>Rozwijaj kanał, a potem wybierzesz spośród ofert 100 fikcyjnych firm.</small></div>`;
          $("collaboration-offer-count").textContent = "ZABLOKOWANE";
          $("active-collaboration-count").textContent = `${state.collaborations.activeIds.length} aktywnych`;
          return;
        }
        ensureCollaborationOffers();
        const offerCampaigns = state.collaborations.offerIds
          .map((id) => COLLABORATION_CAMPAIGNS.find((campaign) => campaign.id === id))
          .filter(Boolean);
        $("collaboration-offer-count").textContent = `${offerCampaigns.length} OFERTY DO WYBORU`;
        $("active-collaboration-count").textContent = `${state.collaborations.activeIds.length} aktywnych`;
        grid.innerHTML = offerCampaigns.map((campaign) => {
          const offer = collaborationOffer(campaign, subscribers);
          return `<article class="collaboration-card available">
            <div class="collaboration-card-top"><span class="collaboration-brand-icon">✦</span><span class="collaboration-status">OFERTA DLA CIEBIE</span></div>
            <h2>${escapeHTML(campaign.name)}</h2><span class="collaboration-category">${escapeHTML(campaign.category)}</span>
            <p>${escapeHTML(campaign.description)}</p>
            <div class="collaboration-goal"><span>Cel lokowania</span><strong>${shortNumber(offer.targetViews)} wyświetleń</strong></div>
            <div class="collaboration-goal"><span>Wypłata za film</span><strong>${formatBalance(offer.rewardMicros)}</strong></div>
            <button class="primary activate-collaboration" type="button" data-campaign="${campaign.id}">Aktywuj współpracę</button>
          </article>`;
        }).join("");
        const active = activeCollaborations(subscribers);
        if (active.length) {
          grid.insertAdjacentHTML("beforeend", `<div class="active-collaborations"><h2>Aktywne współprace</h2><p>Te firmy możesz zaznaczyć jako lokowanie przy dodawaniu filmu.</p><div class="active-collaboration-list">${active.map((campaign) => `<span>${escapeHTML(campaign.name)}</span>`).join("")}</div></div>`);
        }
      }
      function accrueCollaborationEarnings() {
        let earned = 0n;
        let completedDeals = 0;
        state.uploads.forEach((upload, index) => {
          if (!Array.isArray(upload.sponsorships)) return;
          const views = metrics(upload, index).views;
          upload.sponsorships.forEach((deal) => {
            if (deal.paid || views < asCount(deal.targetViews)) return;
            deal.paid = true;
            const payout = asCount(deal.rewardMicros);
            state.collaborations.balanceMicros = (asCount(state.collaborations.balanceMicros) + payout).toString();
            earned += payout;
            completedDeals += 1;
          });
        });
        if (!completedDeals) return;
        saveState();
        showToast(`Zaliczone lokowania: ${completedDeals}. Wypłata ${formatBalance(earned)} trafiła na saldo współprac.`);
      }
      function liveViewers() {
        if (!activeLive) return 0n;
        const subscribers = totals().subs;
        const growth = 1 - Math.exp(-activeLive.elapsedSeconds / 30);
        const subscriberRoot = integerSquareRoot(subscribers);
        const growthScale = BigInt(Math.floor(growth * 1000000));
        const reachScale = BigInt(Math.floor(activeLive.reachFactor * 1000));
        const viewers = (40n + subscriberRoot * 22n) * reachScale * growthScale / 10000000000n;
        return viewers > 0n ? viewers : 1n;
      }
      function donationLimit() {
        const limit = asCount(totals().subs) / 100n + 1n;
        return Number(limit > 100000n ? 100000n : limit);
      }
      function integerSquareRoot(value) {
        if (value < 2n) return value;
        const digits = value.toString().length;
        let estimate = 1n << BigInt(Math.ceil(digits * 3.322 / 2));
        while (true) {
          const next = (estimate + value / estimate) >> 1n;
          if (next >= estimate) return estimate;
          estimate = next;
        }
      }
      function logarithm10(value) {
        const digits = value.toString();
        return digits.length - 1 + Math.log10(Number(digits.slice(0, 16)) / (10 ** (Math.min(16, digits.length) - 1)));
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
      function addDonationMessage(name, amount) {
        const container = $("chat-messages");
        const placeholder = container.querySelector(".chat-placeholder");
        if (placeholder) placeholder.remove();
        const line = document.createElement("div");
        line.className = "chat-message chat-donation";
        const sender = document.createElement("span");
        const username = document.createElement("strong");
        username.textContent = name;
        sender.append(username, document.createTextNode(" wysłał donate"));
        const donation = document.createElement("span");
        donation.className = "chat-donation-amount";
        donation.textContent = `${formatter.format(amount)} zł`;
        line.append(sender, donation);
        container.append(line);
        while (container.children.length > 50) container.firstElementChild.remove();
        container.scrollTop = container.scrollHeight;
      }
      function scheduleChatMessage() {
        if (!activeLive) return;
        const messages = [
          "Hej, wpadłem właśnie 👋", "Pozdrowienia dla całego czatu!", "Ale fajny klimat tutaj ✨",
          "Kiedy następny film?", "Zostawiam łapkę w górę 👍", "Oglądam od samego początku!",
          "Dobra energia na tym live 🔥", "Jaki temat następnego odcinka?", "Miłego oglądania wszystkim!",
          "Pierwszy raz na kanale, zostaję!", "Dzięki za odpowiedź!", "Pozdro z Krakowa!",
          "Kto ogląda z Warszawy?", "Może zrobisz Q&A?", "Czekam na nowy film ❤️",
          "Jaki sprzęt polecasz na start?", "Gratulacje za progres kanału!", "Dźwięk jest super",
          "Ale fajna społeczność!", "Kto czeka na następny odcinek?", "Pokażesz kulisy nagrywania?",
          "Ile czasu zajmuje montaż filmu?", "O której następny live?", "Mega pomysł na materiał!",
          "Pozdrowienia z Gdańska!", "Kto jest tu od pierwszego filmu?", "Wbijajcie suby!",
          "Ten kanał szybko rośnie!", "Dawaj jeszcze jedną historię 😄", "Co dziś nagrywasz?",
          "Masz świetne poczucie humoru!", "Oglądam na telefonie 📱", "Ktoś ogląda z Wrocławia?",
          "Niech live trwa jak najdłużej!", "Ale szybko leci czas na tym live", "Super, że jesteś!",
          "Pozdro z Poznania!", "Jaki będzie kolejny challenge?", "Dobra robota, twórco!",
          "To mój ulubiony kanał!", "Kto jest tu nowy?", "Lecimy po kolejny kamień milowy!",
          "Możesz opowiedzieć więcej?", "Ale tu dzisiaj dużo osób!", "Jak minął dzień?",
          "Pokaż setup!", "Kawa czy herbata podczas montażu? ☕", "Jaki program do edycji polecasz?",
          "To najlepszy moment dzisiejszego live!", "Włączcie powiadomienia 🔔", "Pozdro dla moderatorów!",
          "Kto ogląda z zagranicy?", "Super jakość obrazu!", "Będzie kiedyś vlog?",
          "Czy planujesz współpracę z innymi twórcami?", "Jaki jest twój ulubiony film na kanale?",
          "Wpadłem tylko na chwilę, a zostaję!", "Ale emocje!", "Możesz powtórzyć ostatnią rzecz?",
          "Zrób kiedyś live z widzami!", "Czekam na kulisy projektu!", "Pozdrowienia z Łodzi!",
          "Ktoś ogląda po szkole?", "Ten format jest świetny", "Dzięki za dzisiejszy live!",
          "Jak wpadłeś na ten pomysł?", "Masz super ekipę!", "Kiedy możemy spodziewać się premiery?",
          "Piona dla wszystkich na czacie! ✋", "To było naprawdę ciekawe", "Oglądam każdy odcinek!",
          "Czy nagrasz o tym osobny film?", "Ale niespodzianka!", "Pozdro z Katowic!",
          "Kto pamięta pierwszy odcinek?", "Nie mogę się doczekać kolejnej części",
          "Masz bardzo fajny głos", "Dobra muzyka na wejściu 🎵", "Zostańmy jeszcze chwilę!",
          "Zrobiło się tu naprawdę tłoczno", "Świetny pomysł z tym live", "Ktoś nagrywa notatki?",
          "Jaki temat najbardziej lubisz nagrywać?", "Pokaż kiedyś dzień z życia",
          "Cześć z Białegostoku!", "Ale czat dziś szybko leci", "Miło was wszystkich widzieć!",
          "To powinno mieć milion wyświetleń", "Czy będzie druga część?", "Dzięki za inspirację!",
          "O której zwykle publikujesz filmy?", "Właśnie wysłałem link znajomym",
          "Super, że odpowiadasz na pytania", "Ten kanał zasługuje na więcej!", "Kto tu ogląda z rodziną?",
          "Jaki był twój pierwszy film?", "Ale fajna niespodzianka dla widzów", "Wpadnę też na następny live!",
          "Pozdro z Lublina!", "Mam dokładnie takie samo zdanie", "Czat robi dziś robotę!",
          "Ciekawe, jak to się skończy", "Pokaż więcej takich materiałów!", "Mega miło spędzony czas",
          "Ktoś już widział najnowszy film?", "Ile trwa przygotowanie takiego odcinka?",
          "Oby ten kanał dalej tak rósł!", "Jesteście super ekipą ❤️", "Najlepszy live w tym tygodniu!",
          "Dołączam do ekipy!", "Możemy zrobić szybkie głosowanie?", "Pozdro z Torunia!",
          "Kto ogląda w nocy?", "Ale dziś aktywny czat!", "Warto było wpaść!",
          "Jestem tu od kilku minut i już mi się podoba", "Może pogadamy o nowych planach?",
          "Ktoś jeszcze czeka na premierę?", "Dawaj, dasz radę!", "To był świetny odcinek",
          "Słychać cię bardzo dobrze", "Kto ogląda z telefonu?", "Uśmiech dla czatu 😄",
          "Fajnie, że robisz coś regularnie", "Kolejny sub właśnie wpadł!", "Pozdro dla wszystkich nowych widzów!",
          "Dobrze się tego słucha", "Zostańcie do końca!", "Ten pomysł naprawdę wypalił",
          "Jaki będzie następny cel kanału?", "Pozdro z Rzeszowa!", "Dużo serduszek dla czatu ❤️",
          "Oglądam i kibicuję!", "Masz coraz lepsze materiały!", "Czat pozdrawia twórcę!",
          "Kto tu przyszedł z polecanych?", "Zróbmy rekord widzów!", "Niech wpadają kolejne pytania!",
          "Miłego wieczoru dla wszystkich!", "To była dobra decyzja, żeby kliknąć live",
          "Dawaj znać, kiedy kolejny odcinek!", "Ale szybko przybywa nowych osób",
          "Oby więcej takich transmisji!", "Super odpowiedź, dzięki!", "Pozdro z całej Polski!",
          "Właśnie zrobiłem sobie herbatę i odpalam live ☕", "Ten temat mógłbym słuchać godzinami",
          "Ktoś tu ogląda od początku transmisji?", "Daj znać, co planujesz na weekend!",
          "Wpadłem z polecanych i zostaję 😄", "Ale dobrze się tego słucha w tle",
          "Pozdrawiam wszystkich oglądających po pracy!", "Może kiedyś zrobisz live z gier?",
          "Dzięki za poprawę humoru dzisiaj ❤️", "Fajnie, że czytasz wiadomości z czatu",
          "Kto też właśnie je kolację?", "Jest tu ktoś z małej miejscowości?",
          "Widać, że wkładasz w to dużo serca", "Czat ma dziś naprawdę dobry nastrój",
          "To jest dokładnie ten content, którego szukałem", "Zostańmy do samego końca!",
          "Może opowiesz, jak wygląda twój dzień?", "Pozdrowienia dla cichych widzów 👋",
          "Ten live leci szybciej niż się spodziewałem", "Dobra decyzja z tym tematem",
          "Przydałby się odcinek z odpowiedziami na pytania", "Ktoś ogląda z drugiego końca Polski?",
          "Niech ten kanał dobije dziś do kolejnego celu!", "Ale miło tu wpaść po ciężkim dniu",
          "Włączam powiadomienia, żeby nie przegapić następnego live 🔔",
          "Masz bardzo przyjemny sposób opowiadania", "Czy będzie kiedyś spotkanie z widzami?",
          "Ten czat jest lepszy niż niejeden komentarz pod filmem",
          "Kto jeszcze nadrabia starsze materiały?", "Dziś wyjątkowo dużo znajomych nicków!",
          "Oby algorytm podsunął ten live kolejnym osobom", "Super, że robisz to regularnie",
          "Pozdro dla każdego, kto ogląda na słuchawkach 🎧", "To był mój najlepszy klik dzisiaj",
          "Jakie masz plany na kolejny materiał?", "Nie wiedziałem, że tak szybko minie godzina",
          "Miło widzieć, jak społeczność się rozkręca", "Kto jest tu pierwszy raz na live?",
          "Bardzo fajnie prowadzisz tę rozmowę", "Zróbmy falę serduszek dla twórcy ❤️",
          "Wpadnę jutro sprawdzić nowy film", "Pozdrowienia z nocnej zmiany!",
          "Czat, jesteście dziś niesamowici", "Może pokażesz kiedyś proces montażu?",
          "Oglądam z tabletu i wszystko dobrze widać", "Ten pomysł ma naprawdę duży potencjał",
          "Przybijam wirtualną piątkę wszystkim 👋", "Fajnie, że można tu odpocząć",
          "Kto ma już ustawione przypomnienie na kolejny live?", "Warto było zostać na transmisji",
          "Pozdro dla ekipy, która pomaga przy kanale!", "Mam nadzieję, że będzie więcej takich rozmów",
          "Niech czat poda swoje propozycje tematów!", "Z każdym live jest coraz lepsza atmosfera",
          "Dobra energia aż przebija przez ekran ✨", "Zaraz podeślę ten kanał znajomym",
          "Kto ogląda z kubkiem czegoś ciepłego?", "Dzięki za luźny i fajny wieczór",
          "Fajnie zobaczyć, jak kanał rośnie krok po kroku", "Mam podobne doświadczenia!",
          "Przydałaby się jeszcze jedna taka transmisja w tygodniu",
          "Niech nowi widzowie dadzą znać skąd są!", "Zostawiam łapkę i lecę dalej oglądać 👍",
          "Miło, że odpowiadasz nawet przy szybkim czacie", "Ale tu przytulny klimat",
          "Ciekawe, jaki rekord widzów dziś zrobimy", "Może zrobisz kiedyś odcinek zza kulis?",
          "Wpadłem na minutę, minęło pół godziny 😅", "Super pomysł, żeby pogadać na żywo",
          "Dzięki za wszystkie materiały, dobra robota!", "Ktoś tu jeszcze ogląda z konsoli?",
          "Ten live powinien mieć własną playlistę", "Dawaj, czat trzyma kciuki!",
          "Mój ulubiony moment to właśnie teraz", "Dobrze, że dziś odpaliłem YouTube",
          "Pozdrawiam widzów z każdej strefy czasowej 🌍", "Czat, napiszcie jaki film obejrzeć później",
          "Widać coraz większą ekipę na kanale", "Zostańmy jeszcze na kilka pytań",
          "Ten kanał ma swój wyjątkowy charakter", "Chętnie zobaczę więcej takich spontanicznych live",
          "Miłego wieczoru, wszystkim obecnym!", "Ktoś tu kibicuje od pierwszych subów?",
          "Przyjemnie słuchać, jak opowiadasz o kulisach", "Oglądam z psem, też słucha 🐶",
          "Czekam na następny kamień milowy kanału!", "Wartościowy live, dzięki za poświęcony czas"
        ];
        const viewers = liveViewers();
        const subscribers = totals().subs;
        const activity = logarithm10(subscribers + 1n);
        const commentChance = Math.min(0.99, 0.2 + logarithm10(viewers + 1n) * 0.22 + activity * 0.04);
        const batchSize = Math.min(20, 1 + Math.floor(activity / 1.5));
        for (let index = 0; index < batchSize && Math.random() < commentChance; index += 1) {
          const name = LIVE_CHAT_NAMES[Math.floor(Math.random() * LIVE_CHAT_NAMES.length)];
          const message = messages[Math.floor(Math.random() * messages.length)];
          addChatMessage(name, message);
        }
        const delay = Math.max(400, 12000 / (1 + Math.sqrt(Number(activity + 1)) * Math.sqrt(Number(activity + 1)) * 0.16 + Math.sqrt(Number(viewers)) * 0.45));
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
        state.liveStats.likes = (asCount(state.liveStats.views) * 64n / 1000n).toString();
        state.liveStats.subs = (asCount(state.liveStats.views) * 12n / 1000n).toString();
        saveState();
        render();
        showToast("Transmisja zakończona. Jej statystyki zapisano na kanale.");
      }
      function updateLive() {
        if (!activeLive) return;
        activeLive.elapsedSeconds += 1;
        state.liveStats.views = (asCount(state.liveStats.views) + liveViewers() * BigInt(SIM_SPEED) / 120n).toString();
        state.liveStats.likes = (asCount(state.liveStats.views) * 64n / 1000n).toString();
        state.liveStats.subs = (asCount(state.liveStats.views) * 12n / 1000n).toString();
        if (activeLive.elapsedSeconds % 10 === 0) {
          const amount = Math.floor(Math.random() * donationLimit()) + 1;
          state.liveStats.donations = (asCount(state.liveStats.donations) + BigInt(amount)).toString();
          state.liveStats.donationBalanceMicros = (asCount(state.liveStats.donationBalanceMicros) + BigInt(amount) * 1000000n).toString();
          addDonationMessage(LIVE_CHAT_NAMES[Math.floor(Math.random() * LIVE_CHAT_NAMES.length)], amount);
        }
      }
      function largeNumberUnit(value, forms) {
        const lastTwo = value % 100n;
        const lastDigit = value % 10n;
        if (value === 1n) return forms[0];
        if (lastDigit >= 2n && lastDigit <= 4n && (lastTwo < 12n || lastTwo > 14n)) return forms[2];
        return forms[3];
      }
      function shortNumber(value) {
        const count = asCount(value);
        if (count < 1000n) return formatter.format(count);
        if (count < 1000000n) {
          const thousandTenths = (count * 10n + 500n) / 1000n;
          if (thousandTenths >= 10000n) return `1 ${largeNumberUnits[0][0]}`;
          const amount = Number(thousandTenths) / 10;
          return `${compactFormatter.format(amount)} tys.`;
        }

        const digits = count.toString().length;
        let unitIndex = Math.floor((digits - 1) / 3) - 2;
        if (unitIndex >= largeNumberUnits.length) {
          return `${scientificCoefficient(count)} × 10^${digits - 1}`;
        }
        let divisor = 10n ** BigInt((unitIndex + 2) * 3);
        let amountTenths = (count * 10n + divisor / 2n) / divisor;
        if (amountTenths >= 10000n && unitIndex < largeNumberUnits.length - 1) {
          unitIndex += 1;
          divisor *= 1000n;
          amountTenths = (count * 10n + divisor / 2n) / divisor;
        }
        const whole = amountTenths / 10n;
        const fraction = amountTenths % 10n;
        const amount = fraction === 0n ? formatter.format(whole) : `${formatter.format(whole)},${fraction}`;
        return `${amount} ${largeNumberUnit(whole, largeNumberUnits[unitIndex])}`;
      }
      function scientificCoefficient(value) {
        const digits = value.toString();
        if (digits.length === 1 || digits[1] === "0") return digits[0];
        return `${digits[0]},${digits[1]}`;
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
      function setProfileImageElements(slot, url) {
        const imageIds = slot === "avatar"
          ? ["header-avatar-image", "channel-avatar-image", "profile-avatar-image"]
          : ["channel-banner-image", "profile-banner-image"];
        imageIds.forEach((id) => {
          const image = $(id);
          image.hidden = !url;
          if (url) image.src = url;
          else image.removeAttribute("src");
        });
        if (slot === "avatar") {
          $("header-avatar-fallback").hidden = Boolean(url);
          $("channel-avatar-fallback").hidden = Boolean(url);
          $("profile-avatar-fallback").hidden = Boolean(url);
        } else {
          $("profile-banner-preview").classList.toggle("has-image", Boolean(url));
        }
      }
      function renderProfileImage(slot) {
        const field = slot === "avatar" ? "avatarId" : "bannerId";
        const id = state.profile[field];
        const cached = profileImageUrls[slot];
        if (!id) {
          if (cached.url) URL.revokeObjectURL(cached.url);
          profileImageUrls[slot] = { id: null, url: null };
          setProfileImageElements(slot, null);
          return;
        }
        if (cached.id === id) {
          if (cached.url) setProfileImageElements(slot, cached.url);
          return;
        }
        if (cached.url) URL.revokeObjectURL(cached.url);
        profileImageUrls[slot] = { id, url: null };
        setProfileImageElements(slot, null);
        getFile(id).then((record) => {
          if (state.profile[field] !== id) return;
          if (!record) {
            showToast("Nie znaleziono zapisanego obrazu profilu.");
            return;
          }
          const url = URL.createObjectURL(record.blob);
          profileImageUrls[slot] = { id, url };
          setProfileImageElements(slot, url);
        }).catch((error) => {
          console.error("Nie udało się wczytać obrazu profilu:", error);
          showToast("Nie udało się wczytać obrazu profilu.");
        });
      }
      function renderProfile() {
        const name = state.profile.name || "Twórca";
        const initial = Array.from(name)[0]?.toLocaleUpperCase("pl-PL") || "Y";
        $("header-avatar-fallback").textContent = initial;
        $("channel-avatar-fallback").textContent = initial;
        $("profile-avatar-fallback").textContent = initial;
        $("profile-button").setAttribute("aria-label", `Otwórz menu profilu: ${name}`);
        $("home-greeting").textContent = `Hej, ${name}! 👋`;
        $("channel-name").textContent = name;
        $("channel-bio").textContent = state.profile.bio;
        $("channel-bio").hidden = !state.profile.bio;
        renderProfileImage("avatar");
        renderProfileImage("banner");
      }
      function render() {
        const total = totals();
        accrueCollaborationEarnings();
        renderProfile();
        renderCollaborationPage();
        if (!state.ads.unlockedAt && total.subs >= BigInt(AD_THRESHOLD)) {
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
        $("live-donation-total").textContent = formatBalance(state.liveStats.donationBalanceMicros);
        $("live-donation-limit").textContent = `Donate od 1 zł do ${formatter.format(donationLimit())} zł · nowy co 10 sekund`;
        $("live-status-value").textContent = activeLive ? "● Live" : "Offline";
        $("live-viewers").textContent = shortNumber(liveViewers());
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

        $("ad-balance").textContent = formatBalance(state.ads.balanceMicros);
        $("eligible-views").textContent = shortNumber(state.ads.monetizedViews);
        $("ad-rate-display").textContent = formatMoney(state.ads.rate);
        const threshold = BigInt(AD_THRESHOLD);
        const progressSubs = total.subs < threshold ? total.subs : threshold;
        $("monetization-progress-label").textContent = `${formatter.format(progressSubs)} / ${formatter.format(AD_THRESHOLD)}`;
        $("monetization-progress-bar").style.width = `${Number(progressSubs) / AD_THRESHOLD * 100}%`;
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
          { name:"Początkujący twórca", target:1000n },
          { name:"Wschodząca gwiazda", target:10000n },
          { name:"Internetowa sensacja", target:100000n },
          { name:"Legendarna sława", target:1000000n }
        ];
        const level = levels.find((item) => total.subs < item.target) || levels[levels.length - 1];
        const previousTarget = level.target === 1000n ? 0n : level.target / 10n;
        const progress = Math.max(0, Math.min(100, Number(total.subs - previousTarget) / Number(level.target - previousTarget) * 100));
        $("rank-name").textContent = total.subs >= 1000000n ? "Legendarna sława" : level.name;
        $("rank-progress").textContent = total.subs >= 1000000n ? "Maksymalny poziom!" : `${shortNumber(total.subs)} / ${shortNumber(level.target)} subów`;
        $("rank-bar").style.width = `${total.subs >= 1000000n ? 100 : progress}%`;

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
        renderCollaborationOptions();
        $("sponsorship-options").hidden = Boolean(selectedFile && !selectedFile.type.startsWith("video/"));
        $("modal").classList.add("open");
        $("title-input").focus();
      }
      $("profile-button").addEventListener("click", () => {
        const menu = $("profile-menu");
        menu.hidden = !menu.hidden;
        $("profile-button").setAttribute("aria-expanded", String(!menu.hidden));
      });
      $("reset-button").addEventListener("click", resetEverything);
      $("profile-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const name = $("profile-name").value.trim();
        if (!name) {
          showToast("Nick nie może być pusty.");
          return;
        }
        state.profile.name = name.slice(0, 40);
        state.profile.bio = $("profile-bio").value.trim().slice(0, 280);
        saveState();
        render();
        showToast("Zapisano zmiany profilu.");
      });
      $("profile-avatar-file").addEventListener("change", (event) => {
        saveProfileImage("avatar", event.target.files[0]);
        event.target.value = "";
      });
      $("profile-banner-file").addEventListener("change", (event) => {
        saveProfileImage("banner", event.target.files[0]);
        event.target.value = "";
      });
      $("clear-avatar").addEventListener("click", () => clearProfileImage("avatar"));
      $("clear-banner").addEventListener("click", () => clearProfileImage("banner"));
      $("withdraw-ads").addEventListener("click", () => withdrawBalance(state.ads, "balanceMicros", "reklam"));
      $("withdraw-donations").addEventListener("click", () => withdrawBalance(state.liveStats, "donationBalanceMicros", "donate"));
      $("withdraw-collaborations").addEventListener("click", () => withdrawBalance(state.collaborations, "balanceMicros", "współprac"));
      $("collaboration-grid").addEventListener("click", (event) => {
        const button = event.target.closest(".activate-collaboration");
        if (button) activateCollaboration(button.dataset.campaign);
      });
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".profile-menu-wrap")) {
          $("profile-menu").hidden = true;
          $("profile-button").setAttribute("aria-expanded", "false");
        }
      });
      function closeModal() {
        $("modal").classList.remove("open");
        $("upload-form").reset();
        selectedFile = null;
        $("sponsorship-options").hidden = false;
        $("file-label").textContent = "Kliknij lub przeciągnij plik tutaj";
        $("publish-button").disabled = true;
      }
      function withdrawBalance(balanceOwner, balanceField, label) {
        if (balanceOwner === state.ads) accrueAds(totals().views);
        if (balanceOwner === state.collaborations) accrueCollaborationEarnings();
        const balance = asCount(balanceOwner[balanceField]);
        if (balance <= 0n) {
          showToast("Brak środków do wypłaty.");
          return;
        }
        balanceOwner[balanceField] = "0";
        saveState();
        render();
        showToast(`Wypłacono ${formatBalance(balance)} z ${label}.`);
      }
      function profileImageId() {
        return crypto.randomUUID ? `profile-${crypto.randomUUID()}` : `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      }
      async function saveProfileImage(slot, file) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          showToast("Wybierz plik obrazu.");
          return;
        }
        if (file.size > MAX_PROFILE_IMAGE_BYTES) {
          showToast("Obraz jest za duży. Maksymalny rozmiar to 5 MB.");
          return;
        }
        const field = slot === "avatar" ? "avatarId" : "bannerId";
        const previousId = state.profile[field];
        const id = profileImageId();
        try {
          await storeFile({ id, blob: file });
          state.profile[field] = id;
          saveState();
          render();
        } catch (error) {
          console.error("Nie udało się zapisać obrazu profilu:", error);
          showToast(error.message || "Nie udało się zapisać obrazu profilu.");
          return;
        }
        if (previousId && previousId !== id) {
          try { await deleteFile(previousId); }
          catch (error) {
            console.error("Nie udało się usunąć poprzedniego obrazu profilu:", error);
            showToast("Obraz profilu został zmieniony, ale nie udało się usunąć poprzedniego pliku.");
            return;
          }
        }
        showToast(slot === "avatar" ? "Zmieniono zdjęcie profilowe." : "Zmieniono baner kanału.");
      }
      async function clearProfileImage(slot) {
        const field = slot === "avatar" ? "avatarId" : "bannerId";
        const previousId = state.profile[field];
        state.profile[field] = null;
        saveState();
        render();
        if (previousId) {
          try { await deleteFile(previousId); }
          catch (error) {
            console.error("Nie udało się usunąć obrazu profilu:", error);
            showToast("Profil zaktualizowano, ale nie udało się usunąć starego pliku.");
            return;
          }
        }
        showToast(slot === "avatar" ? "Usunięto zdjęcie profilowe." : "Usunięto baner kanału.");
      }
      async function resetEverything() {
        if (!window.confirm("Czy na pewno chcesz zresetować wszystko? Zostaną usunięte filmy, zdjęcia, statystyki i ustawienia. Tej operacji nie można cofnąć.")) return;

        let resetError = null;
        try { localStorage.removeItem(STORAGE_KEY); }
        catch (error) {
          resetError = error;
          console.error("Nie udało się usunąć statystyk z pamięci przeglądarki:", error);
        }
        try { await clearMediaStore(); }
        catch (error) {
          resetError = resetError || error;
          console.error("Nie udało się usunąć lokalnych plików kanału:", error);
        }

        if (activeLive) {
          clearTimeout(chatTimer);
          chatTimer = null;
          activeLive = null;
        }
        stopCamera();
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        previewUrls.clear();
        Object.keys(profileImageUrls).forEach((slot) => {
          if (profileImageUrls[slot].url) URL.revokeObjectURL(profileImageUrls[slot].url);
          profileImageUrls[slot] = { id: null, url: null };
        });
        state = {
          uploads: [],
          liveStats: { views: "0", likes: "0", subs: "0", donations: "0", donationBalanceMicros: "0" },
          profile: { name: "Twórca", bio: "", avatarId: null, bannerId: null },
          collaborations: { balanceMicros: "0", activeIds: [], offerIds: [] },
          ads: {
            unlockedAt: null,
            viewsAtUnlock: 0,
            enabled: true,
            format: "preroll",
            frequency: 2,
            rate: 8.5,
            monetizedViews: 0,
            balanceMicros: "0",
            lastProcessedViews: null
          }
        };
        $("search").value = "";
        $("ad-enabled").checked = true;
        $("ad-format").value = "preroll";
        $("ad-frequency").value = "2";
        $("ad-rate").value = "8.5";
        $("profile-name").value = "Twórca";
        $("profile-bio").value = "";
        closeModal();
        $("profile-menu").hidden = true;
        $("profile-button").setAttribute("aria-expanded", "false");
        document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("active", item.dataset.page === "home"));
        document.querySelectorAll(".page-view").forEach((page) => { page.hidden = page.id !== "home"; });
        lastAutosave = Date.now();
        render();

        if (resetError) {
          showToast("Kanał zresetowano, ale nie udało się usunąć wszystkich danych. Odśwież stronę i spróbuj ponownie.");
        } else {
          showToast("Wszystko zresetowane. Zaczynasz od zera!");
        }
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
        $("sponsorship-options").hidden = !file.type.startsWith("video/");
        if (!$("sponsorship-options").hidden) renderCollaborationOptions();
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
            createdAt: Date.now(),
            guaranteedInitialSubscriber: state.uploads.length === 0,
            sponsorships: selectedFile.type.startsWith("video/")
              ? Array.from($("sponsorship-list").querySelectorAll("input:checked"), (input) => {
                const campaign = COLLABORATION_CAMPAIGNS.find((item) => item.id === input.value);
                if (!campaign || totals().subs < campaign.minSubs) return null;
                const offer = collaborationOffer(campaign, totals().subs);
                return {
                  campaignId: campaign.id,
                  campaignName: campaign.name,
                  targetViews: offer.targetViews.toString(),
                  rewardMicros: offer.rewardMicros.toString(),
                  paid: false
                };
              }).filter(Boolean)
              : []
          };
          createReach(upload, totals().subs);
          await storeFile({ id: upload.id, blob: selectedFile });
          state.uploads.unshift(upload);
          saveState();
          closeModal();
          render();
          showToast(upload.guaranteedInitialSubscriber
            ? "Pierwszy subskrybent już wpadł! Twoja kariera ruszyła ✨"
            : "Opublikowano! Twoja kariera nabiera tempa ✨");
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
      guaranteeFirstSubscriber();
      $("ad-enabled").checked = state.ads.enabled;
      $("ad-format").value = state.ads.format;
      $("ad-frequency").value = String(state.ads.frequency);
      $("ad-rate").value = String(state.ads.rate);
      $("profile-name").value = state.profile.name;
      $("profile-bio").value = state.profile.bio;
      render();
      window.addEventListener("pagehide", saveState);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") saveState();
      });
      setInterval(() => {
        updateLive();
        render();
        if (Date.now() - lastAutosave >= 5000) saveState();
      }, 1000);
    })();
