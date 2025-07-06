import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

const enabled = import.meta.env.VITE_ENABLE_APPINSIGHTS === 'true';
const connectionString = import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING;

let appInsights: ApplicationInsights | null = null;
let reactPlugin: ReactPlugin | null = null;

if (enabled && connectionString) {
  reactPlugin = new ReactPlugin();
  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      extensions: [reactPlugin]      
    }
  });
  appInsights.loadAppInsights();
}

export { appInsights, reactPlugin };