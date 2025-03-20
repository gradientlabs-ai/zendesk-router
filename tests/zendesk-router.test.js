/**
 * Tests for Zendesk Router
 */

describe('ZendeskRouter', () => {
  let documentCreateElementOriginal;
  let appendChildMock;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Mock document.createElement to return a controlled object
    documentCreateElementOriginal = document.createElement;
    document.createElement = jest.fn().mockImplementation(() => {
      return {
        id: '',
        src: '',
        async: false
      };
    });

    // Mock appendChild
    appendChildMock = jest.fn();
    document.head.appendChild = appendChildMock;

    // Mock console methods
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
    });

    // Clear window.ZendeskRouter if it exists
    delete window.ZendeskRouter;

    // Load the router
    require('../zendesk-router');
  });

  afterEach(() => {
    // Restore mocks
    document.createElement = documentCreateElementOriginal;
    document.head.appendChild = appendChildMock.mockRestore;
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Clean up
    jest.resetModules();
  });

  test('Router exists globally', () => {
    expect(window.ZendeskRouter).toBeDefined();
    expect(typeof window.ZendeskRouter.init).toBe('function');
  });

  test('Returns correct routing information when initialized properly', () => {
    // Mock hash function to return a specific value for testing
    const hashSpy = jest.spyOn(window.ZendeskRouter, '_hashIdentifier')
      .mockReturnValue(30); // 30% is below 50%, should route to gradient labs

    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key',
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 50,
      identifier: 'test@example.com'
    });

    expect(result).toEqual({
      routingValue: 30,
      selectedKey: 'gradient-labs-key',
      widget: 'gradientLabs'
    });

    expect(appendChildMock).toHaveBeenCalledTimes(1);
    expect(document.createElement).toHaveBeenCalledWith('script');

    hashSpy.mockRestore();
  });

  test('Routes to default widget when hash value is above threshold', () => {
    // Mock hash function to return a specific value for testing
    const hashSpy = jest.spyOn(window.ZendeskRouter, '_hashIdentifier')
      .mockReturnValue(70); // 70% is above 50%, should route to default

    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key',
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 50,
      identifier: 'test@example.com'
    });

    expect(result).toEqual({
      routingValue: 70,
      selectedKey: 'default-key',
      widget: 'default'
    });

    expect(appendChildMock).toHaveBeenCalledTimes(1);
    expect(document.createElement).toHaveBeenCalledWith('script');

    hashSpy.mockRestore();
  });

  test('Routes to default widget when percentage is 0', () => {
    // Mock hash function to ensure a consistent test
    const hashSpy = jest.spyOn(window.ZendeskRouter, '_hashIdentifier')
      .mockReturnValue(30);

    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key',
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 0,
      identifier: 'test@example.com'
    });

    expect(result.widget).toBe('default');
    expect(appendChildMock).toHaveBeenCalledTimes(1);

    hashSpy.mockRestore();
  });

  test('Routes all users to gradient labs when percentage is 100', () => {
    // Mock hash function to ensure a consistent test
    const hashSpy = jest.spyOn(window.ZendeskRouter, '_hashIdentifier')
      .mockReturnValue(99);

    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key',
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 100,
      identifier: 'test@example.com'
    });

    expect(result.widget).toBe('gradientLabs');
    expect(appendChildMock).toHaveBeenCalledTimes(1);

    hashSpy.mockRestore();
  });

  test('Falls back to default when identifier is missing', () => {
    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key',
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 50
      // Missing identifier
    });

    expect(result.fallback).toBe(true);
    expect(result.widget).toBe('default');
    expect(result.selectedKey).toBe('default-key');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing user identifier')
    );
    expect(appendChildMock).toHaveBeenCalledTimes(1);
  });

  test('Falls back to default when default key is missing', () => {
    const result = window.ZendeskRouter.init({
      keys: {
        // Missing default key
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 50,
      identifier: 'test@example.com'
    });

    expect(result.fallback).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing default widget key')
    );
    expect(appendChildMock).toHaveBeenCalledTimes(0); // No widget loaded
  });

  test('Falls back to default when gradient labs key is missing', () => {
    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key'
        // Missing gradient labs key
      },
      percentageForGradientLabs: 50,
      identifier: 'test@example.com'
    });

    expect(result.fallback).toBe(true);
    expect(result.widget).toBe('default');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing gradient labs widget key')
    );
    expect(appendChildMock).toHaveBeenCalledTimes(1);
  });

  test('Falls back to default when keys object is missing', () => {
    const result = window.ZendeskRouter.init({
      // Missing keys object
      percentageForGradientLabs: 50,
      identifier: 'test@example.com'
    });

    expect(result.fallback).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Missing default widget key')
    );
    expect(appendChildMock).toHaveBeenCalledTimes(0);
  });

  test('Shows error when no default key is available for fallback', () => {
    const result = window.ZendeskRouter.init({
      // No options at all
    });

    expect(result.fallback).toBe(true);
    expect(result.error).toBe('No default key available');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No default key available')
    );
    expect(appendChildMock).toHaveBeenCalledTimes(0);
  });

  test('Hash function produces consistent values for the same input', () => {
    const hashFn = window.ZendeskRouter._hashIdentifier;

    // Same input should produce same output
    const value1 = hashFn('user@example.com');
    const value2 = hashFn('user@example.com');
    expect(value1).toBe(value2);

    // Different inputs should produce different values
    const value3 = hashFn('different@example.com');
    // Just check they're different without comparing specific values
    expect(value1 === value3).toBe(false);

    // All values should be in the range 0-100
    expect(value1).toBeGreaterThanOrEqual(0);
    expect(value1).toBeLessThanOrEqual(100);
    expect(value3).toBeGreaterThanOrEqual(0);
    expect(value3).toBeLessThanOrEqual(100);
  });

  test('Handles unexpected errors gracefully', () => {
    // Cause an error in the init function
    jest.spyOn(window.ZendeskRouter, '_hashIdentifier').mockImplementation(() => {
      throw new Error('Simulated error');
    });

    const result = window.ZendeskRouter.init({
      keys: {
        default: 'default-key',
        gradientLabs: 'gradient-labs-key'
      },
      percentageForGradientLabs: 50,
      identifier: 'test@example.com'
    });

    expect(result.fallback).toBe(true);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unexpected error'),
      expect.any(Error)
    );
    expect(appendChildMock).toHaveBeenCalledTimes(1);
  });

  test('Widget loading function creates script with correct attributes', () => {
    window.ZendeskRouter._loadZendeskWidget('test-key-123');

    expect(appendChildMock).toHaveBeenCalledTimes(1);
    expect(document.createElement).toHaveBeenCalledWith('script');
  });
});