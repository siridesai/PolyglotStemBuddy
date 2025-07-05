import appInsights from 'applicationinsights';

export function emitEvent(eventName, properties = {}) {
  console.log("Emiting App Insights event from common function " + eventName) ;
  // Ensure Application Insights is initialized
  const client = appInsights.defaultClient;
  if (client) {
    client.trackEvent({
      name: eventName,
      properties,
    });
  } else {
    console.warn('AppInsights client not initialized');
  }
}