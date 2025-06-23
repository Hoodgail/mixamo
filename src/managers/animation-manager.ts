import { MixamoAPIClient } from "../api/client";
import {
  AnimationSearchParams,
  AnimationSearchResponse,
  AnimationResult,
  AnimationDetails,
  AnimationProcessRequest,
  AnimationOptions,
  ProcessedAnimation,
  GMSHash,
  ThreeJSAsset,
} from "../types";

/**
 * Animation Manager
 * Handles animation search, selection, processing, and conversion
 */
export class AnimationManager {
  private apiClient: MixamoAPIClient;

  constructor(apiClient: MixamoAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Search for animations with various filters
   */
  async searchAnimations(
    params: AnimationSearchParams = {}
  ): Promise<AnimationSearchResponse> {
    try {
      return await this.apiClient.searchAnimations(params);
    } catch (error) {
      throw new Error(`Failed to search animations: ${error}`);
    }
  }

  /**
   * Search animations by query string
   */
  async searchByQuery(
    query: string,
    options: Partial<AnimationSearchParams> = {}
  ): Promise<AnimationResult[]> {
    const params: AnimationSearchParams = {
      query,
      page: 1,
      limit: 48,
      ...options,
    };

    const response = await this.searchAnimations(params);
    return response.results;
  }

  /**
   * Search animations by genre
   */
  async searchByGenre(
    genres: string[],
    options: Partial<AnimationSearchParams> = {}
  ): Promise<AnimationResult[]> {
    const params: AnimationSearchParams = {
      genres,
      page: 1,
      limit: 48,
      ...options,
    };

    const response = await this.searchAnimations(params);
    return response.results;
  }

  /**
   * Get popular animations (no specific query)
   */
  async getPopularAnimations(limit: number = 48): Promise<AnimationResult[]> {
    const response = await this.searchAnimations({
      page: 1,
      limit,
      type: "Motion,MotionPack",
    });
    return response.results;
  }

  /**
   * Get animation details with processing parameters
   */
  async getAnimationDetails(
    animationId: string,
    characterId: string
  ): Promise<AnimationDetails> {
    try {
      return await this.apiClient.getAnimationDetails(animationId, characterId);
    } catch (error) {
      throw new Error(`Failed to get animation details: ${error}`);
    }
  }

  /**
   * Get all animations from a motion pack
   */
  async getMotionPackAnimations(
    motionPack: AnimationResult
  ): Promise<AnimationResult[]> {
    if (motionPack.type !== "MotionPack" || !motionPack.motions) {
      throw new Error("Invalid motion pack or no motions available");
    }

    // Motion pack contains individual motion IDs
    const animations: AnimationResult[] = [];

    for (const motion of motionPack.motions) {
      // Create individual animation entries based on motion pack data
      animations.push({
        id: motion.product_id,
        type: "Motion",
        name: motion.name,
        description: `Motion from ${motionPack.name} pack`,
        category: motionPack.category,
        character_type: "human",
        thumbnail: motionPack.thumbnail,
        thumbnail_animated: motionPack.thumbnail_animated,
        motion_id: motion.motion_id,
        motions: null,
        source: motionPack.source,
      });
    }

    return animations;
  }

  /**
   * Apply animation to character and get processed result
   */
  async applyAnimationToCharacter(
    animationDetails: AnimationDetails,
    characterId: string,
    options: AnimationOptions = {}
  ): Promise<ProcessedAnimation> {
    try {
      const gmsHash = this.buildGMSHash(
        animationDetails.details.gms_hash,
        options
      );

      const request: AnimationProcessRequest = {
        gms_hash: [gmsHash],
        character_id: characterId,
        retargeting_payload: "",
        target_type: "skin",
      };

      console.log("Processing animation with parameters:", {
        animationId: animationDetails.id,
        characterId,
        options,
      });

      const result = await this.apiClient.processAnimation(request);

      return {
        animationId: animationDetails.id,
        animationName: animationDetails.name,
        characterId,
        processedData: result,
        options,
        duration: animationDetails.details.duration,
        loopable: animationDetails.details.loopable,
      };
    } catch (error) {
      throw new Error(`Failed to apply animation to character: ${error}`);
    }
  }

  /**
   * Build GMS hash for animation processing
   */
  private buildGMSHash(originalHash: GMSHash, options: AnimationOptions): any {
    return {
      "model-id": originalHash["model-id"],
      mirror: options.mirror ?? originalHash.mirror,
      trim: options.trim ?? originalHash.trim,
      overdrive: options.overdrive ?? 0,
      params: (options.overdrive ?? 0).toString(),
      "arm-space": options.armSpace ?? originalHash["arm-space"],
      inplace: options.inPlace ?? originalHash.inplace,
    };
  }

  /**
   * Parse animation data for Three.js
   * This would convert Mixamo's animation format to Three.js AnimationClip
   */
  async parseAnimationForThreeJS(
    processedAnimation: ProcessedAnimation
  ): Promise<ThreeJSAsset> {
    console.log("Parsing animation for Three.js:", {
      animationName: processedAnimation.animationName,
      duration: processedAnimation.duration,
      loopable: processedAnimation.loopable,
    });

    // TODO: Implement actual parsing of Mixamo animation data to Three.js format
    // This would involve:
    // 1. Parsing the processed animation data (likely FBX or proprietary format)
    // 2. Extracting keyframes and animation tracks
    // 3. Converting to THREE.AnimationClip format
    // 4. Setting up bone mappings

    return {
      geometry: null,
      material: null,
      skeleton: null,
      animations: [], // Array of THREE.AnimationClip
    };
  }

  /**
   * Get available animation genres
   */
  getAvailableGenres(): string[] {
    return this.apiClient.getAvailableGenres();
  }

  /**
   * Filter animations by duration
   */
  filterByDuration(
    animations: AnimationResult[],
    minDuration?: number,
    maxDuration?: number
  ): AnimationResult[] {
    // This would require getting details for each animation to check duration
    // For now, return all animations
    console.log(
      `Filtering ${animations.length} animations by duration (${minDuration}-${maxDuration}s)`
    );
    return animations;
  }

  /**
   * Filter animations by whether they support in-place movement
   */
  async filterByInPlace(
    animations: AnimationResult[],
    characterId: string
  ): Promise<AnimationResult[]> {
    const inPlaceAnimations: AnimationResult[] = [];

    for (const animation of animations) {
      try {
        const details = await this.getAnimationDetails(
          animation.id,
          characterId
        );
        if (details.details.supports_inplace) {
          inPlaceAnimations.push(animation);
        }
      } catch (error) {
        console.warn(
          `Failed to get details for animation ${animation.id}:`,
          error
        );
      }
    }

    return inPlaceAnimations;
  }

  /**
   * Filter animations by loopability
   */
  async filterByLoopable(
    animations: AnimationResult[],
    characterId: string
  ): Promise<AnimationResult[]> {
    const loopableAnimations: AnimationResult[] = [];

    for (const animation of animations) {
      try {
        const details = await this.getAnimationDetails(
          animation.id,
          characterId
        );
        if (details.details.loopable) {
          loopableAnimations.push(animation);
        }
      } catch (error) {
        console.warn(
          `Failed to get details for animation ${animation.id}:`,
          error
        );
      }
    }

    return loopableAnimations;
  }

  /**
   * Batch process multiple animations
   */
  async batchProcessAnimations(
    requests: Array<{
      animationId: string;
      characterId: string;
      options?: AnimationOptions;
    }>
  ): Promise<ProcessedAnimation[]> {
    const results: ProcessedAnimation[] = [];

    for (const request of requests) {
      try {
        const details = await this.getAnimationDetails(
          request.animationId,
          request.characterId
        );
        const processed = await this.applyAnimationToCharacter(
          details,
          request.characterId,
          request.options
        );
        results.push(processed);
      } catch (error) {
        console.error(
          `Failed to process animation ${request.animationId}:`,
          error
        );
      }
    }

    return results;
  }
}

export interface AnimationFilter {
  query?: string;
  genres?: string[];
  minDuration?: number;
  maxDuration?: number;
  loopable?: boolean;
  inPlace?: boolean;
  type?: "Motion" | "MotionPack" | "Motion,MotionPack";
}

export interface AnimationBatch {
  name: string;
  animations: ProcessedAnimation[];
  totalDuration: number;
  characterId: string;
}
