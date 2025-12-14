# MerchMaster - AI Product Design Studio

**MerchMaster** is a professional-grade web application that leverages Google's Gemini AI models to generate photorealistic product mockups. It combines a drag-and-drop design studio with advanced generative AI to composite logos onto products, respecting lighting, texture, warping, and perspective.

[MerchMaster Preview](https://www.merch-master.vercel.app/)

## 🚀 Features

### 🎨 interactive Design Studio
- **Canvas Manipulation**: Drag, drop, scale, and rotate layers freely on the canvas.
- **Smart Tools**: 
  - **Snap-to-Grid**: Align elements precisely with a togglable grid.
  - **Rotation & Resize Handles**: Intuitive on-canvas controls for transforming assets.
  - **Z-Index Control**: Layer ordering (Bring to Front, Send to Back).
  - **Opacity Control**: Adjust transparency for realistic blending previews.
- **Background Customization**: Toggle between transparent, solid colors, or gradient backgrounds.
- **Undo/Redo History**: Full state management to revert changes easily.

### ✨ Generative AI Integration
- **Asset Generation**: Create unique logos and product bases from scratch using text prompts.
- **Photorealistic Compositing**: Uses `gemini-3-pro-image-preview` to blend vector graphics onto real-world textures (fabric, ceramic, etc.) seamlessly.
- **Camera Angle Control**: Select specific view angles (Front, Top, Isometric, etc.) via a 3D gizmo interface to generate multi-angle composites.
- **Context-Aware Prompts**: The app constructs complex prompts based on the canvas layout (position, scale) to guide the AI.

### 📂 Workflow Management
- **Asset Library**: Manage uploaded and generated images, categorized by Products and Logos.
- **Gallery**: View, download, and manage your history of generated high-resolution mockups.
- **Intro Experience**: A cinematic animated intro sequence built with CSS animations and Lucide icons.

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Model**: Google GenAI SDK (`@google/genai`)
  - Model: `gemini-3-pro-image-preview`
- **Build Tool**: Vite (implied structure)

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rahul0304-tech/merch-master.git
   cd merch-master
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **API Key Configuration**
   This app requires a **Paid Google Cloud Project API Key** to access the `gemini-3-pro` models.
   
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_genai_api_key
   ```
   *Note: If no key is provided in the environment, the app includes a dialog prompt to enter/select a key at runtime via the `AIStudio` integration.*

4. **Run the Development Server**
   ```bash
   npm start
   ```

## 📖 Usage Guide

### 1. Upload Assets
Navigate to the **Assets** view. You can either:
- **Upload**: Drag & drop your own product photos (shirts, mugs, packaging) and logo files (PNG, SVG).
- **Generate**: Use the AI tool to create new assets from text descriptions (e.g., "A minimalist geometric fox logo").

### 2. Design in Studio
Switch to the **Studio** view:
1. Select a **Product** base from the left panel.
2. Click logos to add them to the canvas.
3. **Positioning**: Drag to move, use corner handles to resize, and the top handle to rotate.
4. **Camera Angles**: Use the 3D rotation gizmo to specify which angles you want the final mockup to display.
5. **Instructions**: Add specific text instructions (e.g., "Embroidery effect", "Screen print texture").

### 3. Generate & Download
Click **Generate Mockup**. The AI will analyze your canvas layout and render a high-fidelity image. Once complete, you will be taken to the **Gallery** to view and download your result.

## 📁 Project Structure

```
├── components/          # Reusable UI components
│   ├── ApiKeyDialog.tsx # Modal for API key entry
│   ├── Button.tsx       # Standardized button component
│   ├── CameraAngleSelector.tsx # 3D Gizmo for angle selection
│   └── FileUploader.tsx # Drag & drop file input
├── hooks/
│   └── useApiKey.ts     # API key validation logic
├── services/
│   └── geminiService.ts # Google GenAI SDK integration logic
├── types.ts             # TypeScript interfaces (Asset, PlacedLayer, etc.)
├── App.tsx              # Main application logic and routing
├── index.tsx            # Entry point
└── index.css            # Global styles and Tailwind directives
```

## ⚠️ Important Notes

- **Content Policy**: Do not generate content that infringes on intellectual property or violates safety guidelines.
