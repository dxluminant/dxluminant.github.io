// Load messages from localStorage
window.onload = () => {
  loadMessages();
};

function sendMessage() {
  const username = document.getElementById("username").value.trim();
  const message = document.getElementById("messageInput").value.trim();

  if (!username || !message) return;

  const msg = {
    user: username,
    text: message,
    time: new Date().toLocaleTimeString()
  };

  let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
  messages.push(msg);
  localStorage.setItem("chatMessages", JSON.stringify(messages));

  document.getElementById("messageInput").value = "";
  loadMessages();
}

function loadMessages() {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = "";

  const messages = JSON.parse(localStorage.getItem("chatMessages")) || [];
  messages.forEach(msg => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message";
    messageDiv.innerHTML = `<span>${msg.user}</span>: ${msg.text} <small style="float:right; color:#999;">${msg.time}</small>`;
    chatBox.appendChild(messageDiv);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}
