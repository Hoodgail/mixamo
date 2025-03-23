import * as path from 'path';
import * as fs from 'fs';
import { Downloader } from './core/Downloader';

// Create a simple progress bar for console output
class ProgressBar {
     private width: number;
     private total: number;
     private current: number = 0;

     constructor(total: number, width: number = 40) {
          this.total = total;
          this.width = width;
     }

     update(current: number): void {
          this.current = current;

          const percentage = this.current / this.total;
          const filledWidth = Math.round(percentage * this.width);
          const emptyWidth = this.width - filledWidth;

          const filledBar = '█'.repeat(filledWidth);
          const emptyBar = '░'.repeat(emptyWidth);

          process.stdout.write(`\r[${filledBar}${emptyBar}] ${this.current}/${this.total} (${Math.round(percentage * 100)}%)`);

          if (this.current === this.total) {
               console.log('\nDownload complete!');
          }
     }
}

/**
 * Main function to run the downloader
 */
export async function runDownloader() {
     console.log('Mixamo Animation Downloader');
     console.log('==========================');

     // Get or create the output directory
     const outputDir = path.join(process.cwd(), 'animations_output');

     try {
          if (!fs.existsSync(outputDir)) {
               fs.mkdirSync(outputDir, { recursive: true });
               console.log(`Created output directory: ${outputDir}`);
          }
     } catch (error) {
          console.error('Error creating output directory:', error);
          process.exit(1);
     }

     console.log(`Output directory: ${outputDir}`);
     console.log('Starting to download all animations...');

     // Create the downloader instance
     const downloader = new Downloader(outputDir, 'all');

     let progressBar: ProgressBar;

     // Set up event listeners
     downloader.on('total_tasks', (total: number) => {
          console.log(`Found ${total} animations to download`);
          progressBar = new ProgressBar(total);
     });

     downloader.on('current_task', (current: number) => {
          progressBar.update(current);
     });

     downloader.on('finished', () => {
          console.log('\nDownload process finished!');
          process.exit(0);
     });

     downloader.on('error', (error: Error) => {
          console.error('\nError during download:', error);
          process.exit(1);
     });

     // Handle interruption signals
     process.on('SIGINT', () => {
          console.log('\nInterrupted by user. Stopping downloads...');
          downloader.setStop();
     });

     // Start the download process
     await downloader.run();
}