# AR Hair Try On - Kiosk Application

A **standalone kiosk application** for AR Hair Try On with AI-powered facial structure and skin tone detection. This project is completely separate from the main salon management system and can be deployed independently.

## 🎯 Features

- **AI Face Analysis**: Automatic detection of facial structure and skin tone using MediaPipe
- **3-Second Face Scan**: Precise face capture with countdown timer
- **Smart Recommendations**: Personalized hairstyle recommendations based on facial analysis
- **Kiosk Optimized**: Designed for 4K displays (3840x2160) with large touch-friendly UI
- **Standalone**: No backend required, all processing happens client-side

## 🛠️ Technology Stack

- React 18
- Vite
- Tailwind CSS
- MediaPipe Face Detection
- Lucide React Icons

## 📦 Installation

1. Navigate to the kiosk directory:
```bash
cd kiosk-ar-hair-tryon
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## 🚀 Deployment

This is a **completely separate project** from the main salon management system:

- **Independent deployment**: Can be deployed to any static hosting service
- **No backend required**: All AI processing happens in the browser
- **No database**: No data is stored or transmitted
- **Standalone package.json**: Separate dependencies and build process

### Deployment Options

See `DEPLOYMENT.md` for detailed deployment instructions including:
- Static hosting (Vercel, Netlify, GitHub Pages)
- Kiosk device setup
- Docker deployment
- Browser kiosk mode configuration

## 📋 Requirements

- Node.js 18+
- Modern browser with camera access
- Camera device (webcam)
- 4K display (3840x2160) recommended for optimal experience

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (with limitations)

## 🔒 Privacy & Security

- **100% Client-Side**: All processing happens in the browser
- **No Data Storage**: No information is stored or transmitted
- **No Backend**: No server communication required
- **Camera Only**: Only camera access is needed

## 📁 Project Structure

```
kiosk-ar-hair-tryon/
├── src/
│   ├── pages/
│   │   └── ARHairTryOn.jsx    # Main kiosk component
│   ├── ui/                     # UI components (Button, Card)
│   ├── lib/                    # Utilities
│   └── App.jsx                 # Root component
├── package.json                # Standalone dependencies
├── vite.config.js             # Vite configuration
└── tailwind.config.js         # Tailwind configuration
```

## 🔄 Differences from Main Project

- **No Firebase**: No authentication or database
- **No React Router**: Single page application
- **No Context**: No shared state management
- **Minimal Dependencies**: Only what's needed for the kiosk

## 📝 License

ISC
