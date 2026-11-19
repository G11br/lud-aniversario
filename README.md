# Site de aniversário da Lud (21)

Três abas: **Confirmar presença**, **Lista de presentes** e **Playlist**.
É um site estático (HTML/CSS/JS), sem servidor próprio.

- **Confirmação de presença:** o convidado preenche o formulário e o WhatsApp abre com a mensagem pronta para o número em `config.js` (`WHATSAPP`). É só ele tocar em enviar.
- **Presentes:** sem planilha, quem escolhe um item avisa pelo WhatsApp (os outros convidados não veem o que já foi escolhido). Com a planilha opcional do passo 2, os itens escolhidos aparecem como "Já escolhido" para todo mundo.
- **Playlist:** link e player do Spotify (`SPOTIFY_URL`).

```
index.html        página
styles.css        visual
app.js            lógica das abas, formulário e lista
config.js         ← EDITE AQUI: data, endereço, link do Spotify, URL da planilha
gifts.js          ← EDITE AQUI: itens da lista de presentes
apps-script/Code.gs   código para colar no Google Apps Script
assets/convite.jpg    imagem do convite
```

## 1. Testar no computador

```bash
python3 -m http.server 8080
```

Abra http://localhost:8080.

## 2. (Opcional) Planilha do Google para os presentes

1. Crie uma planilha nova em https://sheets.new (ex.: "Aniversário Lud 21").
2. Menu **Extensões › Apps Script**.
3. Apague o conteúdo e cole todo o arquivo `apps-script/Code.gs`. Salve.
4. Clique em **Implantar › Nova implantação**.
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
5. Autorize com sua conta Google. Se aparecer "o Google não verificou este app", clique em **Avançado › Acessar (não seguro)**: o app é seu.
6. Copie a **URL do app da Web** (termina em `/exec`) e cole em `config.js`:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec"
   ```

A planilha cria sozinha a aba:
- **Presentes**: qual item, quem vai dar e se está *Reservado* ou *Cancelado*. Os convidados veem só "Já escolhido", nunca o nome de quem escolheu.

> Mudou o `Code.gs`? Use **Implantar › Gerenciar implantações › editar › Nova versão** para a URL continuar a mesma.

## 3. Playlist do Spotify

No Spotify, abra a playlist › **⋯** › **Convidar colaboradores** (ou "Tornar colaborativa") › copie o link e cole em `config.js`:

```js
SPOTIFY_URL: "https://open.spotify.com/playlist/..."
```

O site mostra o botão e o player da playlist.

## 4. Publicar (grátis)

Qualquer hospedagem estática serve. O jeito mais rápido:

- **Netlify Drop**: entre em https://app.netlify.com/drop e arraste a pasta inteira. Pronto, sai um link.
- Ou **Vercel** / **GitHub Pages**.

Os links diretos para cada aba também funcionam: `.../#presenca`, `.../#presentes`, `.../#playlist`.

## Editar a lista de presentes

Em `gifts.js`, cada item pode ter `multi: true` (várias pessoas podem dar, como livros ou maquiagem). Sem `multi`, o item aparece como "Já escolhido" depois que alguém reserva.
Não mude o nome de um item que já foi reservado: a reserva fica ligada ao nome.
