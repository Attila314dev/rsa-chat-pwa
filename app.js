let socket;
let myPrivateKey;

window.addEventListener('load', () => {
  socket = new WebSocket('wss://rsa-chat-server.onrender.com');

  socket.addEventListener('open', () => {
    console.log('Kapcsolódva a WebSocket szerverhez');
  });

  socket.addEventListener('message', async event => {
    const data = JSON.parse(event.data);
    const encrypted = base64ToArrayBuffer(data.encrypted);

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        myPrivateKey,
        encrypted
      );

      const decoder = new TextDecoder();
      const plain = decoder.decode(decrypted);
      document.getElementById('output').textContent = plain;
    } catch (err) {
      console.error("Visszafejtés sikertelen:", err);
    }
  });
});

document.getElementById('sendButton').addEventListener('click', async () => {
  const message = document.getElementById('messageInput').value;
  if (message.length > 120) {
    alert('Az üzenet legfeljebb 120 karakter lehet.');
    return;
  }

  // RSA kulcspár generálása
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  myPrivateKey = keyPair.privateKey;

  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    keyPair.publicKey,
    encoder.encode(message)
  );

  const base64 = arrayBufferToBase64(encrypted);
  const payload = JSON.stringify({ encrypted: base64 });
if (socket.readyState !== WebSocket.OPEN) {
  alert("A kapcsolat még nem állt fel. Várj egy kicsit, vagy frissítsd az oldalt.");
  return;
}

  socket.send(payload);
  console.log("Elküldve:", payload);
});

// Base64 konverzió segédfüggvények
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
