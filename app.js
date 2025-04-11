// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAHYQfAjso2xwPSdGzB1OOXOUPPP0E7V8Y",
  authDomain: "chat-ed3c7.firebaseapp.com",
  databaseURL: "https://chat-ed3c7-default-rtdb.firebaseio.com/",
  projectId: "chat-ed3c7",
  storageBucket: "chat-ed3c7.appspot.com",
  messagingSenderId: "475164731524",
  appId: "1:475164731524:web:30d09b4d069f03afee7ad1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message");
const toggleTheme = document.getElementById("toggleTheme");
const logoutBtn = document.getElementById("logoutBtn");
const typingStatus = document.getElementById("typingStatus");
const fileInput = document.getElementById("fileInput");
const giphyResults = document.getElementById("giphyResults");
const emojiBtn = document.getElementById("emojiBtn");

let currentUser;
let typingRef = null;

// Theme toggle
toggleTheme.addEventListener("click", () => {
  const html = document.documentElement;
  html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => location.reload());
});

// Emoji picker
const picker = new EmojiButton();
emojiBtn.addEventListener("click", () => {
  picker.togglePicker(messageInput);
});
picker.on("emoji", emoji => {
  messageInput.value += emoji;
});

// Auth
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    startChat();
  } else {
    const email = prompt("Enter email:");
    const password = prompt("Enter password:");
    auth.signInWithEmailAndPassword(email, password)
      .catch(() => auth.createUserWithEmailAndPassword(email, password));
  }
});

// Typing indicator
messageInput.addEventListener("input", () => {
  if (!typingRef) {
    typingRef = db.ref("typing/" + currentUser.uid);
    typingRef.set(currentUser.email);
    typingRef.onDisconnect().remove();
    setTimeout(() => typingRef.remove(), 3000);
  }
});

// Listen to typing
db.ref("typing").on("value", snap => {
  const typingUsers = snap.val();
  if (typingUsers && Object.keys(typingUsers).some(id => id !== currentUser.uid)) {
    typingStatus.classList.remove("hidden");
  } else {
    typingStatus.classList.add("hidden");
  }
});

// Send message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const name = currentUser.email.split("@")[0];
  const timestamp = Date.now();

  if (text) {
    db.ref("messages").push({ name, text, timestamp });
  }

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const ref = storage.ref(`uploads/${Date.now()}-${file.name}`);
    const snap = await ref.put(file);
    const url = await snap.ref.getDownloadURL();
    db.ref("messages").push({ name, fileUrl: url, fileName: file.name, timestamp });
    fileInput.value = "";
  }

  messageInput.value = "";
  if (typingRef) typingRef.remove();
});

// Listen to messages
function startChat() {
  db.ref("messages").orderByChild("timestamp").on("child_added", snap => {
    const msg = snap.val();
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const div = document.createElement("div");

    let html = `<p class="text-sm font-semibold text-indigo-400">${msg.name} <span class="text-gray-400 text-xs">${time}</span></p>`;
    if (msg.text) html += `<p>${msg.text}</p>`;
    if (msg.fileUrl) {
      if (msg.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i)) {
        html += `<img src="${msg.fileUrl}" class="max-w-xs rounded" />`;
      } else {
        html += `<a href="${msg.fileUrl}" class="text-blue-400 underline" target="_blank">${msg.fileName}</a>`;
      }
    }

    div.innerHTML = `<div class="bg-gray-800 p-3 rounded shadow-md w-fit max-w-xs break-words">${html}</div>`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// GIPHY Search
messageInput.addEventListener("input", () => {
  const query = messageInput.value.trim();
  if (!query) return giphyResults.innerHTML = "";

  fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${query}&limit=6`)
    .then(res => res.json())
    .then(data => {
      giphyResults.innerHTML = "";
      data.data.forEach(gif => {
        const img = document.createElement("img");
        img.src = gif.images.fixed_height_small.url;
        img.className = "w-16 h-16 cursor-pointer hover:scale-110 transition";
        img.onclick = () => {
          db.ref("messages").push({
            name: currentUser.email.split("@")[0],
            fileUrl: gif.images.original.url,
            timestamp: Date.now()
          });
        };
        giphyResults.appendChild(img);
      });
    });
});
