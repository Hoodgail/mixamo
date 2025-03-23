#!/usr/bin/env node

import { runDownloader } from './src';

// Run the main function
runDownloader().catch(error => {
     console.error('Unhandled error:', error);
     process.exit(1);
});