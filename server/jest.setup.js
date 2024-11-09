'use strict';

require('dotenv').config();

// Global Jest setup
jest.setTimeout(10000); // Increase test timeout

// Example of global mock
global.mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
