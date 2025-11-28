// ===============================================
// === DUCK DICE AUTO HUNTER CONTENT SCRIPT    ===
// ===============================================

// Der kritische Event-Name aus der WebSocket-Analyse
const DUCK_SPAWN_EVENT = 'App\\Game\\Events\\GameStarted';
const API_CATCH_URL = 'https://duckdice.io/api/duck-hunt/catch';

// --- 1. Die Abschuss-Funktion (HTTP POST) ---
function shootDuck(duckHash) {
    const startTime = performance.now();
    
    // Die Cookies und Header werden automatisch vom Browser-Kontext gesendet
    fetch(API_CATCH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // Wichtig: Alle anderen Authentifizierungs-Header wie Cookie und x-fingerprint
            // werden vom Browser automatisch mitgesendet, da das Skript auf der Seite läuft.
        },
        body: JSON.stringify({hash: duckHash})
    })
    .then(response => {
        const endTime = performance.now();
        const reactionTime = (endTime - startTime).toFixed(2);

        if (response.ok && response.status === 200) {
            response.text().then(text => {
                if (text.trim() === "1") {
                    console.log(`[DUCK HUNTER] ✅ ERFOLG! Hash: ${duckHash} | Zeit: ${reactionTime} ms`);
                } else {
                    console.warn(`[DUCK HUNTER] ⚠️ Gesendet, aber fehlerhafte Antwort: ${text} | Zeit: ${reactionTime} ms`);
                }
            });
        } else {
            console.error(`[DUCK HUNTER] ❌ Fehler beim Abschuss (Status: ${response.status}) | Zeit: ${reactionTime} ms`);
        }
    })
    .catch(error => {
        console.error(`[DUCK HUNTER] ❌ POST-Anfrage fehlgeschlagen für ${duckHash}:`, error);
    });
}

// --- 2. Event-Verarbeitung und Hash-Extraktion ---
function handleDuckSpawn(messageData) {
    // Die tatsächliche Nutzlast ist das dritte Element im 'payload'-Array
    const eventPayload = messageData.payload[2]; 

    // Prüfen, ob es sich um ein Multiple-Duck-Hunt-Event handelt und 'children' vorhanden sind
    if (eventPayload && eventPayload.type === 'multiple_duck_hunt' && Array.isArray(eventPayload.children)) {
        
        let foundDucks = false;
        
        // Durchlaufe alle potenziellen Enten und starte den Abschuss parallel
        eventPayload.children.forEach(child => {
            if (child.type === 'duck_hunt' && child.hash) {
                console.log(`[DUCK HUNTER] 🦆 Ente gesichtet! Hash: ${child.hash}. Starte Abschuss...`);
                shootDuck(child.hash); // Abschuss starten (wird parallel ausgeführt)
                foundDucks = true;
            }
        });
        
        if (foundDucks) {
            console.log(`[DUCK HUNTER] Automatischer Abschuss von ${eventPayload.children.length} Enten gestartet.`);
        }
    }
}

// --- 3. WebSocket Hooking (Abfangen des Datenverkehrs) ---
(function() {
    console.log("[DUCK HUNTER] Skript geladen. Hooke WebSocket-Verbindung...");

    // Speichere die Original-WebSocket-Klasse
    const OriginalWebSocket = window.WebSocket;

    // Überschreibe die globale WebSocket-Klasse
    window.WebSocket = function(url, protocols) {
        // Erzeuge die tatsächliche WebSocket-Instanz
        const ws = new OriginalWebSocket(url, protocols);
        
        // Lausche auf eingehende Nachrichten
        ws.addEventListener('message', function(event) {
            try {
                const message = JSON.parse(event.data);
                
                // Prüfen, ob es sich um ein Pusher-Event und den richtigen Kanal handelt
                if (message.type === 'event' && 
                    message.channel === 'Production.Common' && 
                    message.payload && Array.isArray(message.payload) && 
                    message.payload[0] === DUCK_SPAWN_EVENT) {
                    
                    // Verarbeite den Duck Spawn Event
                    handleDuckSpawn(message);
                }
            } catch (e) {
                // Ignoriere Fehler beim Parsen (z.B. bei Pings oder nicht-JSON Nachrichten)
            }
        });
        return ws;
    };
})();