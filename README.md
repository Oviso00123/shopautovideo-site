# ShopAutoVideo – Valore dello Shop

Sito statico per generare video del "Valore dello Shop" di Fortnite, con script AI e montaggio nel browser.

## Cosa fa

1. Scarica lo shop di oggi da fortnite-api.com.
2. Calcola un punteggio da 0 a 10 per ogni item/bundle.
3. Genera il parlato con Gemini (tramite Netlify Function).
4. Genera la voce con Gemini TTS (o Web Speech di riserva).
5. Monta il video nel browser (Canvas + MediaRecorder).
6. Mostra anteprima, miniatura e testi da copiare per YouTube.

## Pubblicazione su Netlify

### Metodo 1: GitHub + Netlify (consigliato)

1. Crea un repository GitHub e carica questa cartella.
2. Vai su https://app.netlify.com/ , accedi e clicca "Add new site" > "Import an existing project".
3. Collega GitHub e seleziona il repository.
4. Netlify rilevera' automaticamente le impostazioni. Lascia:
   - Build command: (vuoto)
   - Publish directory: . (la radice)
5. Clicca "Deploy site".

### Metodo 2: Netlify CLI

    npm install -g netlify-cli
    netlify login
    netlify init
    netlify deploy --prod

Scegli la cartella corrente come publish directory e `netlify/functions` come functions directory.

## Variabili d'ambiente (OBBLIGATORIO)

Su Netlify: **Site settings > Environment variables > Add a variable**

| Nome | Valore | Note |
|------|--------|------|
| `GEMINI_API_KEY` | La tua chiave API di Google Gemini | Ottienila su https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Opzionale, modello per lo script |
| `GEMINI_TTS_MODEL` | `gemini-2.5-flash-preview-tts` | Opzionale, modello per la voce |

Dopo aver aggiunto le variabili, fai un nuovo deploy.

## Aprire il sito dal telefono

Dopo il deploy, Netlify ti da' un URL tipo `https://tuo-sito.netlify.app`. Aprilo dal browser del telefono (Chrome Android o Safari iOS). Il sito e' responsive e i bottoni sono grandi.

## Cose da fare a mano

1. **Chiave Gemini su Netlify**: inserisci `GEMINI_API_KEY` nelle variabili d'ambiente.
2. **Logo**: carica un'immagine PNG/JPG nelle Impostazioni del sito (sezione "File personalizzati").
3. **Musica**: carica un file MP3/WAV nelle Impostazioni (sezione "File personalizzati").

## Limiti noti

- **Tempo di rendering sul telefono**: il montaggio video avviene interamente nel browser. Su telefoni meno potenti puo' richiedere 1-3 minuti per un video di 60 secondi.
- **Formato del file**: il browser esporta WebM (VP9/VP8 + Opus) di default. Se supporta MP4 (H.264 + AAC), il file sara' MP4. La compatibilita' dipende dal browser.
- **Voce di riserva**: se Gemini TTS fallisce, il sito usa la Web Speech API del browser. In quel caso il video registrato non conterra' la voce (solo eventuale musica), perche' la Web Speech non puo' essere catturata in un MediaStream.

## Licenze e attribuzioni

- Dati shop: https://fortnite-api.com/ .
- Bottoni glass: pattern ispirati a https://uiverse.io/elements?search=glass+button . Se sostituisci con elementi specifici, mantieni l'attribuzione all'autore (licenza MIT).
- Questo progetto e' fornito cosi' com'e', senza garanzie.
