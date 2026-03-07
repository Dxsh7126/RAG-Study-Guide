from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from groq import Groq

app = Flask(__name__)
CORS(app)

# Connect to ChromaDB
client = chromadb.PersistentClient('./RAG')
collection = client.get_collection('college_notes')

# Initialize Groq Client
groq_client = Groq(api_key="")

@app.route('/ask', methods=['POST'])
def ask_ai():
    data = request.json
    user_question = data.get("question")
    target_course = data.get("course")

    print(f"User asked: {user_question} for course: {target_course}")

    # 1. Query ChromaDB with Metadata Filter
    results = collection.query(
        query_texts=[user_question],
        n_results=10,
        where={"course": target_course}
    )

    # 2. Merge Context
    retrieved_context = "\n\n".join(results['documents'][0])
    print("---WHAT CHROMADB FOUND---")
    print(retrieved_context)

    # 3. Build the Strict Prompt
    final_prompt = f"""
    You are a highly accurate data extraction engine. 
    Your job is to answer the user's question using ONLY the information provided in the Context below. 
    If the exact answer is not contained in the Context, you must reply exactly with "I do not know based on the provided notes." Do not make up an answer or guess.

    Context: 
    {retrieved_context}

    Question: 
    {user_question}

    Answer:
    """

    # 4. Call Groq Cloud API instead of local Ollama
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": final_prompt,
            }
        ],
        model="llama-3.1-8b-instant", 
    )

    # 5. Extract Answer
    ai_answer = chat_completion.choices[0].message.content
    print(f"AI Answer: {ai_answer}")

    return jsonify({"answer": ai_answer})

if __name__ == '__main__':
    app.run(port=5001, debug=True)