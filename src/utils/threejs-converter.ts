import * as THREE from "three";
import { SkeletonData, Joint, ProcessedAnimation } from "../types";

/**
 * Three.js Conversion Utilities
 * Converts Mixamo data structures to Three.js format
 */

/**
 * Convert Mixamo skeleton data to Three.js Skeleton
 */
export function convertSkeletonToThreeJS(
  skeletonData: SkeletonData
): THREE.Skeleton {
  // Create bones from joint hierarchy
  const bones: THREE.Bone[] = [];
  const boneMap = new Map<string, THREE.Bone>();

  // First pass: create all bones
  function createBone(joint: Joint): THREE.Bone {
    const bone = new THREE.Bone();
    bone.name = joint.name;
    bone.position.set(joint.x, joint.y, joint.z);

    bones.push(bone);
    boneMap.set(joint.name, bone);

    return bone;
  }

  // Second pass: build hierarchy
  function buildHierarchy(joint: Joint, parentBone?: THREE.Bone): THREE.Bone {
    const bone = boneMap.get(joint.name) || createBone(joint);

    if (parentBone) {
      parentBone.add(bone);
    }

    // Process children
    if (joint.children && joint.children.length > 0) {
      for (const childJoint of joint.children) {
        buildHierarchy(childJoint, bone);
      }
    }

    return bone;
  }

  // Start with root joint
  const rootBone = buildHierarchy(skeletonData.joint);

  // Create skeleton
  const skeleton = new THREE.Skeleton(bones);

  return skeleton;
}

/**
 * Convert Mixamo animation data to Three.js AnimationClip
 */
export function convertAnimationToThreeJS(
  animationData: ProcessedAnimation,
  skeletonData: SkeletonData
): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];

  // For now, create a basic placeholder animation
  // In a real implementation, you would parse the binary animation data
  const duration = animationData.duration || 1.0;
  const fps = 30;
  const frameCount = Math.floor(duration * fps);

  // Create basic rotation tracks for demonstration
  function createBasicTracks(joint: Joint, parentName = "") {
    const boneName = joint.name;
    const times: number[] = [];
    const values: number[] = [];

    // Generate keyframe times
    for (let i = 0; i <= frameCount; i++) {
      times.push(i / fps);
    }

    // Generate quaternion values (identity quaternion for now)
    for (let i = 0; i <= frameCount; i++) {
      // Basic rotation animation - could be replaced with actual animation data
      const t = i / frameCount;
      const rotation = new THREE.Quaternion();
      rotation.setFromEuler(new THREE.Euler(0, t * Math.PI * 2, 0));

      values.push(rotation.x, rotation.y, rotation.z, rotation.w);
    }

    // Create rotation track
    const rotationTrack = new THREE.QuaternionKeyframeTrack(
      `${boneName}.quaternion`,
      times,
      values
    );
    tracks.push(rotationTrack);

    // Process children
    if (joint.children && joint.children.length > 0) {
      for (const childJoint of joint.children) {
        createBasicTracks(childJoint, boneName);
      }
    }
  }

  // Generate tracks for all joints
  createBasicTracks(skeletonData.joint);

  // Create animation clip
  const clip = new THREE.AnimationClip(
    animationData.animationName,
    duration,
    tracks
  );

  return clip;
}

/**
 * Create a basic skeleton structure for Three.js
 * This is a simplified version that creates the bone hierarchy
 */
export function createSkeletonStructure(skeletonData: SkeletonData): {
  bones: THREE.Bone[];
  skeleton: THREE.Skeleton;
  boneMap: Map<string, THREE.Bone>;
} {
  const bones: THREE.Bone[] = [];
  const boneMap = new Map<string, THREE.Bone>();

  function processBone(joint: Joint, parent?: THREE.Bone): THREE.Bone {
    const bone = new THREE.Bone();
    bone.name = joint.name;
    bone.position.set(joint.x, joint.y, joint.z);

    bones.push(bone);
    boneMap.set(joint.name, bone);

    if (parent) {
      parent.add(bone);
    }

    // Process children
    if (joint.children && joint.children.length > 0) {
      for (const childJoint of joint.children) {
        processBone(childJoint, bone);
      }
    }

    return bone;
  }

  const rootBone = processBone(skeletonData.joint);
  const skeleton = new THREE.Skeleton(bones);

  return {
    bones,
    skeleton,
    boneMap,
  };
}

/**
 * Extract animation data for Three.js format
 * This creates a structured representation that can be serialized
 */
export function extractAnimationData(animationClip: THREE.AnimationClip): {
  name: string;
  duration: number;
  tracks: Array<{
    name: string;
    type: string;
    times: number[];
    values: number[];
  }>;
} {
  return {
    name: animationClip.name,
    duration: animationClip.duration,
    tracks: animationClip.tracks.map((track) => ({
      name: track.name,
      type: track.constructor.name,
      times: Array.from(track.times),
      values: Array.from(track.values),
    })),
  };
}

/**
 * Extract skeleton data for Three.js format
 * This creates a structured representation that can be serialized
 */
export function extractSkeletonData(skeleton: THREE.Skeleton): {
  bones: Array<{
    name: string;
    position: [number, number, number];
    quaternion: [number, number, number, number];
    scale: [number, number, number];
    parent?: string;
  }>;
  boneInverses: number[][];
} {
  const bonesData = skeleton.bones.map((bone) => {
    const position = bone.position.toArray() as [number, number, number];
    const quaternion = bone.quaternion.toArray() as [
      number,
      number,
      number,
      number
    ];
    const scale = bone.scale.toArray() as [number, number, number];

    return {
      name: bone.name,
      position,
      quaternion,
      scale,
      parent:
        bone.parent && bone.parent.type === "Bone"
          ? (bone.parent as THREE.Bone).name
          : undefined,
    };
  });

  const boneInverses = skeleton.boneInverses.map((matrix) => matrix.toArray());

  return {
    bones: bonesData,
    boneInverses,
  };
}
