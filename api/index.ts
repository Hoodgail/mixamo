import { MixamoSDK } from "../src/index";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

interface RequestWithAuth {
  authorization?: string;
}

/**
 * Mixamo Animation API Server
 * Built with Bun for high performance
 */

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Health check endpoint
    if (path === "/health") {
      return new Response("OK", {
        headers: { "Content-Type": "text/plain", ...corsHeaders },
      });
    }

    // API documentation endpoint
    if (path === "/") {
      return Response.json(
        {
          name: "Mixamo Animation API",
          version: "1.0.0",
          endpoints: {
            "GET /health": "Health check",
            "GET /search":
              "Search animations (query params: q, genres, page, limit)",
            "GET /animation/:id": "Get specific animation details",
            "POST /animation/:id/threejs": "Process animation for Three.js",
            "GET /animation/:id/download":
              "Download processed animation as JSON",
          },
          documentation:
            "Pass Authorization header with Bearer token from Mixamo",
        },
        { headers: corsHeaders }
      );
    }

    // Search animations endpoint
    if (path === "/search" && method === "GET") {
      const authorization = req.headers.get("Authorization");

      if (!authorization) {
        return Response.json(
          { error: "Authorization header required" },
          { status: 401, headers: corsHeaders }
        );
      }

      // Initialize SDK with auth
      const sdk = new MixamoSDK({ authorization });

      // Parse query parameters
      const query = url.searchParams.get("q") || "";
      const genresParam = url.searchParams.get("genres");
      const genres = genresParam ? genresParam.split(",") : [];
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = parseInt(url.searchParams.get("limit") || "20");

      console.log(
        `[API] Searching animations: query="${query}", genres=${genres.join(
          ","
        )}, page=${page}, limit=${limit}`
      );

      // Search animations
      const results = await sdk.searchAnimations({
        query,
        genres,
        page,
        limit,
        type: "Motion,MotionPack" as const,
      });

      // Transform results for Three.js compatibility
      const transformedResults = {
        results: results.map((animation) => ({
          ...animation,
          threejs_ready: true,
          download_url: `/animation/${animation.id}/download`,
          process_url: `/animation/${animation.id}/threejs`,
        })),
        pagination: {
          page,
          limit,
          total: results.length,
        },
      };

      return Response.json(transformedResults, { headers: corsHeaders });
    }

    // Get specific animation details
    if (
      path.startsWith("/animation/") &&
      !path.includes("/threejs") &&
      !path.includes("/download") &&
      method === "GET"
    ) {
      const authorization = req.headers.get("Authorization");

      if (!authorization) {
        return Response.json(
          { error: "Authorization header required" },
          { status: 401, headers: corsHeaders }
        );
      }

      const sdk = new MixamoSDK({ authorization });
      const animationId = path.split("/")[2];

      console.log(`[API] Getting animation details: ${animationId}`);

      // Get current character first
      const character = await sdk.getCurrentCharacter();
      const details = await sdk.getAnimationDetails(
        animationId,
        character.primary_character_id
      );

      return Response.json(
        {
          ...details,
          threejs_ready: true,
          download_url: `/animation/${animationId}/download`,
          process_url: `/animation/${animationId}/threejs`,
        },
        { headers: corsHeaders }
      );
    }

    // Process animation for Three.js
    if (path.includes("/threejs") && method === "POST") {
      const authorization = req.headers.get("Authorization");

      if (!authorization) {
        return Response.json(
          { error: "Authorization header required" },
          { status: 401, headers: corsHeaders }
        );
      }

      const sdk = new MixamoSDK({ authorization });
      const animationId = path.split("/")[2];

      // Parse options from request body
      const body = await req.json().catch(() => ({}));
      const options = {
        mirror: body.mirror || false,
        trim: body.trim || [0, 100],
        overdrive: body.overdrive || 0,
        armSpace: body.armSpace || 0,
        inPlace: body.inPlace || false,
      };

      console.log(
        `[API] Processing animation for Three.js: ${animationId}`,
        options
      );

      // Get character and process animation
      const character = await sdk.getCurrentCharacter();
      const processedAnimation = await sdk.applyAnimation(
        animationId,
        character.primary_character_id,
        options
      );

      // Get skeleton data via character assets
      const characterAssets = await sdk.loadCharacterAssets(
        character.primary_character_id
      );
      const skeletonData = characterAssets.skeleton;

      // Convert to Three.js format
      const threejsSkeleton = sdk.convertSkeletonToThreeJS(skeletonData);
      const threejsAnimation = sdk.convertAnimationDataToThreeJS(
        processedAnimation,
        skeletonData
      );

      // Extract serializable data
      const skeletonJson = sdk.extractSkeletonData(threejsSkeleton);
      const animationJson = sdk.extractAnimationData(threejsAnimation);

      // Create response with both skeleton and animation data
      const result = {
        id: animationId,
        name: processedAnimation.animationName,
        skeleton: skeletonJson,
        animation: animationJson,
        options: options,
        processed_at: new Date().toISOString(),
        three_js_compatible: true,
      };

      return Response.json(result, { headers: corsHeaders });
    }

    // Download processed animation as JSON file
    if (path.includes("/download") && method === "GET") {
      const authorization = req.headers.get("Authorization");

      if (!authorization) {
        return Response.json(
          { error: "Authorization header required" },
          { status: 401, headers: corsHeaders }
        );
      }

      const format = url.searchParams.get("format") || "json";
      const animationId = path.split("/")[2];

      // Use the same processing logic as above
      const sdk = new MixamoSDK({ authorization });

      console.log(
        `[API] Downloading animation: ${animationId} (format: ${format})`
      );

      const character = await sdk.getCurrentCharacter();
      const processedAnimation = await sdk.applyAnimation(
        animationId,
        character.primary_character_id
      );

      const characterAssets = await sdk.loadCharacterAssets(
        character.primary_character_id
      );
      const skeletonData = characterAssets.skeleton;
      const threejsSkeleton = sdk.convertSkeletonToThreeJS(skeletonData);
      const threejsAnimation = sdk.convertAnimationDataToThreeJS(
        processedAnimation,
        skeletonData
      );

      const result = {
        id: animationId,
        name: processedAnimation.animationName,
        skeleton: sdk.extractSkeletonData(threejsSkeleton),
        animation: sdk.extractAnimationData(threejsAnimation),
        processed_at: new Date().toISOString(),
      };

      // Return as downloadable file
      const filename = `${processedAnimation.animationName.replace(
        /\s+/g,
        "_"
      )}_threejs.json`;

      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
          ...corsHeaders,
        },
      });
    }

    // Batch process multiple animations
    if (path === "/batch/process" && method === "POST") {
      const authorization = req.headers.get("Authorization");

      if (!authorization) {
        return Response.json(
          { error: "Authorization header required" },
          { status: 401, headers: corsHeaders }
        );
      }

      const body = await req.json();
      const { animationIds, options = {} } = body;

      if (!Array.isArray(animationIds) || animationIds.length === 0) {
        return Response.json(
          { error: "animationIds array is required" },
          { status: 400, headers: corsHeaders }
        );
      }

      console.log(`[API] Batch processing ${animationIds.length} animations`);

      const sdk = new MixamoSDK({ authorization });
      const character = await sdk.getCurrentCharacter();
      const results: Array<{
        id: string;
        name?: string;
        status: string;
        download_url?: string;
        error?: string;
      }> = [];

      for (const animationId of animationIds) {
        try {
          const processed = await sdk.applyAnimation(
            animationId,
            character.primary_character_id,
            options
          );

          results.push({
            id: animationId,
            name: processed.animationName,
            status: "success",
            download_url: `/animation/${animationId}/download`,
          });
        } catch (error: any) {
          results.push({
            id: animationId,
            status: "error",
            error: error.message,
          });
        }
      }

      return Response.json(
        {
          processed: results.length,
          results,
        },
        { headers: corsHeaders }
      );
    }

    // Catch-all for unmatched routes
    return Response.json(
      {
        error: "Endpoint not found",
        available: "/search, /animation/:id, /health",
      },
      { status: 404, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[API] Request error:", error);
    return Response.json(
      { error: "Failed to process request", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

const port = process.env.PORT || 3002;

const server = Bun.serve({
  port: port,
  fetch: handleRequest,
  error(error) {
    console.error("[Server Error]:", error);
    return new Response(`Server Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  },
});

console.log(`🚀 Mixamo Animation API Server running on ${server.url}`);
console.log(`📚 API Documentation available at ${server.url}`);
console.log(`💡 Example: GET ${server.url}search?q=walk&genres=Adventure`);
