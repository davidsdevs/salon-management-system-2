# Kiosk Deployment Guide

## Overview
This is a standalone kiosk application for AR Hair Try On. It operates independently from the main salon management system and can be deployed separately.

## Prerequisites

- Node.js 18+ and npm
- Modern browser with camera access
- Camera device (webcam)
- 4K display (3840x2160) recommended

## Installation

1. Navigate to the kiosk directory:
```bash
cd kiosk-ar-hair-tryon
```

2. Install dependencies:
```bash
npm install
```

3. Verify installation:
```bash
npm run dev
```

## Building for Production

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

## Deployment Options

### Option 1: Static Hosting (Recommended)
- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Deploy `dist` folder
- **Firebase Hosting**: `firebase deploy --only hosting`

### Option 2: Kiosk Device Setup
1. Build the application: `npm run build`
2. Copy the `dist` folder to the kiosk device
3. Serve using a local web server (nginx, Apache, etc.)
4. Configure browser to auto-start in kiosk mode

### Option 3: Docker Deployment
Create a Dockerfile:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Browser Configuration for Kiosk Mode

### Chrome/Edge (Recommended)
```bash
chrome.exe --kiosk --app=http://localhost:5173
```

### Firefox
Install Full-Screen extension or use:
```bash
firefox.exe -kiosk http://localhost:5173
```

## Kiosk Mode Settings

1. **Auto-start on boot**: Configure OS to auto-start browser
2. **Disable right-click**: Browser settings
3. **Full-screen mode**: Use F11 or kiosk flags
4. **Camera permissions**: Ensure camera access is granted
5. **No sleep mode**: Disable screen saver and sleep

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Verify camera is not in use by another application
- Try different browser (Chrome recommended)

### Build Errors
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 18+)

### Performance Issues
- Ensure hardware acceleration is enabled in browser
- Close other applications
- Use dedicated GPU if available

## Security Notes

- This is a client-side only application
- No backend services required
- All processing happens in the browser
- No data is stored or transmitted

## Support

For issues or questions, refer to the main project documentation.

