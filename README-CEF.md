# Building NetGlide with CEF

Since this project has been shifted from Electron to the Chromium Embedded Framework (CEF), you need C++ build tools to compile the backend.

## Prerequisites

1. **Visual Studio 2022 Community**
   - Install from [Microsoft's Website](https://visualstudio.microsoft.com/vs/community/).
   - Make sure to select the **"Desktop development with C++"** workload during installation.
2. **CMake**
   - Install from [cmake.org](https://cmake.org/download/) or ensure it's installed via Visual Studio.
3. **CEF Binary Distribution**
   - Download the Standard Distribution for Windows (64-bit) from the [Spotify CEF Builder](https://cef-builds.spotifycdn.com/index.html).
   - Extract the downloaded archive into a folder named `cef` directly inside the `NetGlide` folder (so you have `d:\NetGlide\cef`).

## Quick Start with npm scripts

You can now run and build using standard npm scripts:

```bash
# 1. Start the React frontend dev server
npm run dev

# 2. In a separate terminal, compile and run the CEF backend
npm run cef:build
npm run cef:run
```

The compiled `NetGlideCEF.exe` is located in `build/Release/NetGlideCEF.exe`.

## Features
- **Chromium Native Engine**: Runs on the latest Chromium CEF runtime without Node.js or Electron overhead.
- **Native Downloads**: Uses `CefDownloadHandler` with native Windows "Save As..." dialogs and progress tracking.
- **Developer Tools**: Press <kbd>F12</kbd> anywhere in the window to open Chrome DevTools.

