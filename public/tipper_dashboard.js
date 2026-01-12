console.log("✅ tipper_dashboard.js geladen");

// ===============================
// Helper
// ===============================
async function api(url, options = {}) {
    const res = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
    }

    return res.status === 204 ? null : res.json();
}

function $(id) {
    return document.getElementById(id);
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await checkSession("tipper");
        //await ladeSpiele();
        await name_ermitteln();
        //await ladeGeplanteSpiele();
        await ladeSpieleMitTipps();
        $("saveAllTips").addEventListener("click", alleTippsSpeichern);
        $("logoutBtn")?.addEventListener("click", logout);     

        console.log("✅ Tipper Dashboard bereit");
    } catch (err) {
        console.error(err);
        location.href = "/";
    }
});



// Logout
// ===============================
async function logout() {
    await api("/api/logout", { method: "POST" });
    location.href = "/";
}
// ⚠️ TEMPORÄR – später durch Login / Session ersetzen
//const USER_ID = 1;


/*
// 1️⃣ Geplante Spiele laden
async function ladeGeplanteSpiele() {
    const res = await fetch("/api/spiele");
    const spiele = await res.json();

    const select = document.getElementById("spielSelect");
    select.innerHTML = '<option value="">Bitte wählen …</option>';

    spiele
        .filter(spiel => spiel.statuswort === "geplant")
        .forEach(spiel => {
            const opt = document.createElement("option");
            opt.value = spiel.id;
            opt.textContent =
                `${spiel.heimverein} – ${spiel.gastverein} (${spiel.anstoss})`;
            select.appendChild(opt);
        });
}

*/
/*

// 2️⃣ Tipp speichern
document.getElementById("btnTippen").addEventListener("click", async () => {
    const spiel_id = document.getElementById("spielSelect").value;
    const heimtipp = document.getElementById("heimtipp").value;
    const gasttipp = document.getElementById("gasttipp").value;

    if (!spiel_id) {
        return zeigeMeldung("Bitte ein Spiel auswählen", "red");
    }

    if (heimtipp === "" || gasttipp === "") {
        return zeigeMeldung("Bitte beide Tipps eingeben", "red");
    }

    try {
        const res = await fetch("/api/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: USER_ID,
                spiel_id: Number(spiel_id),
                heimtipp: Number(heimtipp),
                gasttipp: Number(gasttipp)
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        zeigeMeldung("Tipp gespeichert ✔", "green");

    } catch (err) {
        zeigeMeldung(err.message, "red");
    }
});

*/

// 3️⃣ Meldungen anzeigen
function zeigeMeldung(text, farbe) {
    const el = document.getElementById("meldung");
    el.textContent = text;
    el.style.color = farbe;
}




async function ladeSpieleMitTipps() {
    const spiele = await api("/api/spiele");
    const tbody = $("tipTabelle");
    tbody.innerHTML = "";

    const geplant = spiele.filter(s => s.statuswort === "geplant");

    if (geplant.length === 0) {
        tbody.innerHTML = `<tr><td>Keine geplanten Spiele</td></tr>`;
        return;
    }

    geplant.forEach(s => {
        // Zeile 1: Datum + Status
        const tr1 = document.createElement("tr");
        tr1.innerHTML = `
            <td colspan="3">
                📅 ${new Date(s.anstoss).toLocaleString("de-DE")}
                | Status: <b>${s.statuswort}</b>
            </td>
        `;

        // Zeile 2: Heimverein + Tipp
        const tr2 = document.createElement("tr");
        tr2.innerHTML = `
            <td width="40%"><b>${s.heimverein}</b></td>
            <td width="20%">Heim</td>
            <td width="40%">
                <input type="number"
                       min="0"
                       data-spiel="${s.id}"
                       data-team="heim"
                       class="tippInput">
            </td>
        `;

        // Zeile 3: Gastverein + Tipp
        const tr3 = document.createElement("tr");
        tr3.innerHTML = `
            <td><b>${s.gastverein}</b></td>
            <td>Gast</td>
            <td>
                <input type="number"
                       min="0"
                       data-spiel="${s.id}"
                       data-team="gast"
                       class="tippInput">
            </td>
        `;

        // optische Trennung
        const trSpacer = document.createElement("tr");
        trSpacer.innerHTML = `<td colspan="3">&nbsp;</td>`;

        tbody.append(tr1, tr2, tr3, trSpacer);
    });
}

async function alleTippsSpeichern() {
    const inputs = document.querySelectorAll(".tippInput");

    // Map: spiel_id → { heimtipp, gasttipp }
    const tipps = {};

    inputs.forEach(input => {
        const spielId = input.dataset.spiel;
        const team = input.dataset.team;
        const wert = input.value;

        if (!tipps[spielId]) {
            tipps[spielId] = {};
        }

        if (wert !== "") {
            tipps[spielId][team + "tipp"] = Number(wert);
        }
    });

    try {
        for (const spielId in tipps) {
            const t = tipps[spielId];

            // nur speichern, wenn beide Werte vorhanden
            if (t.heimtipp == null || t.gasttipp == null) continue;

            await api("/api/tips", {
                method: "POST",
                body: JSON.stringify({
                    spiel_id: spielId,
                    heimtipp: t.heimtipp,
                    gasttipp: t.gasttipp
                })
            });
        }

        $("meldung").textContent = "✅ Tipps gespeichert";
        $("meldung").style.color = "green";

    } catch (err) {
        console.error(err);
        $("meldung").textContent = "❌ Fehler beim Speichern";
        $("meldung").style.color = "red";
    }
}
























   


 



async function name_ermitteln(requiredRole = null) {
    const res = await fetch("/api/session", {
        credentials: "include"
    });

    if (!res.ok) {
        throw new Error("Session-Fehler");
    }

    const data = await res.json();

    if (!data.user) {
        throw new Error("Nicht eingeloggt");
    }

    if (requiredRole && data.user.role !== requiredRole) {
        throw new Error("Keine Berechtigung");
    }
    //console.log("Eingeloggt als:", data.user);
    $("benutzername").innerHTML = data.user.name;
    return data.user;
}




