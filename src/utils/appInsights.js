import appInsights from 'applicationinsights';

let enabled = process.env.ENABLE_APPINSIGHTS === 'true';
let isInitialized = false;

export function initializeAppInsights(connectionString) {
  if (enabled && !isInitialized && connectionString) {
    appInsights.setup(connectionString)
      .setAutoCollectConsole(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectPerformance(true)
      .setAutoCollectRequests(true)
      .enableWebInstrumentation(true)
      .start();

    isInitialized = true;
    console.log('Application Insights initialized.');
  }
  else {
    console.log('Application Insights not enabled or connection string missing');
  }
}

export function emitEvent(eventName, properties = {}) {
  if (!enabled || !isInitialized) {
    console.warn('AppInsights not initialized. Emit event skipped.');
    // if app insights is not enabled, do nothing
    return;
  }

  const client = appInsights.defaultClient;
  if (client) {
    console.log("Emiting App Insights event from common function " + eventName) ;
    client.trackEvent({
      name: eventName,
      properties,
    });
  } else {
    console.warn('AppInsights client not initialized');
  }
}