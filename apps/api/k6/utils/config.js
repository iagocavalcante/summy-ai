// k6 Configuration
export const config = {
  // API Base URL
  baseUrl: __ENV.API_URL || 'http://localhost:3000',

  // Test Duration Settings
  durations: {
    smoke: '30s',
    load: '2m',
    stress: '5m',
    spike: '3m',
    soak: '10m',
  },

  // Virtual Users Settings
  vus: {
    smoke: 1,
    load: 10,
    stress: 50,
    spike: 100,
    soak: 20,
  },

  // Thresholds for Success Criteria
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_duration_create: ['p(95)<500'], // Create requests under 500ms
    http_req_duration_list: ['p(95)<200'], // List requests under 200ms
    http_req_duration_analytics: ['p(95)<300'], // Analytics under 300ms
  },

  // Sample test data
  sampleTexts: [
    'This is a short article about technology trends in 2025.',
    'Artificial intelligence is transforming the way we work and live. Machine learning algorithms are becoming more sophisticated every day.',
    'The future of renewable energy looks promising with new solar panel technologies achieving unprecedented efficiency rates.',
    'Climate change remains one of the most pressing challenges of our time, requiring global cooperation and innovative solutions.',
    'The digital transformation of healthcare has accelerated, with telemedicine becoming mainstream and AI assisting in diagnostics.',
    'Quantum computing is no longer just theoretical, with major breakthroughs bringing practical applications closer to reality.',
    'Space exploration has entered a new era with private companies leading ambitious missions to Mars and beyond.',
    'Blockchain technology continues to evolve beyond cryptocurrency, finding applications in supply chain management and digital identity.',
    'The rise of remote work has fundamentally changed how companies approach office space and employee collaboration.',
    'Cybersecurity threats are becoming more sophisticated, requiring advanced AI-powered defense systems to protect digital infrastructure.',
  ],
};

// Random text generator
export function getRandomText() {
  return config.sampleTexts[Math.floor(Math.random() * config.sampleTexts.length)];
}

// Sleep helper
export function randomSleep(min = 1, max = 3) {
  return Math.random() * (max - min) + min;
}
