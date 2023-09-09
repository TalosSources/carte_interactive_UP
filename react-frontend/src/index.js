import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import GlobalStyles from './GlobalStyles';
import reportWebVitals from './reportWebVitals';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MatomoProvider, createInstance } from '@datapunt/matomo-tracker-react'

const instance = createInstance({
  urlBase: 'https://matomo.entrop.mywire.org',
  siteId: 1,
  // userId: 'UID76903202', // optional, default value: `undefined`.
  // trackerUrl: 'https://LINK.TO.DOMAIN/tracking.php', // optional, default value: `${urlBase}matomo.php`
  // srcUrl: 'https://LINK.TO.DOMAIN/tracking.js', // optional, default value: `${urlBase}matomo.js`
  disabled: false, // optional, false by default. Makes all tracking calls no-ops if set to true.
  //heartBeat: { // optional, enabled by default
  //  active: true, // optional, default value: true
  //  seconds: 10 // optional, default value: `15
  //},
  // linkTracking: false, // optional, default value: true
  //configurations: { // optional, default value: {}
  //  // any valid matomo configuration, all below are optional
  //  disableCookies: true,
  //  setSecureCookie: true,
  //  setRequestMethod: 'POST'
  //}
})

const root = ReactDOM.createRoot(document.getElementById('sk-root'));
const queryClient = new QueryClient();
root.render(
  <React.StrictMode>
  <MatomoProvider value={instance}>
    <GlobalStyles />
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </MatomoProvider>,
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
