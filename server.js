/**
 * Memes 4EVER!! — Real-time Server
 * MIT License — Copyright (c) 2026 Memes 4EVER contributors
 *
 * Stack: Node.js · Express · Socket.IO · JSON file storage
 * Run:   npm install && node server.js
 * Then open: http://localhost:3000
 */

const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const crypto   = require('crypto');
const fs       = require('fs');
const path     = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── DATA LAYER (flat JSON files) ─────────────────
const DATA = path.join(__dirname, 'data');
if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

function read(name) {
  const f = path.join(DATA, name + '.json');
  if (!fs.existsSync(f)) return {};
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; }
}
function write(name, data) {
  fs.writeFileSync(path.join(DATA, name + '.json'), JSON.stringify(data, null, 2));
}

// ── HELPERS ──────────────────────────────────────
const hashPw  = pw  => crypto.createHash('sha256').update(pw + 'M4EVER_SALT_2026').digest('hex');
const genTok  = ()  => crypto.randomBytes(32).toString('hex');
const convKey = (a, b) => [a, b].sort().join('|'); // pipe is safe — not in [a-z0-9_]

function getFriendList(un) {
  const friendships = read('friendships');
  return Object.keys(friendships)
    .filter(k => k.startsWith(un + '|') || k.endsWith('|' + un))
    .map(k => k.split('|').find(u => u !== un))
    .filter(Boolean);
}

// ── ONLINE PRESENCE ───────────────────────────────
const online = new Map(); // username → socketId

// ── STATIC FILES ─────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// Simple health check
app.get('/health', (_, res) => res.json({ ok: true, users: Object.keys(read('users')).length }));

// ── SOCKET.IO ────────────────────────────────────
io.on('connection', socket => {
  let me = null; // currently authenticated username for this socket

  // ── REGISTER ─────────────────────────────────
  socket.on('register', ({ username, password, display, color }, cb) => {
    const users = read('users');
    const un = (username || '').toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(un))
      return cb({ error: 'Username: 3–20 chars, letters/numbers/_ only' });
    if ((password || '').length < 4)
      return cb({ error: 'Password must be at least 4 characters' });
    if (users[un])
      return cb({ error: 'Username already taken!' });
    const tok = genTok();
    users[un] = {
      username: un,
      display:  (display || un).slice(0, 30),
      color:    color || '#f72585',
      hash:     hashPw(password),
      token:    tok,
      joined:   Date.now()
    };
    write('users', users);
    me = un;
    online.set(un, socket.id);
    socket.join('u:' + un);
    cb({ ok: true, token: tok, user: { username: un, display: users[un].display, color: users[un].color, joined: users[un].joined } });
    socket.broadcast.emit('presence', { username: un, online: true });
  });

  // ── LOGIN ────────────────────────────────────
  socket.on('login', ({ username, password, token: tok }, cb) => {
    const users = read('users');
    let user;
    if (tok) {
      user = Object.values(users).find(u => u.token === tok);
    } else {
      const un = (username || '').toLowerCase().trim();
      user = users[un];
      if (!user || user.hash !== hashPw(password || ''))
        return cb({ error: 'Wrong username or password' });
    }
    if (!user) return cb({ error: 'Session expired — please log in again' });

    me = user.username;
    online.set(user.username, socket.id);
    socket.join('u:' + user.username);

    // Pending requests
    const reqs = read('requests');
    const pending = Object.values(reqs)
      .filter(r => r.to === user.username && r.status === 'pending')
      .map(r => ({
        ...r,
        fromDisplay: users[r.from]?.display || r.from,
        fromColor:   users[r.from]?.color   || '#f72585'
      }));

    // Friends list
    const friendNames = getFriendList(user.username);
    const friends = friendNames.map(un => {
      const u = users[un];
      return u ? { username: u.username, display: u.display, color: u.color, online: online.has(un) } : null;
    }).filter(Boolean);

    cb({ ok: true, token: user.token,
         user: { username: user.username, display: user.display, color: user.color, joined: user.joined },
         pendingRequests: pending, friends });

    // Notify friends I'm online
    friendNames.forEach(fn => {
      if (online.has(fn)) io.to('u:' + fn).emit('presence', { username: user.username, online: true });
    });
  });

  // ── SEARCH USERS ─────────────────────────────
  socket.on('search_users', ({ query }, cb) => {
    const users = read('users');
    const q = (query || '').toLowerCase().trim();
    if (!q) return cb({ users: [] });
    const results = Object.values(users)
      .filter(u => u.username !== me &&
        (u.username.includes(q) || u.display.toLowerCase().includes(q)))
      .slice(0, 8)
      .map(u => ({ username: u.username, display: u.display, color: u.color, online: online.has(u.username) }));
    cb({ users: results });
  });

  // ── FRIEND REQUEST ────────────────────────────
  socket.on('friend_request', ({ to }, cb) => {
    if (!me) return cb({ error: 'Not logged in' });
    if (to === me) return cb({ error: "You can't add yourself!" });
    const users = read('users');
    if (!users[to]) return cb({ error: 'User not found' });

    const friendships = read('friendships');
    const key = convKey(me, to);
    if (friendships[key]) return cb({ error: 'Already friends!' });

    const reqs = read('requests');

    // If they already sent us one → auto-accept both
    const theirReq = Object.values(reqs).find(r => r.from === to && r.to === me && r.status === 'pending');
    if (theirReq) {
      doAccept(me, to, reqs, friendships, key);
      cb({ ok: true, autoAccepted: true, friend: { username: to, display: users[to].display, color: users[to].color, online: online.has(to) } });
      if (online.has(to)) {
        io.to('u:' + to).emit('friend_accepted', { username: me, display: users[me]?.display, color: users[me]?.color, online: true });
      }
      return;
    }

    // Already sent?
    if (Object.values(reqs).some(r => r.from === me && r.to === to && r.status === 'pending'))
      return cb({ error: 'Request already sent!' });

    const reqId = Date.now().toString(36);
    reqs[reqId] = { id: reqId, from: me, to, status: 'pending', ts: Date.now() };
    write('requests', reqs);
    cb({ ok: true });

    if (online.has(to)) {
      io.to('u:' + to).emit('friend_request_received', {
        from: me, fromDisplay: users[me]?.display, fromColor: users[me]?.color, ts: Date.now()
      });
    }
  });

  socket.on('accept_friend', ({ from }, cb) => {
    if (!me) return cb({ error: 'Not logged in' });
    const reqs         = read('requests');
    const friendships  = read('friendships');
    const users        = read('users');
    const key          = convKey(me, from);
    doAccept(me, from, reqs, friendships, key);
    const friend = { username: from, display: users[from]?.display || from, color: users[from]?.color || '#f72585', online: online.has(from) };
    cb({ ok: true, friend });
    if (online.has(from)) {
      io.to('u:' + from).emit('friend_accepted', { username: me, display: users[me]?.display, color: users[me]?.color, online: true });
    }
  });

  socket.on('decline_friend', ({ from }, cb) => {
    if (!me) return cb({ ok: false });
    const reqs = read('requests');
    Object.keys(reqs).forEach(k => {
      if (reqs[k].from === from && reqs[k].to === me) delete reqs[k];
    });
    write('requests', reqs);
    cb({ ok: true });
  });

  socket.on('remove_friend', ({ username }, cb) => {
    if (!me) return cb({ ok: false });
    const friendships = read('friendships');
    delete friendships[convKey(me, username)];
    write('friendships', friendships);
    cb({ ok: true });
    if (online.has(username)) {
      io.to('u:' + username).emit('friend_removed', { username: me });
    }
  });

  socket.on('get_pending_requests', (_, cb) => {
    if (!me) return cb({ requests: [] });
    const reqs  = read('requests');
    const users = read('users');
    cb({ requests: Object.values(reqs)
      .filter(r => r.to === me && r.status === 'pending')
      .map(r => ({ ...r, fromDisplay: users[r.from]?.display || r.from, fromColor: users[r.from]?.color || '#f72585' }))
    });
  });

  // ── MESSAGES ──────────────────────────────────
  socket.on('get_messages', ({ with: withUser }, cb) => {
    if (!me) return cb({ messages: [] });
    const msgs = read('msgs');
    const key  = convKey(me, withUser);
    const conv = msgs[key] || [];
    cb({ messages: conv });
    // Mark messages to me as read
    if (conv.some(m => m.to === me && !m.read)) {
      msgs[key] = conv.map(m => m.to === me ? { ...m, read: true } : m);
      write('msgs', msgs);
    }
  });

  socket.on('send_message', ({ to, text, meme }, cb) => {
    if (!me) return cb({ error: 'Not logged in' });
    const users = read('users');
    const msg = {
      id:          Date.now().toString(36) + Math.random().toString(36).slice(2),
      from:        me,
      fromDisplay: users[me]?.display || me,
      to,
      text:        text  || null,
      meme:        meme  || null,
      type:        meme  ? 'meme' : 'text',
      ts:          Date.now(),
      read:        false
    };
    const msgs = read('msgs');
    const key  = convKey(me, to);
    if (!msgs[key]) msgs[key] = [];
    msgs[key].push(msg);
    if (msgs[key].length > 500) msgs[key] = msgs[key].slice(-500);
    write('msgs', msgs);
    cb({ ok: true, msg });

    // Deliver in real time if recipient is online
    if (online.has(to)) {
      io.to('u:' + to).emit('new_message', { msg });
    } else {
      // Simulate auto-reply for offline users
      const REPLIES = meme
        ? ['omg 😂', 'sending this everywhere', '💀💀', 'I needed this today', 'ok this got me lmao']
        : ['😂😂😂', 'lmaooo', 'DEAD 💀💀', 'literally me', 'top tier 🔥', 'omg I can\'t 😭', 'no way 😂', 'sending to the gc'];
      setTimeout(() => {
        const reply = {
          id:          Date.now().toString(36) + Math.random().toString(36).slice(2),
          from:        to,
          fromDisplay: users[to]?.display || to,
          to:          me,
          text:        REPLIES[Math.floor(Math.random() * REPLIES.length)],
          type:        'text',
          ts:          Date.now(),
          read:        false
        };
        const msgs2 = read('msgs');
        if (!msgs2[key]) msgs2[key] = [];
        msgs2[key].push(reply);
        write('msgs', msgs2);
        if (online.has(me)) io.to('u:' + me).emit('new_message', { msg: reply });
      }, 1500 + Math.random() * 2000);
    }
  });

  socket.on('typing', ({ to }) => {
    if (me && online.has(to)) io.to('u:' + to).emit('typing', { from: me });
  });

  // ── DELETE ACCOUNT ────────────────────────────
  socket.on('delete_account', ({ password }, cb) => {
    if (!me) return cb({ error: 'Not logged in' });
    const users = read('users');
    if (!users[me] || users[me].hash !== hashPw(password || ''))
      return cb({ error: 'Wrong password' });

    const myFriends = getFriendList(me);

    delete users[me];
    write('users', users);

    const friendships = read('friendships');
    Object.keys(friendships).forEach(k => { if (k.includes(me)) delete friendships[k]; });
    write('friendships', friendships);

    const reqs = read('requests');
    Object.keys(reqs).forEach(k => { if (reqs[k].from === me || reqs[k].to === me) delete reqs[k]; });
    write('requests', reqs);

    myFriends.forEach(fn => {
      if (online.has(fn)) io.to('u:' + fn).emit('friend_removed', { username: me });
    });
    online.delete(me);
    me = null;
    cb({ ok: true });
  });

  // ── DISCONNECT ────────────────────────────────
  socket.on('disconnect', () => {
    if (me) {
      getFriendList(me).forEach(fn => {
        if (online.has(fn)) io.to('u:' + fn).emit('presence', { username: me, online: false });
      });
      online.delete(me);
      me = null;
    }
  });

  // ── INTERNAL HELPERS ──────────────────────────
  function doAccept(user1, user2, reqs, friendships, key) {
    // Mark all matching requests as accepted
    Object.keys(reqs).forEach(k => {
      const r = reqs[k];
      if ((r.from === user2 && r.to === user1) || (r.from === user1 && r.to === user2))
        r.status = 'accepted';
    });
    write('requests', reqs);
    friendships[key] = { users: [user1, user2], since: Date.now() };
    write('friendships', friendships);
  }
});

// ── START ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀  Memes 4EVER server running`);
  console.log(`    → http://localhost:${PORT}\n`);
});
