import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { captureIncomingHandoff } from './lib/handoff';
import { captureIncomingIntent } from './lib/applyIntent';

// Before anything renders, and before the router reads the URL: a student
// arriving from the public Ignition site carries two things.
//
// Their research, in the URL fragment — a shortlist, deliberately kept out of
// server logs. See src/lib/handoff.js.
captureIncomingHandoff();
// And, if they pressed Apply Now on a specific course, an opaque intent id in
// the query string. Lifted here so it survives the student choosing Login over
// Register, which is a navigation this app owns. See src/lib/applyIntent.js.
captureIncomingIntent();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
