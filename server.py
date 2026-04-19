from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from groq import Groq
from dotenv import load_dotenv
import os
import httpx

load_dotenv()
groq_api_key=os.getenv("GROQ_API_KEY")
app = Flask(__name__)
CORS(app)

# Connect to ChromaDB
client = chromadb.PersistentClient('./RAG')
collection = client.get_or_create_collection('college_notes')

# Initialize Groq Client
groq_client = Groq(api_key=groq_api_key,timeout=httpx.Timeout(60.0, read=60.0, connect=60.0))

@app.route('/ask', methods=['POST'])
def ask_ai():
    data = request.json
    user_question = data.get("question")
    target_course = data.get("course")
    chat_history = data.get("history",[])

    print(f"User asked: {user_question} for course: {target_course}")

    search_query=user_question
    if chat_history:
        reformulation_prompt = f"""
        Given the following conversation history and the user's new question, rewrite the new question to be a standalone, highly specific search query.
        Replace any pronouns (like "it", "they", "this") with the actual subject from the history.
        Do NOT answer the question. ONLY return the rewritten search query.

        Chat History:
        {chat_history}

        New Question:
        {user_question}

        Rewritten Query:
        """

        translation_response = groq_client.chat.completions.create(
            messages=[{"role":"user","content":reformulation_prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.1)
        
        search_query=translation_response.choices[0].message.content.strip()
        print(f"REFORMULATED QUERY: {search_query}")

    # Query ChromaDB with Metadata Filter
    results = collection.query(
        query_texts=[search_query],
        n_results=10,
        where={"course": target_course}
    )

    context_list = []
    sources = []

    for i in range(len(results['documents'][0])):
        text = results['documents'][0][i]
        meta = results['metadatas'][0][i]
        
        context_list.append(text)
        sources.append(f"{meta['source_file']} ({meta['location']})")

    # Merge Context
    retrieved_context = "\n\n".join(results['documents'][0])
    print("---WHAT CHROMADB FOUND---")
    print(retrieved_context)

    final_prompt = f"""
    You are an expert, encouraging Computer Science tutor helping a university student study for their exams.
    Your goal is to answer the student's questions clearly and concisely, using ONLY the facts provided in the Context below.
    
    RULES:
    1. Base your answer strictly on the provided Context. 
    2. Do not hallucinate or guess information outside of the Context.
    3. If the Context contains the answer, explain it simply. Use bullet points and bold text to make it easy to read.
    4. If the Context only partially answers the question, provide the information you have, and naturally mention that the notes don't cover the rest.
    5. If the Context does not contain the answer at all, politely tell the student that this specific topic isn't in the current study notes.

    Context: 
    {retrieved_context}

    Question: 
    {search_query}

    Answer:
    """
    
    messages_for_groq = chat_history
    messages_for_groq.append({"role":"user","content":final_prompt})


    # Call Groq Cloud API instead of local Ollama
    chat_completion = groq_client.chat.completions.create(
        messages=messages_for_groq,
        model="llama-3.1-8b-instant", 
    )

    # Extract Answer
    ai_answer = chat_completion.choices[0].message.content
    print(f"AI Answer: {ai_answer}")

    return jsonify({"answer": ai_answer, "sources":list(set(sources))})

if __name__ == '__main__':
    app.run(port=5001, debug=True)
