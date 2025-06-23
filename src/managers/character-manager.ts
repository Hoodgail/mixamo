import { MixamoAPIClient } from "../api/client";
import {
  PrimaryCharacterResponse,
  VeroldAsset,
  SkeletonData,
  ThreeJSAsset,
  MixamoError,
} from "../types";

/**
 * Character Manager
 * Handles character operations, asset loading, and Three.js integration
 */
export class CharacterManager {
  private apiClient: MixamoAPIClient;

  constructor(apiClient: MixamoAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get the current primary character
   */
  async getPrimaryCharacter(): Promise<PrimaryCharacterResponse> {
    try {
      return await this.apiClient.getPrimaryCharacter();
    } catch (error) {
      throw new Error(`Failed to get primary character: ${error}`);
    }
  }

  /**
   * Set a character as primary
   */
  async setPrimaryCharacter(
    characterId: string
  ): Promise<PrimaryCharacterResponse> {
    try {
      return await this.apiClient.updatePrimaryCharacter(characterId);
    } catch (error) {
      throw new Error(`Failed to set primary character: ${error}`);
    }
  }

  /**
   * Load all character assets (geometry, textures, skeleton)
   */
  async loadCharacterAssets(
    characterId: string
  ): Promise<CharacterAssetBundle> {
    try {
      const [assets, skeleton] = await Promise.all([
        this.apiClient.getCharacterAssets(characterId),
        this.apiClient.getCharacterSkeleton(characterId),
      ]);

      return {
        characterId,
        assets,
        skeleton,
        geometry: await this.loadGeometryAssets(characterId, assets),
        textures: await this.loadTextureAssets(characterId, assets),
      };
    } catch (error) {
      throw new Error(`Failed to load character assets: ${error}`);
    }
  }

  /**
   * Load geometry data for the character
   */
  private async loadGeometryAssets(
    characterId: string,
    assets: VeroldAsset[]
  ): Promise<GeometryAsset[]> {
    const geometryAssets = assets.filter((asset) => asset.type === "geometry");
    const results: GeometryAsset[] = [];

    for (const asset of geometryAssets) {
      try {
        // Extract geometry ID from the first resource path
        const resource = asset.resources?.[0];
        if (!resource) continue;

        const geometryId = resource.path.split("-geo.")[0];

        const [metadata, binaryData] = await Promise.all([
          this.apiClient.getGeometryMetadata(characterId, geometryId),
          this.apiClient.getGeometryData(characterId, geometryId),
        ]);

        results.push({
          id: asset.id,
          name: asset.name,
          metadata,
          binaryData,
          geometryId,
        });
      } catch (error) {
        console.warn(`Failed to load geometry asset ${asset.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Load texture data for the character
   */
  private async loadTextureAssets(
    characterId: string,
    assets: VeroldAsset[]
  ): Promise<TextureAsset[]> {
    const textureAssets = assets.filter((asset) => asset.type === "texture2D");
    const results: TextureAsset[] = [];

    for (const asset of textureAssets) {
      try {
        // Load all texture variants (full resolution and low-res)
        const textureVariants: TextureVariant[] = [];

        if (asset.resources) {
          for (const resource of asset.resources) {
            const textureId = resource.path.split("-tex")[0];
            const data = await this.apiClient.getTexture(
              characterId,
              textureId
            );

            textureVariants.push({
              path: resource.path,
              data,
              width: resource.properties.width,
              height: resource.properties.height,
              contentType: resource.contentType,
              size: resource.contentLength,
            });
          }
        }

        results.push({
          id: asset.id,
          name: asset.name,
          type: this.getTextureType(asset.name),
          variants: textureVariants,
          originalWidth: asset.payload.originalWidth,
          originalHeight: asset.payload.originalHeight,
        });
      } catch (error) {
        console.warn(`Failed to load texture asset ${asset.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Determine texture type from name
   */
  private getTextureType(name: string): TextureType {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("diffuse")) return "diffuse";
    if (nameLower.includes("normal")) return "normal";
    if (nameLower.includes("specular")) return "specular";
    if (nameLower.includes("glossiness")) return "roughness";
    if (nameLower.includes("emission") || nameLower.includes("emissive"))
      return "emissive";
    return "unknown";
  }

  /**
   * Convert character assets to Three.js compatible format
   * This method would integrate with Three.js loaders when available
   */
  async convertToThreeJS(
    assetBundle: CharacterAssetBundle
  ): Promise<ThreeJSAsset> {
    // This would implement the actual Three.js conversion
    // For now, return a placeholder structure

    console.log("Converting character assets to Three.js format...");
    console.log(`Character ID: ${assetBundle.characterId}`);
    console.log(`Geometry assets: ${assetBundle.geometry.length}`);
    console.log(`Texture assets: ${assetBundle.textures.length}`);
    console.log(
      `Skeleton joints: ${this.countSkeletonJoints(assetBundle.skeleton.joint)}`
    );

    // TODO: Implement actual Three.js geometry, material, and skeleton creation
    return {
      geometry: null, // THREE.BufferGeometry
      material: null, // THREE.Material[]
      skeleton: null, // THREE.Skeleton
      animations: [], // THREE.AnimationClip[]
    };
  }

  /**
   * Count total joints in skeleton hierarchy
   */
  private countSkeletonJoints(joint: any): number {
    let count = 1; // Count current joint
    if (joint.children) {
      for (const child of joint.children) {
        count += this.countSkeletonJoints(child);
      }
    }
    return count;
  }

  /**
   * Get character asset URLs for direct download
   */
  getAssetUrls(characterId: string, assets: VeroldAsset[]): AssetUrlMap {
    const urls: AssetUrlMap = {
      geometry: [],
      textures: [],
      materials: [],
    };

    for (const asset of assets) {
      if (asset.resources) {
        for (const resource of asset.resources) {
          const url = this.apiClient.buildAssetUrl(characterId, resource.path);

          switch (asset.type) {
            case "geometry":
              urls.geometry.push({
                name: asset.name,
                url,
                path: resource.path,
              });
              break;
            case "texture2D":
              urls.textures.push({
                name: asset.name,
                url,
                path: resource.path,
              });
              break;
            case "material":
              urls.materials.push({
                name: asset.name,
                url,
                path: resource.path,
              });
              break;
          }
        }
      }
    }

    return urls;
  }
}

// Supporting types
export interface CharacterAssetBundle {
  characterId: string;
  assets: VeroldAsset[];
  skeleton: SkeletonData;
  geometry: GeometryAsset[];
  textures: TextureAsset[];
}

export interface GeometryAsset {
  id: string;
  name: string;
  geometryId: string;
  metadata: any;
  binaryData: ArrayBuffer;
}

export interface TextureAsset {
  id: string;
  name: string;
  type: TextureType;
  variants: TextureVariant[];
  originalWidth: number;
  originalHeight: number;
}

export interface TextureVariant {
  path: string;
  data: ArrayBuffer;
  width: number;
  height: number;
  contentType: string;
  size: number;
}

export type TextureType =
  | "diffuse"
  | "normal"
  | "specular"
  | "roughness"
  | "emissive"
  | "unknown";

export interface AssetUrlMap {
  geometry: Array<{ name: string; url: string; path: string }>;
  textures: Array<{ name: string; url: string; path: string }>;
  materials: Array<{ name: string; url: string; path: string }>;
}
