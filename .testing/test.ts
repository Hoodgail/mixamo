export interface Har {
  log: Log;
}

export interface Log {
  version: string;
  creator: Creator;
  pages: Page[];
  entries: Entry[];
}

export interface Creator {
  name: string;
  version: string;
}

export interface Entry {
  _connectionId: string;
  _initiator?: Initiator;
  _priority: Priority;
  _resourceType: ResourceType;
  cache: Cache;
  connection: string;
  pageref: Pageref;
  request: Request;
  response: Response;
  serverIPAddress: ServerIPAddress;
  startedDateTime: Date;
  time: number;
  timings: { [key: string]: number };
}

export interface Initiator {
  type: Type;
  stack: Stack;
}

export interface Stack {
  callFrames: CallFrame[];
  parentId?: ParentID;
  parent?: StackParent;
}

export interface CallFrame {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export interface StackParent {
  description: Description;
  callFrames: CallFrame[];
  parent: PurpleParent;
}

export enum Description {
  Await = "await",
  PromiseThen = "Promise.then",
  SetTimeout = "setTimeout",
}

export interface PurpleParent {
  description: Description;
  callFrames: CallFrame[];
  parentId?: ParentID;
  parent?: FluffyParent;
}

export interface FluffyParent {
  description: Description;
  callFrames: CallFrame[];
  parent?: TentacledParent;
}

export interface TentacledParent {
  description: Description;
  callFrames: CallFrame[];
  parent: StickyParent;
}

export interface StickyParent {
  description: Description;
  callFrames: CallFrame[];
  parent: IndigoParent;
}

export interface IndigoParent {
  description: Description;
  callFrames: CallFrame[];
  parent: IndecentParent;
}

export interface IndecentParent {
  description: Description;
  callFrames: CallFrame[];
  parent: HilariousParent;
}

export interface HilariousParent {
  description: Description;
  callFrames: CallFrame[];
  parent: AmbitiousParent;
}

export interface AmbitiousParent {
  description: Description;
  callFrames: CallFrame[];
  parent?: CunningParent;
}

export interface CunningParent {
  description: Description;
  callFrames: CallFrame[];
}

export interface ParentID {
  id: string;
  debuggerId: DebuggerID;
}

export enum DebuggerID {
  The74972942406578552639169302512182680359 = "7497294240657855263.-9169302512182680359",
}

export enum Type {
  Script = "script",
}

export enum Priority {
  High = "High",
}

export enum ResourceType {
  Fetch = "fetch",
}

export interface Cache {}

export enum Pageref {
  Page2 = "page_2",
}

export interface Request {
  method: Method;
  url: string;
  httpVersion: HTTPVersion;
  headers: Header[];
  queryString: Header[];
  cookies: any[];
  headersSize: number;
  bodySize: number;
  postData?: PostData;
}

export interface Header {
  name: string;
  value: string;
}

export enum HTTPVersion {
  HTTP20 = "http/2.0",
}

export enum Method {
  Get = "GET",
  Post = "POST",
}

export interface PostData {
  mimeType: MIMEType;
  text: string;
}

export enum MIMEType {
  ApplicationJSON = "application/json",
  TextEventStream = "text/event-stream",
  XUnknown = "x-unknown",
}

export interface Response {
  status: number;
  statusText: string;
  httpVersion: HTTPVersion;
  headers: Header[];
  cookies: any[];
  content: Content;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  _transferSize: number;
  _error: null;
  _fetchedViaServiceWorker: boolean;
}

export interface Content {
  size: number;
  mimeType: MIMEType;
  text: string;
}

export enum ServerIPAddress {
  The2606470044006812202F = "[2606:4700:4400::6812:202f]",
}

export interface Page {
  startedDateTime: Date;
  id: Pageref;
  title: string;
  pageTimings: PageTimings;
}

export interface PageTimings {
  onContentLoad: number;
  onLoad: number;
}

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} from "quicktype-core";

// Function to count JSON parameters recursively
function countJsonParameters(obj: any): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== "object") return 1;

  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countJsonParameters(item), 0);
  }

  return Object.keys(obj).reduce(
    (sum, key) => sum + 1 + countJsonParameters(obj[key]),
    0
  );
}

// Function to generate TypeScript interface using quicktype
async function generateTypeScriptInterface(
  jsonString: string,
  interfaceName: string
): Promise<string> {
  try {
    const jsonInput = jsonInputForTargetLanguage("typescript");
    await jsonInput.addSource({
      name: interfaceName,
      samples: [jsonString],
    });

    const inputData = new InputData();
    inputData.addInput(jsonInput);

    const result = await quicktype({
      inputData,
      lang: "typescript",
      rendererOptions: {
        "just-types": "true",
      },
    });

    return result.lines.join("\n");
  } catch (error) {
    console.error(
      `Error generating TypeScript interface for ${interfaceName}:`,
      error
    );
    return `// Error generating TypeScript interface: ${error}`;
  }
}

// Function to filter and clean HAR data
function filterAndCleanHar(harData: Har): Har {
  const filteredEntries = harData.log.entries
    // .filter(entry => entry.request.url.startsWith('https://mixamo.com'))
    .filter(
      (entry) =>
        entry.request.url.includes("mixamo.com") ||
        entry.request.url.includes("accounts.google.com")
    )
    .map((entry) => {
      const { _initiator, ...cleanedEntry } = entry;
      return cleanedEntry as Entry;
    });

  const cleanedHar: Har = {
    ...harData,
    log: {
      ...harData.log,
      entries: filteredEntries,
    },
  };

  return cleanedHar;
}

// Function to write large response to file and return file reference
function writeLargeResponseToFile(
  content: string,
  requestIndex: number,
  contentType: string,
  size: number
): string {
  // Create responses directory if it doesn't exist
  const responsesDir = join("responses");
  if (!existsSync(responsesDir)) {
    mkdirSync(responsesDir, { recursive: true });
  }

  // Determine file extension based on content type
  let extension = "txt";
  if (contentType.includes("json")) {
    extension = "json";
  } else if (contentType.includes("html")) {
    extension = "html";
  } else if (contentType.includes("javascript")) {
    extension = "js";
  } else if (contentType.includes("css")) {
    extension = "css";
  } else if (contentType.includes("xml")) {
    extension = "xml";
  } else if (contentType.includes("event-stream")) {
    extension = "sse";
  }

  // Create filename with request index and size info
  const filename = `request-${
    requestIndex + 1
  }-response-${size}bytes.${extension}`;
  const filepath = join(responsesDir, filename);

  // Write content to file
  try {
    writeFileSync(filepath, content);
    console.log(`📄 Wrote large response to: ${filepath}`);
    return `responses/${filename}`;
  } catch (error) {
    console.error(`❌ Error writing response file: ${error}`);
    return `Error: Could not write response file - ${error}`;
  }
}

import data from "./har.json";

const har = data as unknown as Har;

const cleanedHar = filterAndCleanHar(har);

// Function to format HAR data as readable markdown for LLM consumption
async function formatHarToMarkdown(harData: Har): Promise<string> {
  const entries = harData.log.entries;
  let markdown = `# Mixamo API Requests\n\n`;
  markdown += `**Total Requests:** ${entries.length}\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;

  for (const [index, entry] of entries.entries()) {
    const { request, response, startedDateTime, serverIPAddress } = entry;

    markdown += `## Request ${index + 1}\n\n`;
    markdown += `**Timestamp:** ${startedDateTime}\n`;
    markdown += `**Server IP:** ${serverIPAddress}\n\n`;

    // Request section
    markdown += `### 📤 Request\n\n`;
    markdown += `**Method:** \`${request.method}\`\n`;
    markdown += `**URL:** \`${request.url}\`\n`;
    markdown += `**HTTP Version:** ${request.httpVersion}\n\n`;

    // Request headers
    if (request.headers.length > 0) {
      markdown += `**Headers:**\n`;
      request.headers.forEach((header) => {
        // Skip less important headers for cleaner output
        if (
          ![
            "accept-encoding",
            "accept-language",
            "cache-control",
            "sec-fetch-dest",
            "sec-fetch-mode",
            "sec-fetch-site",
          ].includes(header.name.toLowerCase())
        ) {
          markdown += `- \`${header.name}\`: ${header.value}\n`;
        }
      });
      markdown += `\n`;
    }

    // Query parameters
    if (request.queryString.length > 0) {
      markdown += `**Query Parameters:**\n`;
      request.queryString.forEach((param) => {
        markdown += `- \`${param.name}\`: ${param.value}\n`;
      });
      markdown += `\n`;
    }

    // Request body
    if (request.postData) {
      markdown += `**Request Body:**\n`;
      markdown += `- **Content-Type:** ${request.postData.mimeType}\n`;

      if (request.postData.text) {
        try {
          // Try to format JSON nicely
          if (request.postData.mimeType === "application/json") {
            const jsonData = JSON.parse(request.postData.text);
            markdown += `\`\`\`json\n${JSON.stringify(
              jsonData,
              null,
              2
            )}\n\`\`\`\n\n`;
          } else {
            markdown += `\`\`\`\n${request.postData.text}\n\`\`\`\n\n`;
          }
        } catch {
          markdown += `\`\`\`\n${request.postData.text}\n\`\`\`\n\n`;
        }
      }
    }

    // Response section
    markdown += `### 📥 Response\n\n`;
    markdown += `**Status:** ${response.status} ${response.statusText}\n`;
    markdown += `**HTTP Version:** ${response.httpVersion}\n\n`;

    // Response headers
    if (response.headers.length > 0) {
      markdown += `**Headers:**\n`;
      response.headers.forEach((header) => {
        // Skip less important headers for cleaner output
        if (
          !["date", "server", "x-request-id", "cf-ray", "alt-svc"].includes(
            header.name.toLowerCase()
          )
        ) {
          markdown += `- \`${header.name}\`: ${header.value}\n`;
        }
      });
      markdown += `\n`;
    }

    // Response body
    if (response.content.text) {
      markdown += `**Response Body:**\n`;
      markdown += `- **Content-Type:** ${response.content.mimeType}\n`;
      markdown += `- **Size:** ${response.content.size} bytes\n`;

      // Check if request was JSON or response is JSON
      const requestIsJson = request.postData?.mimeType === "application/json";
      const responseIsJson = response.content.mimeType === "application/json";
      const shouldTreatAsJson = responseIsJson || requestIsJson;

      try {
        // Handle JSON responses with quicktype for large/complex data
        if (shouldTreatAsJson) {
          // Add note if treating as JSON because request was JSON
          if (requestIsJson && !responseIsJson) {
            markdown += `- **Note:** Treating response as JSON because request content-type was JSON\n`;
          }

          let jsonData;
          let jsonParseSuccess = false;
          try {
            jsonData = JSON.parse(response.content.text);
            jsonParseSuccess = true;
          } catch (jsonParseError) {
            // If JSON parsing fails, fall back to treating as plain text
            markdown += `- **JSON Parse Error:** ${jsonParseError}\n`;
            markdown += `- **Falling back to plain text format**\n\n`;

            if (response.content.size > 1024) {
              const responseFile = writeLargeResponseToFile(
                response.content.text,
                index,
                response.content.mimeType,
                response.content.size
              );
              markdown += `\n*Response was too big (${response.content.size} bytes > 1KB) - saved to file*\n`;
              markdown += `**File:** \`./${responseFile}\`\n\n`;
            } else {
              markdown += `\`\`\`\n${response.content.text}\n\`\`\`\n\n`;
            }
          }

          // Only continue with JSON processing if parsing was successful
          if (jsonParseSuccess) {
            const paramCount = countJsonParameters(jsonData);
            const sizeOver1KB = response.content.size > 1024;
            const paramsOver100 = paramCount > 100;

            markdown += `- **Parameters:** ${paramCount}\n`;

            // Use quicktype if JSON has over 100 parameters OR response size is over 1KB
            if (sizeOver1KB || paramsOver100) {
              markdown += `\n**Large/Complex JSON Response Detected:**\n`;
              if (sizeOver1KB) {
                markdown += `- Size: ${response.content.size} bytes > 1KB\n`;
              }
              if (paramsOver100) {
                markdown += `- Parameters: ${paramCount} > 100\n`;
              }

              // Generate TypeScript interface using quicktype
              const interfaceName = `Request${index + 1}Response`;
              console.log(
                `⚡ Generating TypeScript interface for ${interfaceName} (${paramCount} parameters, ${response.content.size} bytes)`
              );
              const tsInterface = await generateTypeScriptInterface(
                response.content.text,
                interfaceName
              );

              markdown += `\n**Generated TypeScript Interface:**\n`;
              markdown += `\`\`\`typescript\n${tsInterface}\n\`\`\`\n\n`;

              // Still show JSON but write large responses to file
              if (sizeOver1KB) {
                const formattedJson = JSON.stringify(jsonData, null, 2);
                const responseFile = writeLargeResponseToFile(
                  formattedJson,
                  index,
                  "application/json",
                  response.content.size
                );
                markdown += `**Large JSON Response - saved to file:**\n`;
                markdown += `**File:** \`./${responseFile}\`\n\n`;

                // Show small sample in markdown
                const sampleJson = formattedJson.substring(0, 500);
                markdown += `**JSON Sample (first 500 chars):**\n`;
                markdown += `\`\`\`json\n${sampleJson}...\n\`\`\`\n\n`;
              } else {
                markdown += `**Full JSON:**\n`;
                markdown += `\`\`\`json\n${JSON.stringify(
                  jsonData,
                  null,
                  2
                )}\n\`\`\`\n\n`;
              }
            } else {
              // Standard JSON formatting for smaller responses
              markdown += `\`\`\`json\n${JSON.stringify(
                jsonData,
                null,
                2
              )}\n\`\`\`\n\n`;
            }
          } // End of jsonParseSuccess conditional block
        } else if (response.content.mimeType === "text/event-stream") {
          // Handle server-sent events format
          if (response.content.size > 1024) {
            const responseFile = writeLargeResponseToFile(
              response.content.text,
              index,
              response.content.mimeType,
              response.content.size
            );
            markdown += `\n*Response was too big (${response.content.size} bytes > 1KB) - saved to file*\n`;
            markdown += `**File:** \`./${responseFile}\`\n\n`;

            // Show small sample in markdown
            const sampleContent = response.content.text.substring(0, 500);
            markdown += `**Event Stream Sample (first 500 chars):**\n`;
            markdown += `\`\`\`\n${sampleContent}...\n\`\`\`\n\n`;
          } else {
            markdown += `\`\`\`\n${response.content.text}\n\`\`\`\n\n`;
          }
        } else {
          // Handle other content types
          if (response.content.size > 1024) {
            const responseFile = writeLargeResponseToFile(
              response.content.text,
              index,
              response.content.mimeType,
              response.content.size
            );
            markdown += `\n*Response was too big (${response.content.size} bytes > 1KB) - saved to file*\n`;
            markdown += `**File:** \`./${responseFile}\`\n\n`;

            // Show small sample in markdown
            const sampleContent = response.content.text.substring(0, 500);
            markdown += `**Content Sample (first 500 chars):**\n`;
            markdown += `\`\`\`\n${sampleContent}...\n\`\`\`\n\n`;
          } else {
            markdown += `\`\`\`\n${response.content.text}\n\`\`\`\n\n`;
          }
        }
      } catch (error) {
        markdown += `\n*Error parsing response: ${error}*\n`;
        if (response.content.size > 1024) {
          const responseFile = writeLargeResponseToFile(
            response.content.text,
            index,
            response.content.mimeType,
            response.content.size
          );
          markdown += `*Response was too big (${response.content.size} bytes > 1KB) - saved to file*\n`;
          markdown += `**File:** \`./${responseFile}\`\n\n`;

          // Show small sample in markdown
          const sampleContent = response.content.text.substring(0, 500);
          markdown += `**Error Response Sample (first 500 chars):**\n`;
          markdown += `\`\`\`\n${sampleContent}...\n\`\`\`\n\n`;
        } else {
          markdown += `\`\`\`\n${response.content.text}\n\`\`\`\n\n`;
        }
      }
    }

    markdown += `---\n\n`;
  }

  return markdown;
}

// Generate markdown format and write files
(async () => {
  console.log("🔍 Processing HAR file and generating TypeScript interfaces...");
  const markdownOutput = await formatHarToMarkdown(cleanedHar);

  // Write cleaned data to new JSON file
  try {
    writeFileSync("./cleaned.har.json", JSON.stringify(cleanedHar, null, 2));
    writeFileSync("./cleaned.md", markdownOutput);
    console.log("✅ Successfully created filtered HAR file: cleaned.har.json");
    console.log("✅ Successfully created markdown file: cleaned.md");
    console.log(`📊 Original entries: ${har.log.entries.length}`);
    console.log(`📊 Filtered entries: ${cleanedHar.log.entries.length}`);
    console.log(
      `🔗 Only keeping requests to: https://mixamo.com/ or https://accounts.google.com`
    );
    console.log(
      `📁 Large responses (>1KB) are saved to ./.testing/responses/ directory`
    );
  } catch (error) {
    console.error("❌ Error writing files:", error);
  }
})();
