// Global setup for e2e tests
// This helps prevent worker processes from hanging

// Increase Jest timeout for e2e tests
jest.setTimeout(30000);

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in e2e test:', reason);
});

// Clean up Redis connections on exit
afterAll(async () => {
  // Give time for async cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));
});
