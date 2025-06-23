import { MixamoAPIClient } from "./api/client";
import {
  CharacterManager,
  CharacterAssetBundle,
} from "./managers/character-manager";
import { AnimationManager } from "./managers/animation-manager";
import {
  convertSkeletonToThreeJS,
  convertAnimationToThreeJS,
  extractSkeletonData,
  extractAnimationData,
  createSkeletonStructure,
} from "./utils/threejs-converter";
import {
  MixamoConfig,
  AnimationSearchParams,
  AnimationResult,
  AnimationDetails,
  AnimationOptions,
  ProcessedAnimation,
  ThreeJSAsset,
  PrimaryCharacterResponse,
  SkeletonData,
} from "./types";
import * as THREE from "three";

/**
 * Main Mixamo SDK Class
 *
 * This is the primary entry point for the Mixamo SDK. It provides a unified interface
 * to interact with Mixamo's backend API for character management, animation search,
 * and Three.js integration.
 *
 * @example
 * ```typescript
 * import { MixamoSDK } from 'mixamo-sdk';
 *
 * const sdk = new MixamoSDK({
 *   apiKey: 'mixamo2', // Default API key
 *   timeout: 30000
 * });
 *
 * // Search for idle animations
 * const animations = await sdk.searchAnimations({ query: 'idle' });
 *
 * // Get current character
 * const character = await sdk.getCurrentCharacter();
 *
 * // Apply animation to character
 * const processedAnimation = await sdk.applyAnimation(
 *   animations[0].id,
 *   character.primary_character_id
 * );
 * ```
 */
export class MixamoSDK {
  private apiClient: MixamoAPIClient;
  private characterManager: CharacterManager;
  private animationManager: AnimationManager;

  constructor(config: MixamoConfig) {
    this.apiClient = new MixamoAPIClient(config);
    this.characterManager = new CharacterManager(this.apiClient);
    this.animationManager = new AnimationManager(this.apiClient);
  }

  // =====================
  // Character Management
  // =====================

  /**
   * Get the current primary character
   */
  async getCurrentCharacter(): Promise<PrimaryCharacterResponse> {
    return this.characterManager.getPrimaryCharacter();
  }

  /**
   * Set a character as primary
   */
  async setCurrentCharacter(
    characterId: string
  ): Promise<PrimaryCharacterResponse> {
    return this.characterManager.setPrimaryCharacter(characterId);
  }

  /**
   * Load all assets for a character (geometry, textures, skeleton)
   */
  async loadCharacterAssets(
    characterId: string
  ): Promise<CharacterAssetBundle> {
    return this.characterManager.loadCharacterAssets(characterId);
  }

  /**
   * Convert character assets to Three.js format
   */
  async convertCharacterToThreeJS(
    assetBundle: CharacterAssetBundle
  ): Promise<ThreeJSAsset> {
    return this.characterManager.convertToThreeJS(assetBundle);
  }

  // ====================
  // Animation Management
  // ====================

  /**
   * Search for animations with filters
   */
  async searchAnimations(
    params: AnimationSearchParams = {}
  ): Promise<AnimationResult[]> {
    const response = await this.animationManager.searchAnimations(params);
    return response.results;
  }

  /**
   * Search animations by text query
   */
  async searchAnimationsByQuery(query: string): Promise<AnimationResult[]> {
    return this.animationManager.searchByQuery(query);
  }

  /**
   * Search animations by genre
   */
  async searchAnimationsByGenre(genres: string[]): Promise<AnimationResult[]> {
    return this.animationManager.searchByGenre(genres);
  }

  /**
   * Get popular/featured animations
   */
  async getPopularAnimations(limit: number = 48): Promise<AnimationResult[]> {
    return this.animationManager.getPopularAnimations(limit);
  }

  /**
   * Get detailed information about an animation
   */
  async getAnimationDetails(
    animationId: string,
    characterId: string
  ): Promise<AnimationDetails> {
    return this.animationManager.getAnimationDetails(animationId, characterId);
  }

  /**
   * Get all individual animations from a motion pack
   */
  async expandMotionPack(
    motionPack: AnimationResult
  ): Promise<AnimationResult[]> {
    return this.animationManager.getMotionPackAnimations(motionPack);
  }

  /**
   * Apply an animation to a character
   */
  async applyAnimation(
    animationId: string,
    characterId: string,
    options: AnimationOptions = {}
  ): Promise<ProcessedAnimation> {
    const details = await this.animationManager.getAnimationDetails(
      animationId,
      characterId
    );
    return this.animationManager.applyAnimationToCharacter(
      details,
      characterId,
      options
    );
  }

  /**
   * Convert processed animation to Three.js format
   */
  async convertAnimationToThreeJS(
    processedAnimation: ProcessedAnimation
  ): Promise<ThreeJSAsset> {
    return this.animationManager.parseAnimationForThreeJS(processedAnimation);
  }

  // ===============================
  // Three.js Conversion Methods
  // ===============================

  /**
   * Convert character skeleton to Three.js format
   */
  convertSkeletonToThreeJS(skeletonData: SkeletonData): THREE.Skeleton {
    return convertSkeletonToThreeJS(skeletonData);
  }

  /**
   * Convert animation to Three.js AnimationClip
   */
  convertAnimationDataToThreeJS(
    animationData: ProcessedAnimation,
    skeletonData: SkeletonData
  ): THREE.AnimationClip {
    return convertAnimationToThreeJS(animationData, skeletonData);
  }

  /**
   * Extract serializable skeleton data
   */
  extractSkeletonData(skeleton: THREE.Skeleton) {
    return extractSkeletonData(skeleton);
  }

  /**
   * Extract serializable animation data
   */
  extractAnimationData(animationClip: THREE.AnimationClip) {
    return extractAnimationData(animationClip);
  }

  /**
   * Create Three.js skeleton structure
   */
  createSkeletonStructure(skeletonData: SkeletonData) {
    return createSkeletonStructure(skeletonData);
  }

  // ===============================
  // Complete Workflow Methods
  // ===============================

  /**
   * Complete workflow: Load character with animation
   * This combines character loading and animation application in one method
   */
  async loadCharacterWithAnimation(
    characterId: string,
    animationId: string,
    animationOptions: AnimationOptions = {}
  ): Promise<CompleteAsset> {
    console.log("Starting complete character + animation workflow...");

    // Load character assets and apply animation in parallel where possible
    const [characterAssets, animationDetails] = await Promise.all([
      this.loadCharacterAssets(characterId),
      this.getAnimationDetails(animationId, characterId),
    ]);

    // Apply animation to character
    const processedAnimation =
      await this.animationManager.applyAnimationToCharacter(
        animationDetails,
        characterId,
        animationOptions
      );

    // Convert to Three.js (when implemented)
    const [characterThreeJS, animationThreeJS] = await Promise.all([
      this.convertCharacterToThreeJS(characterAssets),
      this.convertAnimationToThreeJS(processedAnimation),
    ]);

    return {
      character: {
        id: characterId,
        assets: characterAssets,
        threeJS: characterThreeJS,
      },
      animation: {
        details: animationDetails,
        processed: processedAnimation,
        threeJS: animationThreeJS,
      },
      ready: true,
    };
  }

  /**
   * Batch process multiple animations for a character
   */
  async batchProcessAnimations(
    characterId: string,
    animationIds: string[],
    options: AnimationOptions = {}
  ): Promise<ProcessedAnimation[]> {
    const requests = animationIds.map((id) => ({
      animationId: id,
      characterId,
      options,
    }));

    return this.animationManager.batchProcessAnimations(requests);
  }

  // ===================
  // Utility Methods
  // ===================

  /**
   * Get available animation genres
   */
  getAvailableGenres(): string[] {
    return this.animationManager.getAvailableGenres();
  }

  /**
   * Check if SDK is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentCharacter();
      return true;
    } catch (error) {
      console.error("SDK connection test failed:", error);
      return false;
    }
  }

  /**
   * Get direct access to managers (for advanced usage)
   */
  get managers() {
    return {
      character: this.characterManager,
      animation: this.animationManager,
      api: this.apiClient,
    };
  }
}

// Supporting interfaces for the main SDK
export interface CompleteAsset {
  character: {
    id: string;
    assets: CharacterAssetBundle;
    threeJS: ThreeJSAsset;
  };
  animation: {
    details: AnimationDetails;
    processed: ProcessedAnimation;
    threeJS: ThreeJSAsset;
  };
  ready: boolean;
}

// Export all types and classes for external use
export * from "./types";
export * from "./api/client";
export * from "./managers/character-manager";
export * from "./managers/animation-manager";

// Export as default for ES modules
export default MixamoSDK;

/**
 * Legal Disclaimer
 *
 * This is an unofficial SDK created for educational and research purposes.
 * It is not affiliated with or endorsed by Adobe/Mixamo.
 *
 * Users are responsible for:
 * - Respecting Mixamo's Terms of Service
 * - Not using this for commercial purposes without proper licensing
 * - Understanding that this SDK may break if Mixamo changes their API
 *
 * The reverse engineering was done through analysis of publicly available
 * HTTP requests and responses. No proprietary code was accessed or copied.
 */
