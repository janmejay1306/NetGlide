# NetGlide - Futuristic Browser Project

NetGlide is a high-performance, futuristic web browser built with React, Vite, and Electron.

## Project Structure & Exclusions

To keep the repository clean and efficient, the following folders are excluded from Git:

- **`node_modules/`**: Contains thousands of external dependencies. These are not pushed because they can be re-installed using `npm install`.
- **`dist/`**: The compiled web assets. These are generated automatically during the build process.
- **`release/`**: Contains the final packaged application (e.g., the `.exe` installer). 
  - **Local Access**: You can find the executable for testing in your local `release` folder after running a build.
  - **GitHub Releases**: In production, these installers are typically uploaded to the GitHub "Releases" section rather than the source code repository.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Development

Run the browser in development mode:

```bash
# Start Vite and Electron
npm run electron:dev
```

### Building the Application

To generate a new installer in the `release/` folder:

```bash
npm run build
npm run electron:build
```

---
*Design inspired by the [Futuristic Browser Project on Figma](https://www.figma.com/design/fUtk2n8xpsnMAbvOdN5SWj/Futuristic-Browser-Project).*
