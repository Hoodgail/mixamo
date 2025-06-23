import { MixamoSDK } from "../src/index";

/**
 * Mixamo SDK API Demonstration
 *
 * This script shows the SDK's capabilities and identified API endpoints
 * Note: Authentication is required for actual API calls
 */
async function demonstrateAPI() {
  console.log("\n🎯 Mixamo SDK API Demonstration\n");

  // Initialize SDK
  const sdk = new MixamoSDK({
    apiKey: "mixamo2",
    timeout: 30000,
    authorization: process.env.MIXAMO_TOKEN,
  });

  console.log("📋 Identified API Endpoints:");
  console.log("=".repeat(50));

  const endpoints = [
    {
      method: "GET",
      path: "/api/v1/characters/primary",
      purpose: "Get primary character information",
      example: "sdk.getCurrentCharacter()",
    },
    {
      method: "POST",
      path: "/api/v1/characters/update_primary",
      purpose: "Set primary character",
      example: "sdk.setPrimaryCharacter(characterId)",
    },
    {
      method: "GET",
      path: "/api/v1/products",
      purpose: "Search animations with filters",
      example: "sdk.searchAnimations({ query: 'walk', genres: ['Combat'] })",
    },
    {
      method: "GET",
      path: "/api/v1/products/{id}",
      purpose: "Get animation details",
      example: "sdk.getAnimationDetails(animationId, characterId)",
    },
    {
      method: "GET",
      path: "/api/v1/characters/{id}/assets/rigged/verold.json",
      purpose: "Character 3D assets (geometry, materials, textures)",
      example: "sdk.loadCharacterAssets(characterId)",
    },
    {
      method: "GET",
      path: "/api/v1/characters/{id}/assets/rigged/skeleton.json",
      purpose: "Character skeleton structure",
      example: "sdk.getCharacterSkeleton(characterId)",
    },
    {
      method: "POST",
      path: "/api/v1/animations/stream",
      purpose: "Process/apply animation to character",
      example: "sdk.processAnimation(characterId, animationId, options)",
    },
  ];

  endpoints.forEach((endpoint, index) => {
    console.log(`${index + 1}. ${endpoint.method} ${endpoint.path}`);
    console.log(`   Purpose: ${endpoint.purpose}`);
    console.log(`   Usage: ${endpoint.example}`);
    console.log("");
  });

  console.log("🔧 Animation Options Available:");
  console.log("=".repeat(30));
  console.log("• mirror: boolean - Mirror the animation");
  console.log("• trim: [number, number] - Start/end percentages (0-100)");
  console.log("• overdrive: number - Speed multiplier (0-1)");
  console.log("• armSpace: number - Arm space adjustment");
  console.log("• inPlace: boolean - Keep character in place");
  console.log("");

  console.log("🎨 Available Animation Genres:");
  console.log("=".repeat(30));
  const genres = sdk.getAvailableGenres();
  genres.forEach((genre) => console.log(`• ${genre}`));
  console.log("");

  console.log("📦 Asset Types Identified:");
  console.log("=".repeat(25));
  console.log("• Geometry files (.geo.json + .geo.bin)");
  console.log("• Texture files (.tex.jpg)");
  console.log("• Skeleton data (joint hierarchy)");
  console.log("• Animation clips");
  console.log("• Material definitions");
  console.log("");

  console.log("🧪 Example Usage (when authenticated):");
  console.log("=".repeat(40));

  const examples = [
    {
      title: "Search for idle animations",
      code: `const animations = await sdk.searchAnimations({
  query: "idle",
  genres: ["Combat", "Adventure"]
});`,
    },
    {
      title: "Load character assets",
      code: `const assets = await sdk.loadCharacterAssets(characterId);
console.log(\`Found \${assets.geometry.length} geometry files\`);`,
    },
    {
      title: "Process animation with options",
      code: `const result = await sdk.processAnimation(characterId, animationId, {
  mirror: true,
  trim: [10, 90],
  inPlace: true
});`,
    },
    {
      title: "Batch process multiple animations",
      code: `const animations = ["anim1", "anim2", "anim3"];
const results = await sdk.batchProcessAnimations(
  characterId, 
  animations,
  { mirror: false, overdrive: 0.8 }
);`,
    },
  ];

  examples.forEach((example, index) => {
    console.log(`${index + 1}. ${example.title}:`);
    console.log(example.code);
    console.log("");
  });

  console.log("💡 Three.js Integration Ready:");
  console.log("=".repeat(30));
  console.log("• Direct GLB/glTF export support");
  console.log("• THREE.AnimationClip conversion");
  console.log("• THREE.SkinnedMesh compatibility");
  console.log("• Animation mixer helpers");
  console.log("");

  console.log("⚠️  Current Status:");
  console.log("=".repeat(18));
  console.log("✅ API endpoints identified and implemented");
  console.log("✅ Request/response structures mapped");
  console.log("✅ Animation options documented");
  console.log("✅ Asset loading mechanisms ready");
  console.log("❌ Authentication requires browser session");
  console.log("❌ Live API testing blocked by auth");
  console.log("");

  console.log("🚀 Next Steps:");
  console.log("=".repeat(13));
  console.log("1. Implement browser extension for session access");
  console.log("2. Add session token extraction utilities");
  console.log("3. Complete Three.js integration helpers");
  console.log("4. Add comprehensive error handling");
  console.log("5. Create proxy middleware solution");
}

// Export for standalone execution
export { demonstrateAPI };

// Run if called directly
if (require.main === module) {
  demonstrateAPI().catch(console.error);
}
