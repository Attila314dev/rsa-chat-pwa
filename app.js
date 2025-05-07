const visuallySimilar = ['i', 'l', '1', 'o', '0', 'O'];
const roomMembers = []; // Lokálisan nyilvántartott nevek (ez a kliens tudja csak)

document.getElementById('joinBtn').addEventListener('click', async () => {
  const roomId = document.getElementById('roomId').value.trim();
  const roomPass = document.getElementById('roomPass').value.trim();
  const nickname = document.getElementById('nickname').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  // Alap validációk
  if (roomId.length !== 9 || !/^[a-z0-9]+$/.test(roomId)) {
    return showError("Érvénytelen szobaazonosító (9 kisbetű/szám)");
  }

  if (roomPass.length < 4) {
    return showError("A jelszó túl rövid");
  }

  if (nickname.length < 3 || nickname.length > 9) {
    return showError("A név 3-9 karakter között lehet");
  }

  // Névütközés és vizuális hasonlóság ellenőrzés
  const simplified = simplify(nickname);
  const conflict = roomMembers.find(name => simplify(name) === simplified);
  if (conflict) {
    return showError(`Ez a név (vagy hasonló) már foglalt: ${conflict}`);
  }

  // Elfogadott név
  roomMembers.push(nickname);

  // Kulcspár generálás
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

  window.myPrivateKey = keyPair.privateKey;
  window.myPublicKey = keyPair.publicKey;
  window.myNickname = nickname;
  window.myRoom = roomId;

  // Tovább a chathez
  document.getElementById('login').style.display = 'none';
  document.getElementById('chat').style.display = 'block';
  document.getElementById('roomLabel').textContent = `Szoba: ${roomId}, Név: ${nickname}`;
  errorMsg.textContent = '';
});

function simplify(name) {
  return name.toLowerCase().replace(/[ilo0]/g, '*');
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
}
