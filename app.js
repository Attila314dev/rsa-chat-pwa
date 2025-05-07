const visuallySimilar = ['i', 'l', '1', 'o', '0', 'O'];
const roomMembers = [];
let myPrivateKey, myPublicKey, myNickname, myRoom, isAdmin = false;

// Segédfüggvények
function simplify(name) {
  return name.toLowerCase().replace(/[ilo0]/g, '*');
}
function showError(id, msg) {
  document.getElementById(id).textContent = msg;
}

// Véletlen szoba-ID generátor
function generateRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 9; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

// Nézetváltók
document.getElementById('createBtn').addEventListener('click', () => {
  const id = generateRoomId();
  myRoom = id;
  document.getElementById('generatedRoomId').textContent = id;
  document.getElementById('modeSelect').style.display = 'none';
  document.getElementById('createView').style.display = 'block';
});

document.getElementById('joinBtn').addEventListener('click', () => {
  document.getElementById('modeSelect').style.display = 'none';
  document.getElementById('joinView').style.display = 'block';
});

// Létrehozás megerősítése
document.getElementById('createConfirm').addEventListener('click', async () => {
  const pass = document.getElementById('createPass').value.trim();
  const nick = document.getElementById('createNick').value.trim();

  if (pass.length < 4) return showError('createError', 'Jelszó túl rövid');
  if (!validNick(nick, roomMembers)) return;

  await enterRoom(nick, myRoom, true);
});

// Csatlakozás megerősítése
document.getElementById('joinConfirm').addEventListener('click', async () => {
  const roomId = document.getElementById('joinRoomId').value.trim();
  const pass = document.getElementById('joinPass').value.trim();
  const nick = document.getElementById('joinNick').value.trim();

  if (roomId.length !== 9 || !/^[a-z0-9]+$/.test(roomId)) {
    return showError('joinError', 'Érvénytelen szobaazonosító');
  }
  if (pass.length < 4) return showError('joinError', 'Jelszó túl rövid');
  if (!validNick(nick, roomMembers)) return;

  myRoom = roomId;
  await enterRoom(nick, myRoom, false);
});

// Névellenőrzés
function validNick(nick, members) {
  const simp = simplify(nick);
  const conflict = members.find(name => simplify(name) === simp);
  if (nick.length < 3 || nick.length > 9) {
    showError('createError', 'Név 3–9 karakter legyen');
    return false;
  }
  if (conflict) {
    showError('createError', `Hasonló név már van: ${conflict}`);
    return false;
  }
  return true;
}

// Belépés szobába (mindkét irányból hívható)
async function enterRoom(nick, roomId, adminFlag) {
  myNickname = nick;
  isAdmin = adminFlag;
  roomMembers.push(nick);

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  myPrivateKey = keyPair.privateKey;
  myPublicKey = keyPair.publicKey;

  document.getElementById('createView').style.display = 'none';
  document.getElementById('joinView').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
  document.getElementById('roomLabel').textContent = `Szoba: ${roomId} | Név: ${nick} | ${isAdmin ? 'ADMIN' : ''}`;
}
