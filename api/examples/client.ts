/**
 * Example client for the Mixamo Animation API
 * Demonstrates how to search, process, and download animations
 */

// Configuration
const API_BASE = "http://localhost:3002";
const MIXAMO_TOKEN = process.env.MIXAMO_TOKEN || "Bearer your-token-here";

if (MIXAMO_TOKEN === "Bearer your-token-here") {
  console.error("⚠️  Please set MIXAMO_TOKEN environment variable");
  console.error("   Get your token from Mixamo browser dev tools");
  process.exit(1);
}

interface AnimationResult {
  id: string;
  name: string;
  type: string;
  description: string;
  threejs_ready: boolean;
  download_url: string;
  process_url: string;
}

interface SearchResponse {
  results: AnimationResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ThreeJSAnimationData {
  id: string;
  name: string;
  skeleton: any;
  animation: any;
  options: any;
  processed_at: string;
  three_js_compatible: boolean;
}

class MixamoAnimationClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.token,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        `API Error: ${response.status} - ${error.error || error.message}`
      );
    }

    return response;
  }

  /**
   * Check if the API server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search for animations
   */
  async searchAnimations(
    params: {
      query?: string;
      genres?: string[];
      page?: number;
      limit?: number;
    } = {}
  ): Promise<SearchResponse> {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.set("q", params.query);
    if (params.genres?.length)
      searchParams.set("genres", params.genres.join(","));
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const response = await this.request(`/search?${searchParams.toString()}`);
    return response.json();
  }

  /**
   * Get animation details
   */
  async getAnimationDetails(animationId: string): Promise<any> {
    const response = await this.request(`/animation/${animationId}`);
    return response.json();
  }

  /**
   * Process animation for Three.js
   */
  async processAnimation(
    animationId: string,
    options: {
      mirror?: boolean;
      trim?: [number, number];
      overdrive?: number;
      armSpace?: number;
      inPlace?: boolean;
    } = {}
  ): Promise<ThreeJSAnimationData> {
    const response = await this.request(`/animation/${animationId}/threejs`, {
      method: "POST",
      body: JSON.stringify(options),
    });
    return response.json();
  }

  /**
   * Download animation as JSON file
   */
  async downloadAnimation(animationId: string): Promise<string> {
    const response = await this.request(`/animation/${animationId}/download`);
    return response.text();
  }

  /**
   * Batch process multiple animations
   */
  async batchProcess(animationIds: string[], options: any = {}): Promise<any> {
    const response = await this.request("/batch/process", {
      method: "POST",
      body: JSON.stringify({ animationIds, options }),
    });
    return response.json();
  }
}

/**
 * Example usage functions
 */
async function basicExample() {
  console.log("🚀 Starting Mixamo API Client Example\n");

  const client = new MixamoAnimationClient(API_BASE, MIXAMO_TOKEN);

  // 1. Health check
  console.log("1️⃣ Checking API health...");
  const isHealthy = await client.healthCheck();
  if (!isHealthy) {
    console.error("❌ API server is not responding");
    return;
  }
  console.log("✅ API server is healthy\n");

  // 2. Search for walking animations
  console.log("2️⃣ Searching for walking animations...");
  const searchResults = await client.searchAnimations({
    query: "walk",
    genres: ["Adventure"],
    limit: 5,
  });

  console.log(`📊 Found ${searchResults.results.length} animations:`);
  searchResults.results.forEach((anim, i) => {
    console.log(`   ${i + 1}. ${anim.name} (${anim.type})`);
  });
  console.log();

  if (searchResults.results.length === 0) {
    console.log("⚠️ No animations found, ending example");
    return;
  }

  // 3. Get details for first animation
  const firstAnimation = searchResults.results[0];
  console.log(`3️⃣ Getting details for "${firstAnimation.name}"...`);
  const details = await client.getAnimationDetails(firstAnimation.id);
  console.log(`📋 Animation details:`, {
    name: details.name,
    type: details.type,
    description: details.description?.substring(0, 100) + "...",
  });
  console.log();

  // 4. Process animation for Three.js
  console.log(`4️⃣ Processing "${firstAnimation.name}" for Three.js...`);
  const processedAnimation = await client.processAnimation(firstAnimation.id, {
    inPlace: true,
    mirror: false,
  });

  console.log(`🎯 Animation processed successfully:`);
  console.log(`   Name: ${processedAnimation.name}`);
  console.log(`   ID: ${processedAnimation.id}`);
  console.log(
    `   Three.js compatible: ${processedAnimation.three_js_compatible}`
  );
  console.log(`   Processed at: ${processedAnimation.processed_at}`);
  console.log();

  // 5. Download animation as JSON
  console.log("5️⃣ Downloading animation as JSON...");
  const animationJson = await client.downloadAnimation(firstAnimation.id);

  // Save to file (optional)
  const fs = await import("fs");
  const filename = `./animation-${firstAnimation.id}.json`;
  fs.writeFileSync(filename, animationJson);
  console.log(`💾 Animation saved to ${filename}`);
  console.log(`📊 File size: ${(animationJson.length / 1024).toFixed(2)} KB`);
  console.log();

  console.log("✅ Example completed successfully!");
}

async function batchExample() {
  console.log("🔄 Starting Batch Processing Example\n");

  const client = new MixamoAnimationClient(API_BASE, MIXAMO_TOKEN);

  // Search for idle animations
  console.log("1️⃣ Searching for idle animations...");
  const searchResults = await client.searchAnimations({
    query: "idle",
    limit: 3,
  });

  if (searchResults.results.length === 0) {
    console.log("⚠️ No animations found for batch processing");
    return;
  }

  const animationIds = searchResults.results.map((anim) => anim.id);
  console.log(
    `📊 Found ${animationIds.length} animations for batch processing`
  );

  // Batch process with options
  console.log("2️⃣ Batch processing animations...");
  const batchResults = await client.batchProcess(animationIds, {
    inPlace: true,
    mirror: false,
  });

  console.log(`✅ Batch processing completed:`);
  console.log(`   Processed: ${batchResults.processed} animations`);

  batchResults.results.forEach((result: any, i: number) => {
    if (result.status === "success") {
      console.log(`   ✅ ${i + 1}. ${result.name}`);
    } else {
      console.log(`   ❌ ${i + 1}. Failed: ${result.error}`);
    }
  });
}

async function threeJSIntegrationExample() {
  console.log("🎮 Three.js Integration Example\n");

  const client = new MixamoAnimationClient(API_BASE, MIXAMO_TOKEN);

  // Search for a specific animation
  const searchResults = await client.searchAnimations({
    query: "walk",
    limit: 1,
  });

  if (searchResults.results.length === 0) {
    console.log("⚠️ No animations found");
    return;
  }

  const animation = searchResults.results[0];
  console.log(`🎯 Processing "${animation.name}" for Three.js integration...`);

  // Process with specific Three.js optimizations
  const threejsData = await client.processAnimation(animation.id, {
    inPlace: false, // Keep movement for realistic motion
    mirror: false, // Don't mirror the animation
    trim: [10, 90], // Trim to 10%-90% of original
    overdrive: 0, // No speed modification
  });

  console.log("📦 Three.js Data Structure:");
  console.log(
    `   Skeleton bones: ${threejsData.skeleton?.bones?.length || "N/A"}`
  );
  console.log(
    `   Animation tracks: ${threejsData.animation?.tracks?.length || "N/A"}`
  );
  console.log(
    `   Duration: ${threejsData.animation?.duration || "N/A"} seconds`
  );

  // Example Three.js usage code
  console.log("\n💻 Example Three.js integration code:");
  console.log(`
// Load the processed animation data
const animationData = ${JSON.stringify(threejsData, null, 2).substring(
    0,
    200
  )}...

// Create Three.js objects (pseudo-code)
const loader = new THREE.ObjectLoader();
const skeleton = loader.parse(animationData.skeleton);
const animationClip = THREE.AnimationClip.parse(animationData.animation);

// Apply to your mesh
const mixer = new THREE.AnimationMixer(yourCharacterMesh);
const action = mixer.clipAction(animationClip);
action.play();

// In your render loop
mixer.update(deltaTime);
  `);
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const example = args[0] || "basic";

    switch (example) {
      case "basic":
        await basicExample();
        break;
      case "batch":
        await batchExample();
        break;
      case "threejs":
        await threeJSIntegrationExample();
        break;
      default:
        console.log("Available examples:");
        console.log("  bun examples/client.ts basic   - Basic API usage");
        console.log("  bun examples/client.ts batch   - Batch processing");
        console.log("  bun examples/client.ts threejs - Three.js integration");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error("\n💡 Make sure:");
    console.error("   1. The API server is running (bun run dev)");
    console.error("   2. Your MIXAMO_TOKEN is valid");
    console.error("   3. You have a stable internet connection");
  }
}

// Export for use in other files
export { MixamoAnimationClient };

// Run if called directly
if (require.main === module) {
  main();
}
