document.getElementById("submitBtn").addEventListener("click", async function() {
    
    // 1. Grab the text from your HTML input box
    const userText = document.getElementById("userQuestion").value;
    
    // 2. Change the screen text to show it's working
    document.getElementById("responseArea").innerText = "Thinking...";

    // 3. Send the data to your Python Flask server
    try {
        const response = await fetch("http://127.0.0.1:5001/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // This is the exact JSON payload we tested in PowerShell
            body: JSON.stringify({ 
                "question": userText, 
                "course": "OS2202" 
            })
        });

        // 4. Unpack the server's response
        const data = await response.json();
        
        // 5. Put Llama's answer on the screen
        document.getElementById("responseArea").innerText = data.answer;

    } catch (error) {
        document.getElementById("responseArea").innerText = "Error connecting to server. Check the console!";
        console.error("THE ERROR IS:", error);
    }
});