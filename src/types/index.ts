/**
 * Core types for Mixamo API
 * Based on reverse engineering from HAR file analysis
 */

// Three.js types will be imported separately when Three.js is available
// import * as THREE from "three";

// Base API Response Types
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// Character Types
export interface MixamoCharacter {
  id: string;
  name: string;
  type: "system" | "user";
  thumbnail?: string;
}

export interface PrimaryCharacterResponse {
  primary_character_id: string;
  primary_character_name: string;
  primary_character_source: "system" | "user";
  secondary_character_id?: string;
}

// Animation/Product Types
export interface AnimationSearchParams {
  page?: number;
  limit?: number;
  query?: string;
  type?: "Motion" | "MotionPack" | "Motion,MotionPack";
  order?: string;
  genres?: string[]; // Combat, Adventure, Sport, Dance, Fantasy, Superhero, etc.
}

export interface AnimationResult {
  id: string;
  type: "Motion" | "MotionPack";
  name: string;
  description: string;
  category: string;
  character_type: "human";
  thumbnail: string;
  thumbnail_animated: string;
  motion_id: string;
  motions: MotionInfo[] | null;
  source: "system" | "user";
}

export interface MotionInfo {
  motion_id: string;
  product_id: string;
  name: string;
}

export interface AnimationSearchResponse {
  results: AnimationResult[];
  pagination: {
    limit: number;
    page: number;
    num_pages: number;
    num_results: number;
  };
}

export interface AnimationDetails {
  id: string;
  type: "Motion" | "MotionPack";
  name: string;
  description: string;
  character_type: "human";
  motion_id: string;
  details: {
    supports_inplace: boolean;
    loopable: boolean;
    default_frame_length: number;
    duration: number;
    gms_hash: GMSHash;
  };
  source: "system" | "user";
}

export interface GMSHash {
  "model-id": number;
  mirror: boolean;
  trim: [number, number];
  inplace: boolean;
  "arm-space": number;
  params: Array<[string, number]>;
}

// Character Asset Types
export interface VeroldAsset {
  type:
    | "texture2D"
    | "material"
    | "animation"
    | "geometry"
    | "node"
    | "skinned_mesh";
  id: string;
  name: string;
  resources?: AssetResource[];
  payload: any;
  parentAssetId: string;
  children?: string[];
}

export interface AssetResource {
  path: string;
  contentType: string;
  contentEncoding: string;
  contentLength: number;
  contentLengthIdentity: number;
  properties: Record<string, any>;
}

// Skeleton Types
export interface SkeletonData {
  name: null;
  joint: Joint;
  mapping: Mapping;
}

export interface Joint {
  name: string;
  x: number;
  y: number;
  z: number;
  children: Joint[];
}

export interface Mapping {
  joint_mappings: JointMapping[];
}

export interface JointMapping {
  target_joint_name: string;
  reference_joint_name: string;
}

// Animation Processing Types
export interface AnimationProcessRequest {
  gms_hash: Array<{
    "model-id": number;
    mirror: boolean;
    trim: [number, number];
    overdrive: number;
    params: string;
    "arm-space": number;
    inplace: boolean;
  }>;
  character_id: string;
  retargeting_payload: string;
  target_type: "skin";
}

export interface ProcessedAnimation {
  animationId: string;
  animationName: string;
  duration: number;
  processedData: string;
  characterId: string;
  options: AnimationOptions;
  loopable: boolean;
}

export interface AnimationOptions {
  mirror?: boolean;
  trim?: [number, number];
  overdrive?: number;
  armSpace?: number;
  inPlace?: boolean;
}

// Configuration Types
export interface MixamoConfig {
  apiKey?: string; // Default: 'mixamo2'
  baseURL?: string; // Default: 'https://www.mixamo.com'
  timeout?: number; // Default: 30000ms
  retries?: number; // Default: 3
  authorization?: string; // Bearer token for authentication
}

// Three.js Integration Types
// Will be properly typed when Three.js is installed
export interface ThreeJSAsset {
  geometry?: any; // THREE.BufferGeometry;
  material?: any; // THREE.Material | THREE.Material[];
  skeleton?: any; // THREE.Skeleton;
  animations?: any[]; // THREE.AnimationClip[];
}

// Error Types
export interface MixamoError extends Error {
  code?: string;
  status?: number;
  response?: any;
}

// Export utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Export utility type for required properties
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
