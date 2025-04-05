// Set test timeout
jest.setTimeout(30000);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global uncaught exception handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
}); 