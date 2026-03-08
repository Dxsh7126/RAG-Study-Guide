// PULL MEMORY FROM HARD DRIVE (or start empty if first time)
let chatHistory = JSON.parse(localStorage.getItem("os2202_memory")) || [];

// RESTORE CHAT ON PAGE LOAD
window.onload = function() {
    chatHistory.forEach(msg => {
        let sender = msg.role === "assistant" ? "ai" : "user";
        appendMessage(sender, msg.content);
    });
};

// --- THE DOM ENGINE ---
function appendMessage(sender, text) {
    const chatContainer = document.getElementById("chatContainer");
    const messageDiv = document.createElement("div");

    if (sender === "user") {
        messageDiv.className = "message user-message";
        messageDiv.innerText = text;
    } else {
        messageDiv.className = "message ai-message";

        let htmlContent = marked.parse(text);
        if(sources.length>0){
            htmlContent += `<div class="source-list"><hr><b>Sources:</b> <ul>`;
            sources.forEach(src=> {htmlContent += `<li> ${src}</li>`;});
            htmlContent += `<ul></div>`;
        }
        messageDiv.innerHTML = htmlContent;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- THE KEYBOARD CONTROLS ---
document.getElementById("userQuestion").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); 
        document.getElementById("submitBtn").click(); 
    } else if (event.key === "Escape") {
        this.value = ""; 
    }
});

// --- THE CLEAR BUTTON ---
document.getElementById("clearBtn").addEventListener("click", function() {
    localStorage.removeItem("os2202_memory"); // Delete from hard drive
    chatHistory = []; // Delete from RAM
    document.getElementById("chatContainer").innerHTML = ""; // Wipe the screen
    appendMessage("ai", "Memory cleared! What do you want to study today?");
});

// --- THE NETWORK REQUEST ---
document.getElementById("submitBtn").addEventListener("click", async function() {
    const inputBox = document.getElementById("userQuestion");
    const userText = inputBox.value;

    if (userText.trim() === "") return; 
    
    appendMessage("user", userText);
    inputBox.value = "";

    const chatContainer = document.getElementById("chatContainer");
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "message ai-message";
    loadingDiv.id = "loadingBubble"; 
    loadingDiv.innerText = "Thinking...";
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const targetCourse = document.getElementById("courseSelect").value;
        const response = await fetch("http://127.0.0.1:5001/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                "question": userText, 
                "course": targetCourse,
                "history": chatHistory
            })
        });

        const data = await response.json();
        
        document.getElementById("loadingBubble").remove();
        appendMessage("ai", data.answer);

        // Update Memory Array
        chatHistory.push({"role": "user", "content": userText});
        chatHistory.push({"role": "assistant", "content": data.answer});

        // SAVE TO HARD DRIVE
        localStorage.setItem("os2202_memory", JSON.stringify(chatHistory));

    } catch (error) {
        if (document.getElementById("loadingBubble")) {
            document.getElementById("loadingBubble").remove();
        }
        appendMessage("ai", "**Error:** Could not connect to the Python server.");
        console.error("THE ERROR IS:", error);
    }
});
