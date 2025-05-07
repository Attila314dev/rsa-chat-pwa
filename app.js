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

  // Üzenet titkosítása
  const encoder = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    keyPair.publicKey,
    encoder.encode(message)
  );

  // Üzenet visszafejtése
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    keyPair.privateKey,
    encrypted
  );

  const decoder = new TextDecoder();
  document.getElementById('output').textContent = decoder.decode(decrypted);
});
