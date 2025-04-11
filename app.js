const db = firebase.database();
const auth = firebase.auth();
const chatBox = document.getElementById("chat-box");
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message");
const toggleTheme = document.getElementById("toggleTheme");
const logoutBtn = document.getElementById("logoutBtn");
const typingStatus = document.getElementById("typingStatus");

let currentUser;
let typingRef;

toggleTheme.addEventListener("click", () => {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.body.classList.toggle("bg-white", !isDark);
  document.body.classList.toggle("text-black", !isDark);
  document.body.classList.toggle("bg-gray-900", isDark);
  document.body.classList.toggle("text-white", isDark);
});

logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => location.reload());
});

// Emoji Picker
const picker = new EmojiButton();
document.getElementById('emojiBtn').addEventListener('click', () => {
  picker.togglePicker(messageInput);
});
picker.on('emoji', emoji => {
  messageInput.value += emoji;
});

// Auth
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    typingRef = db.ref("typing/" + user.uid);
    listenToMessages();
    listenToTyping();
  } else {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    auth.signInWithEmailAndPassword(email, password)
      .catch(() => {
        if (confirm("User not found. Register?")) {
          auth.createUserWithEmailAndPassword(email, password);
        }
      });
  }
});

// Send message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  const name = currentUser?.email?.split("@")[0] || "Anonymous";
  const timestamp = Date.now();

  if (text) {
    db.ref("messages").push({ name, text, timestamp });
    messageInput.value = "";
    typingRef.remove();
  }
});

// Typing indicator
messageInput.addEventListener("input", () => {
  typingRef.set(true);
  clearTimeout(typingRef.timeout);
  typingRef.timeout = setTimeout(() => typingRef.remove(), 1000);
});

function listenToTyping() {
  db.ref("typing").on("value", (snapshot) => {
    let isSomeoneTyping = false;
    snapshot.forEach(child => {
      if (child.key !== currentUser.uid) isSomeoneTyping = true;
    });
    typingStatus.classList.toggle("hidden", !isSomeoneTyping);
  });
}

// Load and display messages
function listenToMessages() {
  db.ref("messages").orderByChild("timestamp").on("child_added", (snapshot) => {
    const msg = snapshot.val();
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const msgEl = document.createElement("div");
    msgEl.innerHTML = `
      <div class="bg-gray-800 p-3 rounded shadow-md w-fit max-w-xs break-words">
        <p class="text-sm font-semibold text-indigo-400">${msg.name} <span class="text-gray-400 text-xs">${time}</span></p>
        <p class="text-base">${msg.text}</p>
      </div>
    `;
    chatBox.appendChild(msgEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
