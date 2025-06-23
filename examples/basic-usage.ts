/**
 * Basic Usage Example for Mixamo SDK
 *
 * This example demonstrates the main workflows:
 * 1. Initialize the SDK
 * 2. Search for animations
 * 3. Load character assets
 * 4. Apply animations to characters
 * 5. Convert to Three.js format
 */

import { MixamoSDK, AnimationOptions } from "../src";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const authorization = process.env.MIXAMO_TOKEN;
/**
 * Create output directory for Three.js exports
 */
function createOutputDirectory(): string {
  const outputDir = join(process.cwd(), "threejs-exports");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Write JSON data to file with proper formatting
 */
function writeJsonFile(outputDir: string, filename: string, data: any): void {
  const filepath = join(outputDir, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
  console.log(`📁 Saved: ${filename}`);
}

async function basicExample() {
  console.log("🚀 Starting Mixamo SDK Basic Example");

  // 1. Initialize the SDK
  const sdk = new MixamoSDK({
    apiKey: "mixamo2", // Default Mixamo API key
    timeout: 30000,
    retries: 3,
    authorization,
  });

  try {
    // 2. Test connection
    console.log("📡 Testing connection...");
    const isConnected = await sdk.testConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to Mixamo API");
    }
    console.log("✅ Connected to Mixamo API");

    // 3. Get current character
    console.log("👤 Getting current character...");
    const currentCharacter = await sdk.getCurrentCharacter();
    console.log("Current character:", {
      id: currentCharacter.primary_character_id,
      name: currentCharacter.primary_character_name,
      source: currentCharacter.primary_character_source,
    });

    // 4. Load character assets including skeleton
    console.log("\n📦 Loading character assets...");
    const characterAssets = await sdk.loadCharacterAssets(
      currentCharacter.primary_character_id
    );

    console.log("Character assets loaded:", {
      characterId: characterAssets.characterId,
      totalAssets: characterAssets.assets.length,
      geometryAssets: characterAssets.geometry.length,
      textureAssets: characterAssets.textures.length,
      skeletonJoints: countJoints(characterAssets.skeleton.joint),
    });

    // 5. Convert skeleton to Three.js format
    console.log("\n🦴 Converting skeleton to Three.js...");
    const threeJSSkeleton = sdk.convertSkeletonToThreeJS(
      characterAssets.skeleton
    );
    console.log("Three.js skeleton created:", {
      boneCount: threeJSSkeleton.bones.length,
      rootBone: threeJSSkeleton.bones[0]?.name,
    });

    // 6. Search for idle animations
    console.log("\n🔍 Searching for idle animations...");
    const idleAnimations = await sdk.searchAnimationsByQuery("idle");
    console.log(`Found ${idleAnimations.length} idle animations`);

    // Display first few animations
    idleAnimations.slice(0, 3).forEach((anim, index) => {
      console.log(`  ${index + 1}. ${anim.name} (${anim.type})`);
      console.log(`     Description: ${anim.description}`);
      console.log(`     ID: ${anim.id}`);
    });

    // 7. Process first animation and convert to Three.js
    if (idleAnimations.length > 0) {
      const firstAnimation = idleAnimations[0];
      console.log(`\n⚙️ Processing animation: ${firstAnimation.name}`);

      const animationOptions: AnimationOptions = {
        mirror: false,
        inPlace: false,
        trim: [0, 100], // Use full animation
        overdrive: 0, // Normal speed
      };

      const processedAnimation = await sdk.applyAnimation(
        firstAnimation.id,
        currentCharacter.primary_character_id,
        animationOptions
      );

      console.log("✅ Animation processed successfully:", {
        animationName: processedAnimation.animationName,
        duration: processedAnimation.duration,
        loopable: processedAnimation.loopable,
        dataSize: processedAnimation.processedData.length,
      });

      // 8. Convert animation to Three.js format
      console.log("\n🎬 Converting animation to Three.js...");
      const threeJSAnimation = sdk.convertAnimationDataToThreeJS(
        processedAnimation,
        characterAssets.skeleton
      );
      console.log("Three.js animation created:", {
        name: threeJSAnimation.name,
        duration: threeJSAnimation.duration,
        trackCount: threeJSAnimation.tracks.length,
      });

      // 9. Export Three.js data as JSON files
      console.log("\n💾 Exporting Three.js data to JSON files...");
      const outputDir = createOutputDirectory();

      // Extract serializable skeleton data
      const skeletonData = sdk.extractSkeletonData(threeJSSkeleton);
      const animationData = sdk.extractAnimationData(threeJSAnimation);

      // Write skeleton JSON
      writeJsonFile(outputDir, "skeleton.json", {
        characterId: currentCharacter.primary_character_id,
        characterName: currentCharacter.primary_character_name,
        timestamp: new Date().toISOString(),
        skeleton: skeletonData,
      });

      // Write animation JSON
      writeJsonFile(
        outputDir,
        `animation-${firstAnimation.name.replace(/[^a-zA-Z0-9]/g, "_")}.json`,
        {
          characterId: currentCharacter.primary_character_id,
          animationId: firstAnimation.id,
          animationName: firstAnimation.name,
          timestamp: new Date().toISOString(),
          animation: animationData,
          options: animationOptions,
        }
      );

      // Write combined data
      writeJsonFile(outputDir, "combined.json", {
        character: {
          id: currentCharacter.primary_character_id,
          name: currentCharacter.primary_character_name,
          skeleton: skeletonData,
        },
        animation: {
          id: firstAnimation.id,
          name: firstAnimation.name,
          data: animationData,
          options: animationOptions,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          sdk_version: "1.0.0",
          export_type: "threejs_json",
        },
      });

      console.log(`✅ Three.js data exported to: ${outputDir}`);
      console.log("📁 Files created:");
      console.log("   - skeleton.json (Three.js skeleton structure)");
      console.log(
        `   - animation-${firstAnimation.name.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}.json (Three.js animation clip)`
      );
      console.log("   - combined.json (Complete character + animation data)");
    }

    // 10. Additional exports
    console.log("\n📋 Additional character information...");
    const assetsByType = characterAssets.assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("Asset breakdown by type:", assetsByType);

    // Get asset URLs for direct download
    const assetUrls = sdk.managers.character.getAssetUrls(
      currentCharacter.primary_character_id,
      characterAssets.assets
    );

    console.log("\n🔗 Available asset URLs:");
    console.log(`  Geometry files: ${assetUrls.geometry.length}`);
    console.log(`  Texture files: ${assetUrls.textures.length}`);
    console.log(`  Material files: ${assetUrls.materials.length}`);

    // Example: Show first texture URL
    if (assetUrls.textures.length > 0) {
      console.log(`  First texture: ${assetUrls.textures[0].name}`);
      console.log(`  URL: ${assetUrls.textures[0].url}`);
    }
  } catch (error) {
    console.error("❌ Error in basic example:", error);
  }
}

async function advancedExample() {
  console.log("\n🔧 Starting Advanced Example");

  const sdk = new MixamoSDK({
    apiKey: "mixamo2", // Default Mixamo API key
    timeout: 30000,
    retries: 3,
    authorization,
  });

  try {
    const currentCharacter = await sdk.getCurrentCharacter();

    // Complete workflow: Load character with animation
    console.log("🚀 Running complete workflow...");

    // Search for a walking animation
    const walkingAnimations = await sdk.searchAnimationsByQuery("walking");
    if (walkingAnimations.length === 0) {
      console.log(
        "No walking animations found, using first available animation"
      );
      const allAnimations = await sdk.getPopularAnimations(5);
      if (allAnimations.length === 0) {
        throw new Error("No animations available");
      }
      walkingAnimations.push(allAnimations[0]);
    }

    const firstWalkingAnim = walkingAnimations[0];
    console.log(`Using animation: ${firstWalkingAnim.name}`);

    // Load character with animation in one call
    const completeAsset = await sdk.loadCharacterWithAnimation(
      currentCharacter.primary_character_id,
      firstWalkingAnim.id,
      {
        mirror: false,
        inPlace: true, // Keep character in place
        trim: [10, 90], // Trim first and last 10%
      }
    );

    console.log("✅ Complete asset loaded:", {
      characterId: completeAsset.character.id,
      animationName: completeAsset.animation.details.name,
      ready: completeAsset.ready,
    });

    // Batch process multiple animations
    console.log("\n📦 Batch processing animations...");
    const animationIds = walkingAnimations.slice(0, 3).map((anim) => anim.id);

    const batchResults = await sdk.batchProcessAnimations(
      currentCharacter.primary_character_id,
      animationIds,
      { inPlace: true }
    );

    console.log(`✅ Batch processed ${batchResults.length} animations`);
    batchResults.forEach((result, index) => {
      console.log(
        `  ${index + 1}. ${result.animationName} (${result.duration}s)`
      );
    });
  } catch (error) {
    console.error("❌ Error in advanced example:", error);
  }
}

async function threeJSExample() {
  console.log("\n🎮 Three.js Integration Example");

  const sdk = new MixamoSDK({
    apiKey: "mixamo2", // Default Mixamo API key
    timeout: 30000,
    retries: 3,
    authorization,
  });

  try {
    const currentCharacter = await sdk.getCurrentCharacter();
    const characterAssets = await sdk.loadCharacterAssets(
      currentCharacter.primary_character_id
    );

    // Convert to Three.js format (placeholder implementation)
    console.log("🔄 Converting character to Three.js format...");
    const threeJSCharacter = await sdk.convertCharacterToThreeJS(
      characterAssets
    );

    console.log("Three.js character structure:", {
      hasGeometry: threeJSCharacter.geometry !== null,
      hasMaterial: threeJSCharacter.material !== null,
      hasSkeleton: threeJSCharacter.skeleton !== null,
      animationCount: threeJSCharacter.animations?.length || 0,
    });

    // Note: In a real implementation, you would:
    // 1. Create THREE.Scene, THREE.Camera, THREE.Renderer
    // 2. Load the character mesh using threeJSCharacter.geometry and material
    // 3. Set up the skeleton for animation
    // 4. Create THREE.AnimationMixer and play animations

    console.log(`
📝 Three.js Integration Notes:
   When Three.js is properly integrated, you would:
   
   1. Create a Three.js scene:
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const renderer = new THREE.WebGLRenderer();
   
   2. Load the character:
      const mesh = new THREE.SkinnedMesh(
        threeJSCharacter.geometry,
        threeJSCharacter.material
      );
      mesh.skeleton = threeJSCharacter.skeleton;
      scene.add(mesh);
   
   3. Set up animation:
      const mixer = new THREE.AnimationMixer(mesh);
      const action = mixer.clipAction(threeJSCharacter.animations[0]);
      action.play();
   
   4. Render loop:
      function animate() {
        mixer.update(deltaTime);
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
    `);
  } catch (error) {
    console.error("❌ Error in Three.js example:", error);
  }
}

// Utility function to count skeleton joints
function countJoints(joint: any): number {
  let count = 1;
  if (joint.children && Array.isArray(joint.children)) {
    for (const child of joint.children) {
      count += countJoints(child);
    }
  }
  return count;
}

// Main execution
async function main() {
  console.log("🎭 Mixamo SDK Examples\n");
  console.log("=".repeat(50));

  await basicExample();
  await advancedExample();
  await threeJSExample();

  console.log("\n" + "=".repeat(50));
  console.log("✅ All examples completed!");
  console.log("\n💡 Next steps:");
  console.log("   - Install dependencies: npm install");
  console.log("   - Build the project: npm run build");
  console.log("   - Run your own implementation");
  console.log("   - Integrate with Three.js for 3D rendering");
}

// Run examples if this file is executed directly
// if (require.main === module) {
main().catch(console.error);
// }

export { basicExample, advancedExample, threeJSExample };
