# Mixamo API

> **Complete Mixamo SDK and High-Performance API Server**  
> Reverse-engineered Three.js compatible animation library with production-ready Bun server

[![npm version](https://badge.fury.io/js/mixamo-api.svg)](https://badge.fury.io/js/mixamo-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Features

**🎮 Complete SDK**

- ✅ **Three.js Native**: Direct THREE.AnimationClip and THREE.Skeleton support
- ✅ **Full API Coverage**: Character management, animation search, processing
- ✅ **TypeScript**: Comprehensive type definitions
- ✅ **Robust**: Error handling, rate limiting, retry logic

**⚡ High-Performance API Server**

- ✅ **Ultra Fast**: Built with Bun (~160k req/s capability)
- ✅ **RESTful**: Clean API endpoints with OpenAPI documentation
- ✅ **CORS Enabled**: Works from any web application
- ✅ **Batch Processing**: Handle multiple animations simultaneously

**🎯 Three.js Integration**

- ✅ **Instant Ready**: Returns animations as Three.js compatible JSON
- ✅ **Complete Data**: Skeleton + Animation + Options in one response
- ✅ **No Processing**: Load directly into THREE.AnimationMixer

## 📦 Installation

```bash
# Install the complete package
npm install mixamo-api

# For Bun users (recommended for server)
bun add mixamo-api
```

## 🔑 Authentication

You need a valid Mixamo session token. **Get your token:**

1. Log into [Mixamo](https://www.mixamo.com/) in your browser
2. Open Developer Tools → Network tab
3. Make any request to Mixamo (search, click animation, etc.)
4. Copy the `Authorization` header value (starts with "Bearer")

```javascript
const MIXAMO_TOKEN = "Bearer eyJhbGciOiJSUzI1NiIs..."; // Your token
```

## 🎯 Quick Start

### SDK Usage

```javascript
import { MixamoSDK } from "mixamo-api";

const sdk = new MixamoSDK({
  authorization: "Bearer your-mixamo-token",
});

// Search for animations
const animations = await sdk.searchAnimations({
  query: "walk",
  genres: ["Adventure"],
  limit: 10,
});

// Get character and apply animation
const character = await sdk.getCurrentCharacter();
const processedAnimation = await sdk.applyAnimation(
  animations[0].id,
  character.primary_character_id,
  { inPlace: true, mirror: false }
);

// Convert to Three.js format
const characterAssets = await sdk.loadCharacterAssets(
  character.primary_character_id
);
const skeleton = sdk.convertSkeletonToThreeJS(characterAssets.skeleton);
const animationClip = sdk.convertAnimationDataToThreeJS(
  processedAnimation,
  characterAssets.skeleton
);

// Use in Three.js immediately
const mixer = new THREE.AnimationMixer(yourMesh);
const action = mixer.clipAction(animationClip);
action.play();
```

### API Server

```bash
# Start the server
npm run server
# or with hot reload
npm run server:dev

# Test the server
npm run server:test
```

**Server runs on `http://localhost:3002`**

```javascript
// Use the API endpoints
const response = await fetch(
  "http://localhost:3002/search?q=idle&genres=Combat",
  {
    headers: { Authorization: "Bearer your-token" },
  }
);

const animations = await response.json();

// Process animation for Three.js
const animation = await fetch(
  "http://localhost:3002/animation/ANIMATION_ID/threejs",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer your-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inPlace: true, mirror: false }),
  }
);

const { skeleton, animation: animData } = await animation.json();

// Load directly into Three.js
const animationClip = THREE.AnimationClip.parse(animData);
const mixer = new THREE.AnimationMixer(yourMesh);
const action = mixer.clipAction(animationClip);
action.play();
```

## 📖 API Reference

### SDK Methods

```typescript
import { MixamoSDK } from "mixamo-api";

const sdk = new MixamoSDK(config);

// Character Management
await sdk.getCurrentCharacter();
await sdk.loadCharacterAssets(characterId);
await sdk.setCharacter(characterId);

// Animation Search & Processing
await sdk.searchAnimations(params);
await sdk.getAnimationDetails(animationId, characterId);
await sdk.applyAnimation(animationId, characterId, options);

// Three.js Conversion
sdk.convertSkeletonToThreeJS(skeletonData);
sdk.convertAnimationDataToThreeJS(animationData, skeletonData);
sdk.extractSkeletonData(skeleton);
sdk.extractAnimationData(animationClip);

// Utilities
await sdk.testConnection();
await sdk.batchProcessAnimations(animationIds, options);
```

### API Server Endpoints

| Endpoint                  | Method | Purpose               | Example                             |
| ------------------------- | ------ | --------------------- | ----------------------------------- |
| `/health`                 | GET    | Health check          | `curl http://localhost:3002/health` |
| `/search`                 | GET    | Search animations     | `?q=walk&genres=Adventure&limit=10` |
| `/animation/:id`          | GET    | Get animation details | `/animation/12345`                  |
| `/animation/:id/threejs`  | POST   | Process for Three.js  | Body: `{inPlace: true}`             |
| `/animation/:id/download` | GET    | Download as JSON      | Returns downloadable file           |
| `/batch/process`          | POST   | Batch process         | Body: `{animationIds: [...]}`       |

## 🎮 Three.js Integration Examples

### Complete Character Animation Setup

```javascript
import { MixamoSDK } from "mixamo-api";
import * as THREE from "three";

async function setupAnimatedCharacter() {
  const sdk = new MixamoSDK({ authorization: "Bearer your-token" });

  // 1. Search and select animation
  const animations = await sdk.searchAnimations({ query: "walk", limit: 1 });
  const animation = animations[0];

  // 2. Process animation
  const character = await sdk.getCurrentCharacter();
  const processedAnimation = await sdk.applyAnimation(
    animation.id,
    character.primary_character_id,
    { inPlace: false, mirror: false }
  );

  // 3. Load character assets
  const assets = await sdk.loadCharacterAssets(character.primary_character_id);

  // 4. Convert to Three.js
  const skeleton = sdk.convertSkeletonToThreeJS(assets.skeleton);
  const animationClip = sdk.convertAnimationDataToThreeJS(
    processedAnimation,
    assets.skeleton
  );

  // 5. Create Three.js scene
  const geometry = new THREE.BufferGeometry(); // Load your character geometry
  const material = new THREE.MeshLambertMaterial();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.bind(skeleton);

  // 6. Setup animation
  const mixer = new THREE.AnimationMixer(mesh);
  const action = mixer.clipAction(animationClip);
  action.play();

  // 7. Animation loop
  function animate() {
    const delta = clock.getDelta();
    mixer.update(delta);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  return { mesh, mixer, action };
}
```

### Using the API Server

```javascript
// Client-side usage with fetch
async function loadAnimationFromAPI() {
  const API_BASE = "http://localhost:3002";
  const token = "Bearer your-token";

  // Search animations
  const searchResponse = await fetch(`${API_BASE}/search?q=dance&limit=5`, {
    headers: { Authorization: token },
  });
  const { results } = await searchResponse.json();

  // Process animation
  const animationResponse = await fetch(
    `${API_BASE}/animation/${results[0].id}/threejs`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inPlace: true, mirror: false }),
    }
  );

  const { skeleton, animation } = await animationResponse.json();

  // Use in Three.js
  const loader = new THREE.ObjectLoader();
  const skeletonObj = loader.parse(skeleton);
  const animationClip = THREE.AnimationClip.parse(animation);

  return { skeleton: skeletonObj, animation: animationClip };
}
```

### Batch Processing Multiple Animations

```javascript
async function batchProcessAnimations() {
  const sdk = new MixamoSDK({ authorization: "Bearer your-token" });

  // Search for multiple animations
  const combatAnimations = await sdk.searchAnimations({
    genres: ["Combat"],
    limit: 10,
  });

  // Batch process all animations
  const character = await sdk.getCurrentCharacter();
  const processed = await sdk.batchProcessAnimations(
    combatAnimations.map((a) => a.id),
    { inPlace: true, mirror: false }
  );

  // Convert all to Three.js format
  const assets = await sdk.loadCharacterAssets(character.primary_character_id);
  const animations = processed.map((p) =>
    sdk.convertAnimationDataToThreeJS(p, assets.skeleton)
  );

  return animations; // Array of THREE.AnimationClip objects
}
```

## 🛠 Development & Examples

```bash
# Run basic SDK example
npm run example

# Run API client example
npm run example:api

# Run API demonstration
npm run demo

# Start development server with hot reload
npm run server:dev

# Run tests
npm test

# Build for production
npm run build
```

## 📊 Identified API Endpoints

Based on reverse engineering analysis of 35 HTTP requests:

### **Core Endpoints**

- `GET /api/v1/characters/primary` - Get primary character
- `POST /api/v1/characters/update_primary` - Set primary character
- `GET /api/v1/products` - Search animations with filters
- `GET /api/v1/products/{id}` - Get animation details
- `POST /api/v1/animations/stream` - Process/apply animation
- `GET /api/v1/characters/{id}/assets/rigged/verold.json` - Character 3D assets
- `GET /api/v1/characters/{id}/assets/rigged/skeleton.json` - Character skeleton

### **Asset Endpoints**

- `GET /api/v1/characters/{id}/assets/rigged/{id}-geo.json` - Geometry metadata
- `GET /api/v1/characters/{id}/assets/rigged/{id}-geo.bin` - Geometry binary data
- `GET /api/v1/characters/{id}/assets/rigged/{id}-tex.jpg` - Texture files

### **Authentication**

- **Header**: `X-Api-Key: mixamo2`
- **Header**: `Authorization: Bearer {jwt-token}`
- **Required**: Standard web headers (Referer, Origin, User-Agent)

## 🚨 **Known Limitations**

### **Authentication Required**

This package requires valid Mixamo session credentials:

- ❌ **Current Issue**: Returns "OAuth token is not valid" without proper session
- ✅ **Solution**: Get authorization token from browser as shown above
- ✅ **Workaround**: Use browser extension or session token extraction

### **Rate Limiting**

- Mixamo enforces rate limits on API requests
- The SDK includes automatic retry logic for 429 responses
- Recommended: Use reasonable delays between requests

### **Legal Compliance**

- ⚠️ **Unofficial**: Not affiliated with Adobe/Mixamo
- ⚠️ **Educational**: For research and educational purposes
- ⚠️ **Terms**: Respect Mixamo's Terms of Service
- ⚠️ **Rate Limits**: Don't abuse the API

## 📈 Performance

**SDK Performance:**

- ⚡ **Type Safe**: Full TypeScript support with comprehensive interfaces
- ⚡ **Efficient**: Optimized HTTP client with connection pooling
- ⚡ **Robust**: Automatic retries and error handling

**API Server Performance:**

- ⚡ **Speed**: Built with Bun for maximum performance (~160k req/s)
- ⚡ **Memory**: Low memory usage with native HTTP handling
- ⚡ **Scalability**: Efficient streaming of large animation files

## 🔧 Configuration

### Environment Variables

```bash
# API Server
PORT=3002
NODE_ENV=production

# SDK
MIXAMO_TOKEN="Bearer your-token-here"
```

### TypeScript Configuration

```typescript
import { MixamoSDK, MixamoConfig } from "mixamo-api";

const config: MixamoConfig = {
  authorization: "Bearer your-token",
  baseURL: "https://www.mixamo.com",
  timeout: 30000,
  retries: 3,
};

const sdk = new MixamoSDK(config);
```

## 📚 Resources

- **Three.js Documentation**: [threejs.org/docs](https://threejs.org/docs/)
- **Bun Documentation**: [bun.sh/docs](https://bun.sh/docs)
- **Mixamo**: [mixamo.com](https://www.mixamo.com/)
- **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is an **unofficial** SDK created through reverse engineering for educational and research purposes. It is not affiliated with Adobe or Mixamo. Users should:

- ✅ Respect Mixamo's Terms of Service
- ✅ Use responsibly and avoid API abuse
- ✅ Consider this for educational/research purposes
- ✅ Understand this may break if Mixamo changes their API

## 🙏 Acknowledgments

- **Adobe Mixamo** - For providing the amazing animation service
- **Three.js Team** - For the excellent 3D library
- **Bun Team** - For the high-performance JavaScript runtime
- **Community** - For reverse engineering efforts and contributions

---

Made with ❤️ by the Mixamo API Community
