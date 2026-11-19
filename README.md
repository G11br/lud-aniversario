# Site de aniversário da Lud (21)

Duas abas: **Confirmar presença** e **Playlist**.
É um site estático (HTML/CSS/JS), sem servidor próprio.

- **Confirmação de presença:** o convidado preenche o formulário e o WhatsApp abre com a mensagem pronta para o número em `config.js` (`WHATSAPP`). É só ele tocar em enviar.
- **Playlist:** link e player do Spotify (`SPOTIFY_URL`).

```
index.html        página
styles.css        visual
app.js            lógica das abas, formulário e lista
config.js         ← EDITE AQUI: data, endereço, WhatsApp, link do Spotify
assets/convite.jpg    imagem do convite
```

## 1. Testar no computador

```bash
python3 -m http.server 8080
```

Abra http://localhost:8080.

## 2. Playlist do Spotify

No Spotify, abra a playlist › **⋯** › **Convidar colaboradores** (ou "Tornar colaborativa") › copie o link e cole em `config.js`:

```js
SPOTIFY_URL: "https://open.spotify.com/playlist/..."
```

O site mostra o botão e o player da playlist.

## 3. Publicar (grátis)

Qualquer hospedagem estática serve. O jeito mais rápido:

- **Netlify Drop**: entre em https://app.netlify.com/drop e arraste a pasta inteira. Pronto, sai um link.
- Ou **Vercel** / **GitHub Pages**.

Os links diretos para cada aba também funcionam: `.../#presenca`, `.../#playlist`.
