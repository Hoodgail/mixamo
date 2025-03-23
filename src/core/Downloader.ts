// Required dependencies
import * as fs from 'fs';
import axios, { type AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

// For TypeScript we'll use native EventEmitter instead of Qt signals
// We'd need to use a UI framework like Electron or a web framework for the UI components

const TOKEN = "eyJhbGciOiJSUzI1NiIsIng1dSI6Imltc19uYTEta2V5LWF0LTEuY2VyIiwia2lkIjoiaW1zX25hMS1rZXktYXQtMSIsIml0dCI6ImF0In0.eyJpZCI6IjE3NDI3MzA4NDc5OTJfNGVmZmU4ODYtY2NiMC00ZTJhLWFjYjQtMDE4Yjc4ZGZmZGUwX3V3MiIsInR5cGUiOiJhY2Nlc3NfdG9rZW4iLCJjbGllbnRfaWQiOiJtaXhhbW8xIiwidXNlcl9pZCI6IkREN0ZEODUxNTkzQjA3Q0UwQTQ5NUQyNUBBZG9iZUlEIiwic3RhdGUiOiIiLCJhcyI6Imltcy1uYTEiLCJhYV9pZCI6IkREN0ZEODUxNTkzQjA3Q0UwQTQ5NUQyNUBBZG9iZUlEIiwiY3RwIjowLCJmZyI6IlpKWTZWVTc1VlBQNU1IVUtOTVFWWUhBQTNBPT09PT09Iiwic2lkIjoiMTc0MjczMDg0NjU4NV9jZTgxOTYxNC00ZTIzLTQ3YjgtYmJiYi00ZDBmOGVjY2E1MjVfdWUxIiwicnRpZCI6IjE3NDI3MzA4NDc5OTJfNzI4NWViN2MtYWU4Ny00MDYwLWEwYmMtMGRjMzRkMzFhNTkzX3V3MiIsIm1vaSI6IjI0ZTcwOTZjIiwicGJhIjoiTWVkU2VjTm9FVixMb3dTZWMiLCJydGVhIjoiMTc0Mzk0MDQ0Nzk5MiIsImV4cGlyZXNfaW4iOiI4NjQwMDAwMCIsInNjb3BlIjoib3BlbmlkLEFkb2JlSUQiLCJjcmVhdGVkX2F0IjoiMTc0MjczMDg0Nzk5MiJ9.fgMsfL4tZLTMcW0LYwrhwa9S0E7YVIbAUVADgEqJ0Z3cKma2fXloptFjiymLlj8Sbuu1iOzZspDuPcfNn-vDnpAfS8_N1N2raI7q-flivdTA-ITVBOlgxo_7Bwtg1vOuWiOPQelWfTan7L8sEEz3TTr0Ifk8pnO0U5OEKp5i5A19B6SFjw-uomMbn4vh7UhKDChIIp1pz_q29MJR3NyLidt3f5qQgKPYBW6H-uUK6dRSvXHxrR6iycIqUXP_wn_OE6sRULH3pZDJ_Mm8IOFgCqGlmYImvMLDPI7WpcAZSeln-wRcmcIAsLbxOz8YT8Pq1MRVmx3O9usV4CN8ldke6A";

// Define the headers for all requests
const HEADERS = {
     "Accept": "application/json",
     "Accept-Encoding": "gzip, deflate, br, zstd",
     "Content-Type": "application/json",
     "X-Api-Key": "mixamo2",
     "X-Requested-With": "XMLHttpRequest",
     "Authorization": `Bearer ${TOKEN}`
};

// Define interfaces for better type safety
interface AnimationData {
     [key: string]: string;
}

interface ExportPayload {
     character_id: string;
     product_name: string;
     type: string;
     preferences: {
          format: string;
          fps?: string;
          reducekf?: string;
          mesh?: string;
          skin?: boolean;
     };
     gms_hash: any;
}

interface GmsHash {
     params: string | string[];
     overdrive: number;
     trim: number[];
     [key: string]: any;
}


export interface AnimationResult {
     id: string;
     type: string;
     description: string;
     category: string;
     character_type: string;
     name: string;
     thumbnail: string;
     thumbnail_animated: string;
     motion_id: string;
     motions: null;
     source: string;
}


/**
 * Bulk download animations from Mixamo.
 * 
 * Users can choose to download all animations in Mixamo (quite slow),
 * only those that contain a specific word (faster), or just the T-Pose.
 * 
 * The download mode is to be passed onto this class as an argument
 * when creating an instance.
 * 
 * The first step is to get the primary character ID and name.
 */
export class Downloader extends EventEmitter {
     // Path where animations will be saved
     private path: string;
     // Download mode: "all", "query", or "tpose"
     private mode: string;
     // Keyword for query mode
     private query: string | null;
     // Current task number for progress tracking
     private task: number = 1;
     // Flag to stop the process
     private stop: boolean = false;
     // The current product name (animation name)
     private product_name: string = "";
     // Axios instance for making HTTP requests
     private session: AxiosInstance;

     /**
      * Initialize the Mixamo Downloader object.
      * 
      * @param path Output folder path
      * @param mode Download mode ("all", "query" or "tpose")
      * @param query Keyword to be used as query when searching animations
      */
     constructor(path: string, mode: string, query: string | null = null) {
          super();
          this.path = path;
          this.mode = mode;
          this.query = query;

          // Create an axios instance for better performance
          this.session = axios.create({
               headers: HEADERS
          });
     }

     /**
      * Main method to start the download process
      */
     async run(): Promise<void> {
          try {
               // Get the primary character ID and name
               const character_id = await this.getPrimaryCharacterId();
               const character_name = await this.getPrimaryCharacterName();

               // If there's no character ID, it means that there was some problem
               // with the access token, so we better stop the code at this point
               if (!character_id) {
                    this.emit('finished');
                    return;
               }

               // DOWNLOAD MODE: TPOSE
               if (this.mode === "tpose") {
                    // The total amount of tasks to process is 1
                    this.emit('total_tasks', 1);

                    // Build the T-Pose payload
                    const tpose_payload = this.buildTposePayload(character_id, character_name);

                    // Export and download the T-Pose
                    const url = await this.exportAnimation(character_id, tpose_payload);

                    // Download the T-Pose
                    await this.downloadAnimation(url);

                    // Emit the 'finished' signal to let the UI know that worker is done
                    this.emit('finished');
                    return;
               }

               let anim_data: AnimationData;

               // DOWNLOAD MODE: ALL
               if (this.mode === "all") {
                    // Get animation IDs from the JSON file on disk
                    anim_data = await this.getAllAnimationsData();
               }
               // DOWNLOAD MODE: QUERY
               else if (this.mode === "query" && this.query) {
                    // Search for animation IDs according to the query entered by the user
                    anim_data = await this.getQueriedAnimationsData(this.query);
               } else {
                    throw new Error("Invalid mode or missing query parameter");
               }

               // The following code will be run for both the "all" and "query" modes
               // Iterate the animation IDs and names dictionary
               for (const [anim_id, anim_name] of Object.entries(anim_data)) {
                    // Check if the 'Stop' button has been pressed in the UI
                    if (this.stop) {
                         // Let the thread know that the worker has finished the job
                         this.emit('finished');
                         return;
                    }

                    // Build the animation payload, export and download it to disk
                    const anim_payload = await this.buildAnimationPayload(character_id, anim_id);
                    const url = await this.exportAnimation(character_id, anim_payload);

                    await this.downloadAnimation(url);
               }

               // Emit the 'finished' signal to let the UI know that worker is done
               this.emit('finished');
          } catch (error) {
               console.error("Error in MixamoDownloader:", error);
               this.emit('error', error);
               this.emit('finished');
          }
     }

     /**
      * Set the stop flag to true to interrupt the download process
      */
     setStop(): void {
          this.stop = true;
     }

     /**
      * Get the primary character ID (i.e: the one selected by the user)
      * 
      * @returns Primary character ID
      */
     private async getPrimaryCharacterId(): Promise<string> {
          try {
               // Send a GET request to the primary character endpoint
               const response = await this.session.get(
                    "https://www.mixamo.com/api/v1/characters/primary"
               );

               // Get the primary character ID
               return response.data.primary_character_id;
          } catch (error) {
               console.error("Error getting primary character ID:", error);
               return "";
          }
     }

     /**
      * Get the primary character name (i.e: the one selected by the user)
      * 
      * @returns Primary character name
      */
     private async getPrimaryCharacterName(): Promise<string> {
          try {
               // Send a GET request to the primary character endpoint
               const response = await this.session.get(
                    "https://www.mixamo.com/api/v1/characters/primary"
               );

               // Get the primary character name
               return response.data.primary_character_name;
          } catch (error) {
               console.error("Error getting primary character name:", error);
               return "";
          }
     }

     /**
      * Build the payload that will be used to export the T-Pose
      * 
      * @param character_id Primary character ID
      * @param character_name Primary character name
      * @returns Payload that will be used to export the T-Pose
      */
     private buildTposePayload(character_id: string, character_name: string): string {
          // Update the 'product_name' variable so that it can be used later
          // as the FBX file name (see the 'downloadAnimation' method)
          this.product_name = character_name;

          // Build the payload
          const payload: ExportPayload = {
               character_id: character_id,
               product_name: this.product_name,
               type: "Character",
               preferences: { format: "fbx7_2019", mesh: "t-pose" },
               gms_hash: null
          };

          // Convert the payload dictionary into a JSON string
          return JSON.stringify(payload);
     }

     /**
      * Get the ID and name of every animation found by the user query
      * 
      * @param query Search query
      * @returns Queried animation IDs and names
      */
     private async getQueriedAnimationsData(query: string): Promise<AnimationData> {
          // Initialize a counter for the page number
          let page_num = 1;

          // Parameters to be passed onto the endpoint
          const params = {
               limit: 96,
               page: page_num,
               type: "Motion",
               query: query
          };

          // Send a GET request to the animations endpoint
          let response = await this.session.get("https://www.mixamo.com/api/v1/products", {
               params: params
          });

          const data = response.data;

          // Total number of pages
          const num_pages = data.pagination.num_pages;

          // Initialize an array to store all animations found
          let animations: AnimationResult[] = [];

          // Make sure we read every page and grab the animations therein
          while (page_num <= num_pages) {
               params.page = page_num;
               response = await this.session.get("https://www.mixamo.com/api/v1/products", {
                    params: params
               });

               const pageData = response.data;

               // Add animations to the list and increase the page counter by one
               animations = animations.concat(pageData.results);
               page_num++;
          }

          // Initialize a dictionary to store IDs and names
          const anim_data: AnimationData = {};

          // Iterate animations found by the query and add them to the dictionary
          for (const animation of animations) {
               anim_data[animation.id] = animation.description;
          }

          // Let the UI know how many animations are to be downloaded
          this.emit('total_tasks', Object.keys(anim_data).length);

          return anim_data;
     }

     /**
      * Get the ID and name of every animation in Mixamo.
      * 
      * To speed things up, all animations have been previously exported to a
      * JSON file that we'll be reading locally. This is way faster than getting
      * all animations on the fly every time you run the tool.
      * 
      * @returns All animation IDs and names
      */
     private async getAllAnimationsData(): Promise<AnimationData> {
          // Initialize a dictionary to store all animation IDs and names
          let anim_data: AnimationData = {};

          // Read the local JSON file and dump its content to the dictionary
          const fileContent = await fs.promises.readFile("src/animations/all.json", "utf8");
          anim_data = JSON.parse(fileContent);

          // Let the UI know how many animations are to be downloaded
          this.emit('total_tasks', Object.keys(anim_data).length);

          return anim_data;
     }

     /**
      * Build the payload that will be used to export the animation
      * 
      * @param character_id Primary character ID
      * @param anim_id Animation ID
      * @returns Payload that will be used to export the animation
      */
     private async buildAnimationPayload(character_id: string, anim_id: string): Promise<string> {
          // Send a GET request to the animation-on-character endpoint
          const response = await this.session.get(
               `https://www.mixamo.com/api/v1/products/${anim_id}?similar=0&character_id=${character_id}`
          );

          // Get the animation description (make it public so that we can use it later)
          // We're using the description because some anims have the same name and this
          // would cause them to be overriden when downloading to disk
          this.product_name = response.data.description;

          // Get the animation type
          const type = response.data.type;

          // Set the animation preferences
          // NOTE: Changing the 'skin' key to true doesn't seem to have any effect
          const preferences = {
               "format": "fbx7_2019",
               "skin": false,
               "fps": "24",
               "reducekf": "0"
          };

          // Get the original 'gms_hash' property
          const gms_hash: GmsHash = response.data.details.gms_hash;

          // Read its 'params' and store their values
          const gms_hash_params = gms_hash.params;
          const param_values = Array.isArray(gms_hash_params)
               ? gms_hash_params.map(param => parseInt(param.slice(-1)))
               : [];

          // Build a 'params' string depending on how many params the animation has
          // For example, if there are two params (Overdrive and Emotion), and their
          // values are 1 and 0, the string will be "1,0"
          const params_string = param_values.join(",");

          // Update the 'gms_hash' properties with the ones Mixamo actually needs
          gms_hash.params = params_string;
          gms_hash.overdrive = 0;

          const trim_start = Array.isArray(gms_hash.trim) ? gms_hash.trim[0] : 0;
          const trim_end = Array.isArray(gms_hash.trim) ? gms_hash.trim[1] : 0;

          gms_hash.trim = [trim_start, trim_end];

          // Build the payload
          const payload: ExportPayload = {
               character_id: character_id,
               product_name: this.product_name,
               type: type,
               preferences: preferences,
               gms_hash: [gms_hash]
          };

          // Convert the payload dictionary into a JSON string
          return JSON.stringify(payload);
     }

     /**
      * Export the animation and retrieve the download link
      * 
      * @param character_id Primary character ID
      * @param payload Payload that will be used to export the animation
      * @returns URL to download the animation
      */
     private async exportAnimation(character_id: string, payload: string): Promise<string> {
          // Send a POST request to the export animations endpoint
          await this.session.post(
               "https://www.mixamo.com/api/v1/animations/export",
               payload
          );

          // Initialize a 'status' flag
          let status = null;

          // Check if the process is completed and retry if it's not
          while (status !== "completed") {
               // Add some delay between retries to avoid overflow
               await new Promise(resolve => setTimeout(resolve, 1000));

               // Send a GET request to the monitor endpoint
               const response = await this.session.get(
                    `https://www.mixamo.com/api/v1/characters/${character_id}/monitor`
               );

               // The loop will end as soon as the status is 'completed'
               status = response.data.status;
          }

          // Grab the download link from the response
          if (status === "completed") {
               const response = await this.session.get(
                    `https://www.mixamo.com/api/v1/characters/${character_id}/monitor`
               );
               const download_link = response.data.job_result;
               return download_link;
          }

          return "";
     }

     /**
      * Download the animation to disk
      * 
      * @param url URL to download the animation
      */
     private async downloadAnimation(url: string): Promise<void> {

          // Ensure this code is only run if a URL has been retrieved
          if (url) {
               // Send a GET request to the download link
               const response = await fetch(url);

               const arrayBuffer = await response.arrayBuffer();

               const data = Buffer.from(arrayBuffer);

               // Check if the output folder exists on disk. If it doesn't, create it
               if (this.path) {
                    try {
                         await fs.promises.access(this.path);
                    } catch (error) {
                         await fs.promises.mkdir(this.path, { recursive: true });
                    }

                    // Save the response into a new FBX file called after the animation name
                    await fs.promises.writeFile(`${this.path}/${this.product_name}.fbx`, data);
               }
               // If no output path has been set by the user, save the FBX to the cwd
               else {
                    await fs.promises.writeFile(`${this.product_name}.fbx`, data);
               }

               // Let the UI know that a task has been completed
               this.emit('current_task', this.task);
               // Increase the counter by one
               this.task++;
          }
     }
}
