import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock component catalog data
const mockCatalog = [
  { id: '1', name: 'Arduino Uno R3', category: 'Microcontroller', price: 24.99, stock: 50, description: 'Standard microcontroller board for beginners.' },
  { id: '2', name: 'ESP32 Development Board', category: 'Microcontroller', price: 9.99, stock: 120, description: 'Wi-Fi & Bluetooth MCU, great for IoT.' },
  { id: '3', name: 'Ultrasonic Sensor HC-SR04', category: 'Sensor', price: 3.99, stock: 300, description: 'Distance measuring sensor.' },
  { id: '4', name: 'L298N Motor Driver', category: 'Module', price: 5.49, stock: 85, description: 'Dual H-bridge motor driver.' },
  { id: '5', name: '18650 Li-ion Battery 3000mAh', category: 'Power', price: 6.99, stock: 200, description: 'Rechargeable power source.' },
  { id: '6', name: 'Soil Moisture Sensor', category: 'Sensor', price: 2.50, stock: 150, description: 'Analog soil moisture sensor for plants.' },
  { id: '7', name: '5V Relay Module', category: 'Module', price: 3.50, stock: 200, description: '1-channel relay module for switching high power.' },
  { id: '8', name: 'Mini Water Pump 5V', category: 'Actuator', price: 4.99, stock: 90, description: 'Submersible water pump.' }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CircuitPal AI Backend is running' });
});

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

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  // Basic intent parsing for mock
  let reply = `I can help you build that! Here's a breakdown for your project: "${message}".`;
  let bom: any[] = [];
  let plan: any[] = [];
  
  if (message.toLowerCase().includes('plant') || message.toLowerCase().includes('water')) {
    bom = [mockCatalog[1], mockCatalog[5], mockCatalog[6], mockCatalog[7]];
    plan = [
      { phase: 'Hardware acquisition', details: 'Order ESP32, Moisture Sensor, Relay, and Water Pump.' },
      { phase: 'Circuit assembly', details: 'Connect Moisture Sensor to ESP32 analog pin. Connect Relay to digital pin to control the pump.' },
      { phase: 'Programming', details: 'Write code to read moisture levels and trigger relay when dry.' },
      { phase: 'Testing & Deployment', details: 'Test with a cup of water before deploying to actual plant.' }
    ];
  } else if (message.toLowerCase().includes('robot') || message.toLowerCase().includes('car')) {
    bom = [mockCatalog[0], mockCatalog[3], mockCatalog[4], mockCatalog[2]];
    plan = [
      { phase: 'Hardware acquisition', details: 'Order Arduino, Motor Driver, Motors, and Battery.' },
      { phase: 'Circuit assembly', details: 'Connect motors to L298N. Connect Arduino PWM pins to L298N IN pins. Wire battery to driver.' },
      { phase: 'Programming', details: 'Write movement functions (forward, backward, turn).' },
      { phase: 'Testing', details: 'Test motor directions on blocks before placing on ground.' }
    ];
  } else {
    bom = [mockCatalog[0]];
    plan = [
      { phase: 'Planning', details: 'Define the exact requirements for your custom project.' },
      { phase: 'Hardware acquisition', details: 'Order the base microcontroller.' }
    ];
  }

  res.json({ reply, bom, plan });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
