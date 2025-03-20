/**
 * Zendesk Router - Routes users to one of two Zendesk widgets
 *
 * Usage:
 * ZendeskRouter.init({
 *   keys: {
 *     default: 'abcd7239-889b-da0s-dsa90-addii88w7d89',    // default widget key
 *     gradientLabs: 'sdkc9akfd-fdcb-8fda99-945d-fbcbfbs8d9a0' // gradient labs widget key
 *   },
 *   percentageForGradientLabs: 50, // percentage of users to route to gradient labs (0-100)
 *   identifier: ZendeskRouter.getPersistentUserId() // or use your own identifier like 'user@example.com'
 * });
 */
(function () {
  const ZendeskRouter = {
    /**
    * Initialize the router and load the appropriate Zendesk widget
    * @param {Object} options - Configuration options
    * @param {Object} options.keys - Zendesk widget keys
    * @param {string} options.keys.default - Key for default widget
    * @param {string} options.keys.gradientLabs - Key for gradient labs widget
    * @param {number} options.percentageForGradientLabs - Percentage of users to route to gradient labs (0-100)
    * @param {string} options.identifier - Unique user identifier for consistent routing
    * @returns {Object} Result of the routing decision
    */
    init: function (options = {}) {
      try {
        // Validate required parameters
        if (!options.keys || !options.keys.default) {
          console.warn('Zendesk Router: Missing default widget key, falling back to default');
          return this._fallbackToDefault(options.keys?.default);
        }

        if (!options.identifier) {
          console.warn('Zendesk Router: Missing user identifier, falling back to default');
          return this._fallbackToDefault(options.keys.default);
        }

        if (!options.keys.gradientLabs) {
          console.warn('Zendesk Router: Missing gradient labs widget key, falling back to default');
          return this._fallbackToDefault(options.keys.default);
        }

        const percentageForGradientLabs = options.percentageForGradientLabs || 0;

        // Generate a deterministic value between 0-100 based on the identifier
        const routingValue = this._hashIdentifier(options.identifier);

        // Determine which widget to use
        const useGradientLabs = routingValue < percentageForGradientLabs;

        // Select the appropriate key
        const selectedKey = useGradientLabs ? options.keys.gradientLabs : options.keys.default;
        const selectedWidget = useGradientLabs ? 'gradientLabs' : 'default';

        // Load the Zendesk widget
        this._loadZendeskWidget(selectedKey);

        return {
          routingValue: routingValue,
          selectedKey: selectedKey,
          widget: selectedWidget
        };
      } catch (error) {
        console.error('Zendesk Router: Unexpected error, falling back to default', error);
        return this._fallbackToDefault(options?.keys?.default);
      }
    },

    /**
    * Creates a persistent user identifier that works across sessions and browser tabs
    * Uses Snowplow ID if available, or creates a persistent ID in localStorage
    *
    * @returns {string} A consistent user identifier
    */
    getPersistentUserId: function () {
      const STORAGE_KEY = 'zendesk_router_user_id';

      // First, check if we have a stored ID
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) {
        return storedId;
      }

      // Try to get Snowplow domain user ID if available
      try {
        if (window.getSnowplowIds) {
          const ids = window.getSnowplowIds();
          if (ids.snowplowDomainUserId) {
            localStorage.setItem(STORAGE_KEY, ids.snowplowDomainUserId);
            return ids.snowplowDomainUserId;
          }
        }
      } catch (e) {
        console.warn('Failed to get analytics ID', e);
      }

      // Generate a new persistent ID if we couldn't get one from analytics
      const newId = this._generateUUID();
      localStorage.setItem(STORAGE_KEY, newId);
      return newId;
    },

    /**
    * Generate a UUID v4
    * @returns {string} A random UUID
    * @private
    */
    _generateUUID: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    /**
    * Fall back to default widget
    * @param {string} defaultKey - Default widget key
    * @returns {Object} Result of the fallback
    * @private
    */
    _fallbackToDefault: function (defaultKey) {
      if (defaultKey) {
        this._loadZendeskWidget(defaultKey);
        return {
          routingValue: 0,
          selectedKey: defaultKey,
          widget: 'default',
          fallback: true
        };
      }

      console.error('Zendesk Router: No default key available for fallback');
      return {
        fallback: true,
        error: 'No default key available'
      };
    },

    /**
    * Generate a deterministic hash value between 0-100 from a string
    * @param {string} identifier - String to hash
    * @returns {number} - Value between 0-100
    * @private
    */
    _hashIdentifier: function (identifier) {
      let hash = 0;

      for (let i = 0; i < identifier.length; i++) {
        const char = identifier.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }

      // Convert to a value between 0-100
      return Math.abs(hash) % 101;
    },

    /**
    * Load the Zendesk widget with the given key
    * @param {string} key - Zendesk widget key
    * @private
    */
    _loadZendeskWidget: function (key) {
      const script = document.createElement('script');
      script.id = 'ze-snippet';
      script.src = `https://static.zdassets.com/ekr/snippet.js?key=${key}`;
      script.async = true;
      document.head.appendChild(script);
    }
  };

  // Make accessible globally
  window.ZendeskRouter = ZendeskRouter;
})();