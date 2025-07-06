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

export function emitEvent(eventName, properties = {}, telemetryContext = null) {
  if (!enabled || !isInitialized) {
    console.warn('AppInsights not initialized. Emit event skipped.');
    // if app insights is not enabled, do nothing
    return;
  }
  const client = appInsights.defaultClient ;
  if (client) {
    console.log("Emiting App Insights event from common function " + eventName) ;

    let mergedProperties = { ...properties }; // start with existing properties
    if (telemetryContext) {
      const { userId, sessionId, myCookie, operationId } = telemetryContext ;
      console.log("Retrieved variables from telemetryContext") ;
      //console.log({ userId, sessionId, myCookie, operationId }) ;

      // Add telemetryContext properties (if present) to the bag
      if (userId) mergedProperties.userId = userId;
      if (sessionId) mergedProperties.sessionId = sessionId;
      if (myCookie) mergedProperties.myCookie = myCookie;
      if (operationId) mergedProperties.operationId = operationId;
    }

    client.trackEvent({
      name: eventName,
      properties: mergedProperties       
    });

  } else {
    console.warn('AppInsights client not initialized');
  }
}

function extractOperationId(requestId) {
  if (!requestId) return null;
  // Remove leading '|' if present, then split on '.'
  const parts = requestId.startsWith('|') ? requestId.slice(1).split('.') : requestId.split('.');
  return parts[0] || null;
}



export function telemetryContextMiddleware(req, res, next) {
  if (!enabled || !isInitialized) {
    console.warn('AppInsights not initialized. Emit telemetry context capture.');
    // if app insights is not enabled, do nothing
    return;
  }
  const client = appInsights.defaultClient ;
  if (client) {

    // Cookies
    const aiUser = req.cookies['ai_user'];
    const aiSession = req.cookies['ai_session'];
    const myCookie = req.cookies['my_cookie'];

    // Parse ai_user for userId
    let userId = aiUser ? aiUser.split('|')[0] : "unknown-user";
    // Parse ai_session for sessionId
    let sessionId = aiSession ? aiSession.split('|')[0] : "unknown-session";

    // Extract operationId from request-id header
    const requestId = req.headers['request-id'];
    const operationId = extractOperationId(requestId);

    // For debugging/logging
    //console.log("Logging userId, sessionId, myCookie and OperationId");
    //console.log({ userId, sessionId, myCookie, operationId });

    // Attach to req for downstream use
    req.telemetryContext = { userId, sessionId, myCookie, operationId };   

    // Set context for this request
    //client.context.tags[client.context.keys.userId] = userId;
    //client.context.tags[client.context.keys.sessionId] = sessionId;
    //client.context.tags[client.context.keys.operationId] = operationId;
  }
  next();

}