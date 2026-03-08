# 🎓 RAG Study Engine

![UI Screenshot](<img width="1920" height="907" alt="image" src="https://github.com/user-attachments/assets/b660288e-0928-4455-a3fa-40364353fb06" />)

## 🚀 Overview
The **Universal RAG Study Engine** is a full-stack, multi-subject Retrieval-Augmented Generation (RAG) platform designed to ingest complex university course materials (PDFs and PowerPoints) and provide highly accurate, hallucination-free AI tutoring. 

Built with **Python**, **ChromaDB**, and **Llama 3.1**, this system solves the standard limitations of naive RAG pipelines by implementing **Query Reformulation**, strict **Metadata Filtering**, and **Explainable Source Citations**.

## ✨ Key Architectural Features

* 🧠 **Advanced Query Reformulation:** Utilizes a two-step LLM pipeline. Before searching the database, an NLP router translates vague user pronouns (e.g., *"expand on it"*) into highly specific, standalone search queries based on chat history.
* 🗂️ **Automated Ingestion & Metadata Filtering:** The `ingest.py` pipeline automatically scans nested directory structures (`./notes/COURSE_CODE/`). It chunks PDFs and PPTXs and tags them with course-specific metadata, creating an isolated semantic firewall between subjects.
* 🔎 **Explainable Source Citations:** Solves the LLM "black box" problem by mapping the generated answers back to the exact source file and page/slide number.
* 💾 **Persistent State Management:** Features a modern, dark-mode Vanilla JavaScript frontend that utilizes browser `localStorage` to ensure chat history and conversational context survive page refreshes.
* 🛡️ **Anti-Hallucination Prompting:** The AI persona is hardcoded with strict grounding rules, forcing it to reject queries that fall outside the retrieved semantic context.

## 🛠️ Tech Stack
* **Backend:** Python (Flask), RESTful APIs
* **Database:** ChromaDB (Persistent Vector Database)
* **LLM Engine:** Groq Cloud API (Llama-3.1-8b-instant)
* **Data Processing:** `pypdf`, `python-pptx`
* **Frontend:** HTML5, CSS Flexbox, Vanilla JavaScript, Marked.js (Markdown parsing)

* ##NOTE: Current version doesn't work with .pptx exported to .pdf

---
