'use strict';

class FeatureFlagService {
  constructor(configManager) {
    this.configManager = configManager;
    this.features = {
      notifications: this.isFeatureEnabled('ENABLE_NOTIFICATIONS'),
      portfolioTracking: this.isFeatureEnabled('ENABLE_PORTFOLIO_TRACKING'),
    };
  }

  isFeatureEnabled(featureKey) {
    return process.env[featureKey] === 'true';
  }

  getEnabledFeatures() {
    return Object.entries(this.features)
      .filter(([, value]) => value)
      .map(([key]) => key);
  }
}

module.exports = FeatureFlagService;
