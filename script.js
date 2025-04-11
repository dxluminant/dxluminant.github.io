window.onload = () => {
  loadMessagesFromJSON();
};

function loadMessagesFromJSON() {
  fetch('chat.json')
    .then(response => response.json())
    .then(messages => {
      const chatBox = document.getElementById("chatBox");
      chatBox.innerHTML = "";

      messages.forEach(msg => {
        const messageDiv = document.createElement("div");
        messageDiv.className = "chat-message";
        messageDiv.innerHTML = `<span>${msg.user}</span>: ${msg.text} <small style="float:right; color:#999;">${msg.time}</small>`;
        chatBox.appendChild(messageDiv);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    })
    .catch(error => {
      console.error("Error loading chat.json:", error);
    });
}
