import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import {
  MixamoConfig,
  APIResponse,
  PrimaryCharacterResponse,
  AnimationSearchParams,
  AnimationSearchResponse,
  AnimationDetails,
  AnimationProcessRequest,
  VeroldAsset,
  SkeletonData,
  MixamoError,
} from "../types";

/**
 * Main API client for Mixamo backend
 * Handles authentication, rate limiting, and error handling
 */
export class MixamoAPIClient {
  private client: AxiosInstance;
  private config: Required<MixamoConfig>;

  constructor(config: MixamoConfig = {}) {
    this.config = {
      apiKey: config.apiKey || "mixamo2",
      baseURL: config.baseURL || "https://www.mixamo.com",
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      authorization: config.authorization || "",
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        "X-Api-Key": this.config.apiKey,
        Authorization: this.config.authorization,
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        Host: "www.mixamo.com",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0",
        Referer: "https://www.mixamo.com/",
        Origin: "https://www.mixamo.com",
        "sec-ch-ua":
          '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (config: any) => {
        console.debug(
          `[Mixamo SDK] ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          // Rate limiting - wait and retry
          console.warn("[Mixamo SDK] Rate limited, retrying in 2 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return this.client.request(error.config!);
        }

        const errorData = error.response?.data as any;
        const mixamoError: MixamoError = new Error(
          errorData?.message || error.message || "Unknown API error"
        );
        mixamoError.code = error.code;
        mixamoError.status = error.response?.status;
        mixamoError.response = error.response?.data;

        throw mixamoError;
      }
    );
  }

  /**
   * Get primary character information
   */
  async getPrimaryCharacter(): Promise<PrimaryCharacterResponse> {
    const response = await this.client.get<PrimaryCharacterResponse>(
      "/api/v1/characters/primary"
    );
    return response.data;
  }

  /**
   * Update primary character
   */
  async updatePrimaryCharacter(
    characterId: string
  ): Promise<PrimaryCharacterResponse> {
    const response = await this.client.post<PrimaryCharacterResponse>(
      "/api/v1/characters/update_primary",
      { primary_character_id: characterId },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    return response.data;
  }

  /**
   * Search for animations/motions
   */
  async searchAnimations(
    params: AnimationSearchParams = {}
  ): Promise<AnimationSearchResponse> {
    const searchParams = new URLSearchParams();

    searchParams.append("page", (params.page || 1).toString());
    searchParams.append("limit", (params.limit || 48).toString());
    searchParams.append("order", params.order || "");
    searchParams.append("type", params.type || "Motion,MotionPack");
    searchParams.append("query", params.query || "");

    if (params.genres && params.genres.length > 0) {
      searchParams.append("genres", params.genres.join(","));
    }

    const response = await this.client.get<AnimationSearchResponse>(
      `/api/v1/products?${searchParams.toString()}`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    return response.data;
  }

  /**
   * Get animation details
   */
  async getAnimationDetails(
    animationId: string,
    characterId: string
  ): Promise<AnimationDetails> {
    const response = await this.client.get<AnimationDetails>(
      `/api/v1/products/${animationId}?similar=0&character_id=${characterId}`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    return response.data;
  }

  /**
   * Get character asset data (verold.json)
   */
  async getCharacterAssets(characterId: string): Promise<VeroldAsset[]> {
    const response = await this.client.get<VeroldAsset[]>(
      `/api/v1/characters/${characterId}/assets/rigged/verold.json`
    );
    return response.data;
  }

  /**
   * Get character skeleton data
   */
  async getCharacterSkeleton(characterId: string): Promise<SkeletonData> {
    const response = await this.client.get<SkeletonData>(
      `/api/v1/characters/${characterId}/assets/rigged/skeleton.json`,
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );
    return response.data;
  }

  /**
   * Get geometry metadata
   */
  async getGeometryMetadata(
    characterId: string,
    geometryId: string
  ): Promise<any> {
    const response = await this.client.get(
      `/api/v1/characters/${characterId}/assets/rigged/${geometryId}-geo.json`
    );
    return response.data;
  }

  /**
   * Get geometry binary data
   */
  async getGeometryData(
    characterId: string,
    geometryId: string
  ): Promise<ArrayBuffer> {
    const response = await this.client.get<ArrayBuffer>(
      `/api/v1/characters/${characterId}/assets/rigged/${geometryId}-geo.bin`,
      {
        responseType: "arraybuffer",
      }
    );
    return response.data;
  }

  /**
   * Get texture file
   */
  async getTexture(
    characterId: string,
    textureId: string
  ): Promise<ArrayBuffer> {
    const response = await this.client.get<ArrayBuffer>(
      `/api/v1/characters/${characterId}/assets/rigged/${textureId}-tex.jpg`,
      {
        responseType: "arraybuffer",
      }
    );
    return response.data;
  }

  /**
   * Process animation - apply animation to character
   * This is the main animation generation endpoint
   */
  async processAnimation(request: AnimationProcessRequest): Promise<string> {
    const response = await this.client.post<string>(
      "/api/v1/animations/stream",
      request,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        responseType: "text",
      }
    );
    return response.data;
  }

  /**
   * Generic method for downloading any asset by URL
   */
  async downloadAsset(url: string): Promise<ArrayBuffer> {
    const response = await this.client.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
    });
    return response.data;
  }

  /**
   * Upload character file (for future implementation)
   * Note: This endpoint is not captured in the HAR file but would be needed for full functionality
   */
  async uploadCharacter(file: File | Buffer, filename: string): Promise<any> {
    // This would need to be implemented once we capture a character upload in HAR
    throw new Error("Character upload endpoint not yet reverse engineered");
  }

  /**
   * Get available animation genres
   */
  getAvailableGenres(): string[] {
    return [
      "Combat",
      "Adventure",
      "Sport",
      "Dance",
      "Fantasy",
      "Superhero",
      "Skinning Test",
    ];
  }

  /**
   * Utility method to build asset URL
   */
  buildAssetUrl(characterId: string, assetPath: string): string {
    return `${this.config.baseURL}/api/v1/characters/${characterId}/assets/rigged/${assetPath}`;
  }
}
