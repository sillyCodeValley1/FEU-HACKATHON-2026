import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

// Load component catalog data from the scraper output
let mockCatalog: any[] = [];
try {
  const rawData = fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf-8');
  const parsedData = JSON.parse(rawData);
  mockCatalog = parsedData.map((item: any, idx: number) => ({
    id: item.sku || String(idx),
    sku: item.sku || String(idx),
    name: item.title,
    category: 'Component', // Default category as scraper doesn't provide one
    price: item.price || 0,
    stock: item.stock !== null ? item.stock : (item.available ? 10 : 0), // Estimate if null but available
    description: item.variant !== 'Default Title' ? item.variant : 'Genuine CircuitRocks component',
    url: item.url
  }));
} catch (e) {
  console.warn('Failed to load catalog.json, using fallback mock data.');
  mockCatalog = [
    { id: '1', name: 'Arduino Uno R3', category: 'Microcontroller', price: 1450.00, stock: 50, description: 'Standard microcontroller board for beginners.' },
    { id: '2', name: 'ESP32 Development Board', category: 'Microcontroller', price: 580.00, stock: 120, description: 'Wi-Fi & Bluetooth MCU, great for IoT.' },
    { id: '3', name: 'Ultrasonic Sensor HC-SR04', category: 'Sensor', price: 230.00, stock: 300, description: 'Distance measuring sensor.' },
    { id: '4', name: 'L298N Motor Driver', category: 'Module', price: 320.00, stock: 85, description: 'Dual H-bridge motor driver.' },
    { id: '5', name: '18650 Li-ion Battery 3000mAh', category: 'Power', price: 405.00, stock: 200, description: 'Rechargeable power source.' },
    { id: '6', name: 'Soil Moisture Sensor', category: 'Sensor', price: 145.00, stock: 150, description: 'Analog soil moisture sensor for plants.' },
    { id: '7', name: '5V Relay Module', category: 'Module', price: 205.00, stock: 200, description: '1-channel relay module for switching high power.' },
    { id: '8', name: 'Mini Water Pump 5V', category: 'Actuator', price: 290.00, stock: 90, description: 'Submersible water pump.' },
    { id: '9', name: 'Jumper Wires (M-M) x40', category: 'Wiring', price: 175.00, stock: 500, description: 'Male to male jumper wires for breadboards.' },
    { id: '10', name: 'Half-Size Breadboard', category: 'Prototyping', price: 260.00, stock: 150, description: 'Standard 400 tie-point breadboard.' }
  ];
}

const SYSTEM_PROMPT = `
You are CircuitPal AI, a specialized electronics project planning assistant. 

Your primary task is NOT to recommend products from CircuitRocks's available components immediately. 

Follow this process exactly: 

STEP 1 — Analyze the Project 
Read the user's request and determine what they are trying to build. 
Think like an electronics engineer. 
Identify: 
* Required hardware components 
* Power requirements 
* Sensors 
* Actuators 
* Controllers 
* Communication modules 
* Supporting components 

Generate a complete Bill of Materials (BOM) based purely on engineering requirements. 
DO NOT consider CircuitRocks's available components during this step. 
DO NOT attempt to force CircuitRocks's components into the BOM. 
The BOM should represent what is actually needed to build the project. 

--- 

STEP 2 — Component Matching 
After generating the ideal BOM: 
Compare every required component against CircuitRocks's Available Components. 
For each component: 
* If a suitable item exists in CircuitRocks's available components: 
  * Add it to "matched_components". Ensure you include the "stock", and "sku" properties from CircuitRocks's data. 
* If no suitable item exists: 
  * Add it to "missing_components" and include a "purchase_link" to an external site (e.g. Shopee, Lazada, Amazon, Adafruit) where it can be bought.

Do not invent CircuitRocks items. 
Do not claim unavailable components exist. 

--- 

STEP 3 — Project Planning 
Generate a practical build plan using the identified components. 
Include: 
* Hardware Acquisition 
* Circuit Assembly 
* Programming 
* Testing 
* Integration 

--- 

CIRCUITROCKS AVAILABLE COMPONENTS 
${JSON.stringify(mockCatalog, null, 2)}

--- 

OUTPUT FORMAT 
Return ONLY valid JSON. 

{ 
"reply": "Short project summary and explanation. Explicitly emphasize that the matched components are readily available from CircuitRocks.", 
"required_components": [ 
{ 
"name": "Arduino Uno", 
"purpose": "Main controller" 
} 
], 
"matched_components": [ 
{ 
"id": "1", 
"name": "Arduino Uno R3", 
"category": "Microcontroller", 
"price": 1450,
"stock": 50,
"sku": "CR-1234"
} 
], 
"missing_components": [ 
{ 
"name": "DC Gear Motor", 
"reason": "No equivalent found in CircuitRocks's available components",
"purchase_link": "https://www.amazon.com/s?k=dc+gear+motor"
} 
], 
"project_readiness": { 
"matched": 5, 
"missing": 2, 
"percentage": 71 
}, 
"plan": [ 
{ 
"phase": "Hardware Acquisition", 
"details": "Acquire all required components from CircuitRocks and other vendors." 
} 
] 
} 

IMPORTANT: 
Generate the BOM FIRST. 
Matching with CircuitRocks happens SECOND. 
Never generate the BOM based solely on CircuitRocks availability. 
Always report missing components honestly.
`;

// Define API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CircuitPal AI Backend is running' });
});

// Endpoint to fetch the mock catalog with optional search query
app.get('/api/catalog', (req, res) => {
  const query = req.query.q as string;
  if (query) {
    const filtered = mockCatalog.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) || 
      item.category.toLowerCase().includes(query.toLowerCase())
    );
    res.json(filtered);
  } else {
    res.json(mockCatalog);
  }
});

// Endpoint to generate project recommendations based on inventory
app.post('/api/recommend', async (req, res) => {
  const { inventory } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.json(getMockRecommendations(inventory));
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
    You are an electronics project assistant. The user has the following components in their inventory:
    ${JSON.stringify(inventory, null, 2)}

    Suggest 3 creative electronics projects they can build mostly using what they have. It's okay if a project is missing 1 to 3 components, but try to maximize the use of their current inventory.
    
    Return ONLY a valid JSON array matching this exact structure, with no markdown formatting around it:
    [
      {
        "name": "Smart Plant Monitor",
        "description": "Monitors soil moisture and alerts you via Wi-Fi.",
        "missing_count": 1,
        "missing_parts": ["Water Pump"]
      }
    ]
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```json')) text = text.substring(7);
    else if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);

    res.json(JSON.parse(text));
  } catch (e) {
    console.error("Gemini API Error in recommendations:", e);
    res.json(getMockRecommendations(inventory));
  }
});

function getMockRecommendations(inventory: any[]) {
  return [
    {
      name: "Smart Plant Monitor",
      description: "Monitors soil moisture and alerts you via Wi-Fi.",
      missing_count: 1,
      missing_parts: ["Water Pump"]
    },
    {
      name: "Automated Desk Fan",
      description: "A small fan that turns on when the temperature gets too high.",
      missing_count: 2,
      missing_parts: ["DC Motor", "Temperature Sensor"]
    },
    {
      name: "Inventory Tester",
      description: "A basic circuit to test the components you have.",
      missing_count: 0,
      missing_parts: []
    }
  ];
}

// Endpoint to handle chat requests and generate project plans
app.post('/api/chat', async (req, res) => {
  const { message, inventory } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set. Falling back to mock response.");
    return res.json(getMockResponse(message));
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const inventoryText = inventory && inventory.length > 0 
      ? `\nUSER'S CURRENT INVENTORY:\n${JSON.stringify(inventory, null, 2)}\n\nIMPORTANT: The user already owns the items listed above. When generating the project plan and reply, explicitly acknowledge what the user already has in their inventory to save them money. Still include these components in the BOM for completeness. VERY IMPORTANT: For components the user already owns, use the EXACT name from their inventory in the "name" field. Also, ANY component the user already owns MUST be placed in the "matched_components" array (with a price of 0 and "stock" of 1 if not found in catalog), NEVER in the "missing_components" array.`
      : "";

    const prompt = `
    System Instruction: ${SYSTEM_PROMPT}
    ${inventoryText}
    
    User Message: ${message}
    
    Remember: Output ONLY valid JSON matching the schema.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from Gemini
    let cleanJsonStr = responseText.trim();
    console.log(cleanJsonStr);
    if (cleanJsonStr.startsWith('```json')) {
      cleanJsonStr = cleanJsonStr.substring(7);
    } else if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.substring(3);
    }
    if (cleanJsonStr.endsWith('```')) {
      cleanJsonStr = cleanJsonStr.substring(0, cleanJsonStr.length - 3);
    }
    
    const parsedResponse = JSON.parse(cleanJsonStr);
    res.json(parsedResponse);
    
  } catch (error: any) {
    console.error("Gemini API Error:", error.message || error);
    
    // Check if it's a 503 Service Unavailable error
    if (error.status === 503 || (error.message && error.message.includes('503'))) {
       console.log("Gemini API is currently experiencing high demand. Falling back to mock response.");
       return res.json({
         ...getMockResponse(message),
         reply: `[API Busy - Using Mock Response] ${getMockResponse(message).reply}`
       });
    } 
    else if (error.status === 429 || error.message?.includes("429")) {
      return res.json({
        ...getMockResponse(message),
        reply: "[Quota Exceeded - Using Mock Response] " +
          getMockResponse(message).reply
      });
    }

    // Fallback to mock if API fails for other reasons
    res.json({
      ...getMockResponse(message),
      reply: `[API Error - Using Mock Response] ${getMockResponse(message).reply}`
    });
  }
});

// Mock response generator for fallback
function getMockResponse(message: string) {
  let reply = `I can help you build that! Here's a breakdown for your project: "${message}".`;
  let required_components: any[] = [];
  let matched_components: any[] = [];
  let missing_components: any[] = [];
  let project_readiness = { matched: 0, missing: 0, percentage: 0 };
  let plan: any[] = [];
  
  if (message.toLowerCase().includes('plant') || message.toLowerCase().includes('water')) {
    required_components = [
      { name: 'Microcontroller with Wi-Fi', purpose: 'Main controller and IoT connectivity' },
      { name: 'Soil Moisture Sensor', purpose: 'Measure plant hydration' },
      { name: 'Relay Module', purpose: 'Control water pump power' },
      { name: 'Mini Water Pump', purpose: 'Pump water to plant' },
      { name: 'Tubing', purpose: 'Direct water flow' },
      { name: 'Jumper Wires', purpose: 'Connect components' },
      { name: 'Breadboard', purpose: 'Prototyping circuit' }
    ];
    matched_components = [mockCatalog[1], mockCatalog[5], mockCatalog[6], mockCatalog[7], mockCatalog[8], mockCatalog[9]];
    missing_components = [
      { name: 'Tubing', reason: 'No water tubing available in catalog', purchase_link: 'https://www.amazon.com/s?k=silicone+water+tubing' }
    ];
    project_readiness = { matched: 6, missing: 1, percentage: 85 };
    plan = [
      { phase: 'Hardware acquisition', details: 'Order ESP32, Moisture Sensor, Relay, Water Pump, Wires, and Breadboard. Source tubing locally.' },
      { phase: 'Circuit assembly', details: 'Connect Moisture Sensor to ESP32 analog pin. Connect Relay to digital pin to control the pump.' },
      { phase: 'Programming', details: 'Write code to read moisture levels and trigger relay when dry.' },
      { phase: 'Testing & Deployment', details: 'Test with a cup of water before deploying to actual plant.' }
    ];
  } else if (message.toLowerCase().includes('robot') || message.toLowerCase().includes('car')) {
    required_components = [
      { name: 'Microcontroller', purpose: 'Main robot brain' },
      { name: 'Motor Driver', purpose: 'Control DC motors' },
      { name: 'DC Gear Motors (x2)', purpose: 'Robot movement' },
      { name: 'Robot Chassis', purpose: 'Base for components' },
      { name: 'Ultrasonic Sensor', purpose: 'Obstacle avoidance' },
      { name: 'Battery Pack', purpose: 'Power source' },
      { name: 'Jumper Wires', purpose: 'Connections' }
    ];
    matched_components = [mockCatalog[0], mockCatalog[3], mockCatalog[4], mockCatalog[2], mockCatalog[8]];
    missing_components = [
      { name: 'DC Gear Motors (x2)', reason: 'Not available in current catalog', purchase_link: 'https://www.adafruit.com/product/3777' },
      { name: 'Robot Chassis', reason: 'Not available in current catalog', purchase_link: 'https://www.amazon.com/s?k=robot+car+chassis' }
    ];
    project_readiness = { matched: 5, missing: 2, percentage: 71 };
    plan = [
      { phase: 'Hardware acquisition', details: 'Order Arduino, Motor Driver, Battery, Sensor, and Wires. Need to find motors and chassis elsewhere.' },
      { phase: 'Circuit assembly', details: 'Connect motors to L298N. Connect Arduino PWM pins to L298N IN pins. Wire battery to driver.' },
      { phase: 'Programming', details: 'Write movement functions (forward, backward, turn).' },
      { phase: 'Testing', details: 'Test motor directions on blocks before placing on ground.' }
    ];
  } else {
    required_components = [
      { name: 'Microcontroller', purpose: 'Base logic' },
      { name: 'Breadboard', purpose: 'Prototyping' }
    ];
    matched_components = [mockCatalog[0], mockCatalog[9]];
    missing_components = [];
    project_readiness = { matched: 2, missing: 0, percentage: 100 };
    plan = [
      { phase: 'Planning', details: 'Define the exact requirements for your custom project.' },
      { phase: 'Hardware acquisition', details: 'Order the base microcontroller and breadboard to get started.' }
    ];
  }

  return { reply, required_components, matched_components, missing_components, project_readiness, plan };
}

// Start the server
app.listen(port, () => {
  console.log(`Server is successfully running on port ${port}`);
});
