# SonicAlchemy ⚗️🎵

> **"Transmute your ideas into sonic reality."**

SonicAlchemy is a sophisticated, AI-powered music library manager and prompt engineering tool designed for audio generation workflows. Built with a **Dark Luxury Alchemy** aesthetic, it combines modern web technologies with the power of Google's Gemini API to manage, analyze, and refine music generation prompts.

![SonicAlchemy Interface](https://via.placeholder.com/1200x600/020617/f59e0b?text=SonicAlchemy+Interface)

## ✨ Key Features

### 🎧 Audio Management
*   **Batch Import**: Drag and drop up to 10 MP3/WAV files at once.
*   **Local Playback**: Listen to your tracks directly within the app.
*   **Algorithmic Cover Art**: Automatically generates unique, deterministic geometric cover art based on track titles. No AI generation required for covers.
*   **List & Grid Views**: Toggle between visual-heavy Grid cards or data-dense List rows for managing large libraries (100+ tracks).

### 🧠 AI Intelligence (Gemini Powered)
*   **Smart Tagging**: Automatically analyzes your text prompts to extract relevant musical tags (Genre, Mood, Instruments).
*   **Prompt Refining**: The **Mixing Room** allows you to combine multiple tracks. The AI analyzes their common and unique traits to synthesize a new, polished prompt for your next generation.

### 💾 Data Persistence
*   **IndexedDB Storage**: All data (including audio files) is stored locally in your browser. It survives page reloads.
*   **Backup & Restore**: Full JSON export/import functionality to save your library or move it to another device.

### 🎨 Design System
*   **Theme**: *Deep Obsidian & Antique Gold*. A darker, flatter interface designed for professional use in low-light environments.
*   **Fluid Layout**: Responsive design that adapts to ultra-wide screens.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite
*   **Styling**: Tailwind CSS (Lucide React for icons)
*   **AI**: Google Gemini API (`@google/genai`)
*   **Storage**: IndexedDB (Browser Native)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/sonic-alchemy.git
    cd sonic-alchemy
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📖 How to Use

1.  **Import**: Click the **Import** button in the sidebar. Drag audio files in. Write a raw prompt description. Click "Analyze" to let AI tag your tracks.
2.  **Manage**: Use the **Tag Cloud** at the top to filter your library by genre or mood. Switch between Grid and List views.
3.  **Mix**: Click the **+** icon on tracks to add them to the "Mixing Room".
4.  **Create**: Go to the **Mixing Room**. The system will identify common elements among your selected tracks. Click **Generate** to create a new, high-quality prompt based on your selection.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
