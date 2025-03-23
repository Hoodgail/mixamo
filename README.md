# Mixamo Animation Downloader

A TypeScript tool to bulk download animations from Mixamo. The tool supports downloading all animations, specific animations based on a query, or just the T-Pose.

## Prerequisites

- Node.js (v14 or higher)
- A Mixamo account
- You must be logged into Mixamo in your default browser before running this tool

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Hoodgail/mixamo.git
   cd mixamo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

Before running the tool, make sure:
1. You are logged into Mixamo in your browser
2. You have selected a character in Mixamo (the tool will download animations for your currently selected character)

### Download All Animations

To download all animations for your currently selected character:

```bash
npm run download-all
```

Animations will be saved to the `src/animations/all.json` folder in the current directory.

### Custom Usage

You can also create your own script to use the Downloader class:

```typescript
import Downloader from './Downloader';

// To download all animations:
const downloader = new Downloader('./output_folder', 'all');

// To download animations matching a query:
const downloader = new Downloader('./output_folder', 'query', 'jump');

// To download just the T-Pose:
const downloader = new Downloader('./output_folder', 'tpose');

// Set up event handlers
downloader.on('total_tasks', (total) => {
  console.log(`Found ${total} animations to download`);
});

downloader.on('current_task', (current) => {
  console.log(`Downloaded ${current} animations`);
});

downloader.on('finished', () => {
  console.log('Download complete!');
});

// Start the download
downloader.run().catch(error => {
  console.error('Error:', error);
});
```

## Building as a CLI Tool

To build this as a global CLI tool:

```bash
npm run build
npm install -g .
```

Then you can run it from anywhere:

```bash
mixamo-downloader
```

## Notes

- This tool works by automating the Mixamo web API
- Download speeds depend on your internet connection and Mixamo's server response time
- The complete animation list is stored in `src/animations/all.json` and can be updated if Mixamo adds new animations

## License

MIT