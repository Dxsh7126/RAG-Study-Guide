// PULL MEMORY FROM HARD DRIVE
let chatHistory = JSON.parse(localStorage.getItem("os2202_memory")) || [];

// RESTORE CHAT ON PAGE LOAD
window.onload = function() {
    chatHistory.forEach(msg => {
        let sender = msg.role === "assistant" ? "ai" : "user";
        // Pass empty sources for history items for now
        appendMessage(sender, msg.content, msg.sources || []);
    });
};

// --- THE DOM ENGINE ---
function appendMessage(sender, text, sources = []) {
    const chatContainer = document.getElementById("chatContainer");
    const messageDiv = document.createElement("div");

    if (sender === "user") {
        messageDiv.className = "message user-message";
        messageDiv.innerText = text;
    } else {
        messageDiv.className = "message ai-message";
        let htmlContent = marked.parse(text);

        if (sources && sources.length > 0) {
            htmlContent += `<div class="sources-list"><hr><b>Sources:</b><ul>`;
            sources.forEach(src => {
                htmlContent += `<li>📍 ${src}</li>`;
            });
            htmlContent += `</ul></div>`;
        }
        messageDiv.innerHTML = htmlContent;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- KEYBOARD & CLEAR CONTROLS ---
document.getElementById("userQuestion").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("submitBtn").click();
    if (e.key === "Escape") e.target.value = "";
});

document.getElementById("clearBtn").addEventListener("click", () => {
    localStorage.removeItem("os2202_memory");
    chatHistory = [];
    document.getElementById("chatContainer").innerHTML = "";
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

        appendMessage("ai", data.answer, data.sources);

        // Update Memory with sources so they persist on refresh
        chatHistory.push({
            "role": "user", 
            "content": userText
        });
        chatHistory.push({
            "role": "assistant", 
            "content": data.answer, 
            "sources": data.sources 
        });

        localStorage.setItem("os2202_memory", JSON.stringify(chatHistory));

    } catch (error) {
        if (document.getElementById("loadingBubble")) document.getElementById("loadingBubble").remove();
        appendMessage("ai", "**Error:** Could not connect to the Python server.");
        console.error("THE ERROR IS:", error);
    }
});

