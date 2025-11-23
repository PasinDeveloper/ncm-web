# Web Audio Studio

A modern, offline-capable Next.js app for transforming protected audio packages into MP3/FLAC output. Features a beautiful, glassy UI, instant audio preview, and full privacy—no files ever leave your device.

## ⚠️ Important Notice

> **⚠️ RESPONSIBLE USAGE**: This tool is for **educational purposes only**. Please ensure you have proper authorization for any audio you process. The developers are not responsible for any misuse of this software.

## ✨ Features

- **🎵 Drag & Drop Upload**: Effortlessly add files via drag-and-drop or file picker
- **🌐 WebDAV Imports**: Browse remote WebDAV directories and queue their protected audio without leaving the app
- **📦 Batch Processing**: Handle multiple files at once with progress tracking
- **🎧 Audio Preview**: Play tracks in a floating, glassy player with volume control
- **⬇️ Download**: Save processed MP3/FLAC files with correct metadata
- **🖼️ Album Art & Info**: Displays cover, artist, album, bitrate, sample rate, and duration
- **🔒 Offline & Private**: All processing is local; no uploads, no tracking
- **🎨 Modern UI**: Responsive, dark, glassmorphic design with smooth animations
- **🛡️ Robust Error Handling**: Friendly error boundaries and loading states
- **⚡ Performance**: Web Workers for non-blocking file processing

## 🚀 Quick Start

```bash
git clone <repository-url>
cd <project-folder>
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and drop your files!

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main page (App Router + all state)
│   ├── layout.tsx                  # Global layout and metadata
│   ├── globals.css                 # Tailwind + global styles
│   └── api/
│       ├── album-art/              # Proxy album art fetcher
│       ├── placeholder-album/      # Placeholder album art API
│       └── webdav/
│           ├── list/               # Browse remote directories
│           └── download/           # Fetch remote files and stream back
├── components/
│   ├── Header.tsx                  # App header with branding
│   ├── UploadArea.tsx              # Drag & drop + WebDAV entry point
│   ├── TrackGrid.tsx               # Stats, actions, and file list
│   ├── SourceGrid.tsx              # Track grid wrapper
│   ├── TrackCard.tsx               # Individual track card
│   ├── AudioPlayer.tsx             # Floating audio player
│   ├── WebDavModal.tsx             # Remote import configuration UI
│   ├── FeaturesSection.tsx         # Landing page features
│   ├── CreditsSection.tsx          # Credits and acknowledgments
│   ├── ErrorBoundary.tsx           # Error handling shell
│   └── LoadingSpinner.tsx          # Loading states
├── lib/
│   ├── albumArt.ts                 # Album art fetching + fallbacks
│   ├── embedArtwork.ts             # Embeds art + metadata in audio
│   └── webdav.ts                   # URL/path helpers and sanitizers
└── types/
    └── index.ts                    # Shared TypeScript interfaces
public/
├── workers/
│   └── ncm-worker.js               # Web Worker for decoding
└── crypto-js/                      # Local cryptography dependencies
```

## 🔧 How It Works

### 1. File Upload

- Drag and drop files onto the upload area
- Or click the select button to browse your computer
- Supports multiple file selection

### 2. Background Processing

- Files are processed in a Web Worker to prevent UI blocking
- Decoding happens entirely in your browser using local CryptoJS
- Progress is shown with animated loading spinners

### 3. Preview & Download

- Processed tracks appear in a responsive grid layout
- Click play to preview audio in the floating player
- Download files with original metadata preserved

### 4. WebDAV Imports

- Click "Load from WebDAV" from the hero upload area or the track grid actions
- Enter the remote endpoint plus optional credentials, then browse directories inside the modal
- The `/api/webdav/list` route enumerates folders so you can pick the right path without leaving the UI
- When you submit, `/api/webdav/download` streams every eligible file in that folder, rehydrates them into `File` objects, and feeds them through the exact same audio pipeline as local uploads
- Optionally remember credentials on this device; they are stored in `localStorage` only after you opt in

## 🎯 Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks with Immer
- **Cryptography**: CryptoJS (bundled locally)
- **Audio Processing**: Web Workers for background processing
- **Icons**: React Icons (Tabler icons)
- **Image Optimization**: Next.js Image component
- **WebDAV Proxy**: Next.js Route Handlers + `webdav` (Node runtime) for remote browsing/downloading

## 🎨 UI/UX Features

### Glassmorphic Design

- Dark theme with gradient backgrounds
- Glass-like components with backdrop blur
- Smooth hover animations and transitions
- Responsive design for all screen sizes

### Audio Player

- Floating pill-shaped player
- Volume control with mute/unmute
- Progress bar with seek functionality
- Marquee effect for long track titles
- Album art display

### Track Cards

- 4-column responsive grid layout
- Hover effects with play/download buttons
- Audio quality information (bitrate, sample rate, duration)
- Format badges (MP3/FLAC)
- Loading states during processing

## 🔒 Privacy & Security

- **Client-Side Only**: All processing happens in your browser
- **No Uploads**: Files never leave your device
- **Offline Capable**: Works completely offline once loaded
- **Local Dependencies**: All external libraries bundled locally
- **No Tracking**: No analytics or data collection
- **WebDAV Credentials Stay Local**: Remote logins are proxied through a serverless route and optional saved credentials live only in your browser storage

## 🐛 Error Handling

- **Error Boundaries**: Graceful error recovery
- **File Validation**: Checks for valid protected source files
- **Audio Errors**: Handles playback failures
- **Loading States**: Clear feedback during processing
- **Fallback UI**: Placeholder album art for missing covers

## 📱 Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## ❓ FAQ

### Q: Is my data safe?

A: Yes! All processing happens in your browser. Files are never uploaded to any server.

### Q: Can I process multiple files at once?

A: Yes! You can drag and drop multiple files or select them all at once.

### Q: Can I load files from WebDAV?

A: Yep. Click "Load from WebDAV," enter your endpoint (plus optional credentials), browse to the right folder, and the app will pull every eligible file through the same local processing pipeline.

### Q: What audio formats are supported?

A: The app exports MP3 and FLAC outputs, automatically detecting the original format.

### Q: Does it work offline?

A: Yes! Once the app is loaded, it works completely offline.

### Q: Why is the processing taking time?

A: Large files require more time to decode. The app uses Web Workers to keep the UI responsive during processing.

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project builds upon and extends the excellent work of:

- **[ncmc-web](https://github.com/magic-akari/ncmc-web)** by 阿卡琳 (magic-akari) - Core decoding algorithm and worker implementation (MIT License)
- **[ncmc](https://github.com/magic-akari/ncmc)** - CLI version for reference
- UI inspired by premium glassmorphic designs
- Built with Next.js, React, and TypeScript
- Icons from [Tabler Icons](https://tabler.io/icons)
- Audio metadata processing with [music-metadata-browser](https://github.com/Borewit/music-metadata-browser)

## 🆘 Support

If you encounter any issues or have questions:

1. Check the FAQ section above
2. Open an issue on GitHub
3. Include details about your browser and the files you're trying to process
