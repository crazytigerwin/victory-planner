// Google Calendar API integration using new Google Identity Services with auto-refresh

const CLIENT_ID = '1077150568967-pgtbgs8bnnr6jaa85meq9uhetr3tmfd0.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBERrNu_IVmAN9BTeMkITd0StSfQL5xeyo';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let tokenExpiresAt = null;
let refreshInterval = null;

// Initialize the Google API client
export const initGoogleCalendar = () => {
  return new Promise((resolve, reject) => {
    // Check if we have a stored token from this session
    const storedToken = sessionStorage.getItem('google_access_token');
    const storedExpiry = sessionStorage.getItem('google_token_expiry');
    
    if (storedToken && storedExpiry) {
      const expiryTime = parseInt(storedExpiry);
      if (Date.now() < expiryTime) {
        accessToken = storedToken;
        tokenExpiresAt = expiryTime;
        startTokenRefreshTimer();
      } else {
        // Token expired, clear it
        sessionStorage.removeItem('google_access_token');
        sessionStorage.removeItem('google_token_expiry');
      }
    }

    // Load gapi script
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        
        // If we have a stored token, set it in gapi
        if (accessToken) {
          window.gapi.client.setToken({ access_token: accessToken });
        }
        
        gapiInited = true;
        maybeEnableButtons(resolve, reject);
      });
    };
    document.body.appendChild(gapiScript);

    // Load Google Identity Services script
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      });
      gisInited = true;
      maybeEnableButtons(resolve, reject);
    };
    document.body.appendChild(gisScript);
  });
};

function maybeEnableButtons(resolve, reject) {
  if (gapiInited && gisInited) {
    resolve();
  }
}

function startTokenRefreshTimer() {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Refresh token 5 minutes before it expires
  const timeUntilRefresh = tokenExpiresAt - Date.now() - (5 * 60 * 1000);
  
  if (timeUntilRefresh > 0) {
    setTimeout(() => {
      refreshToken();
      // Set up recurring refresh every 50 minutes
      refreshInterval = setInterval(() => {
        refreshToken();
      }, 50 * 60 * 1000); // 50 minutes
    }, timeUntilRefresh);
  } else {
    // Token is about to expire or already expired, refresh now
    refreshToken();
    refreshInterval = setInterval(() => {
      refreshToken();
    }, 50 * 60 * 1000);
  }
}

function refreshToken() {
  if (tokenClient) {
    tokenClient.callback = async (resp) => {
      if (resp.error === undefined) {
        accessToken = resp.access_token;
        // Tokens typically expire in 3600 seconds (1 hour)
        tokenExpiresAt = Date.now() + (3600 * 1000);
        
        // Store in sessionStorage
        sessionStorage.setItem('google_access_token', accessToken);
        sessionStorage.setItem('google_token_expiry', tokenExpiresAt.toString());
        
        console.log('Access token refreshed successfully');
      }
    };
    
    // Request new token silently
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

export const signIn = () => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        reject(resp);
        return;
      }
      
      accessToken = resp.access_token;
      // Tokens typically expire in 3600 seconds (1 hour)
      tokenExpiresAt = Date.now() + (3600 * 1000);
      
      // Store in sessionStorage so it persists across page refreshes
      sessionStorage.setItem('google_access_token', accessToken);
      sessionStorage.setItem('google_token_expiry', tokenExpiresAt.toString());
      
      // Start the auto-refresh timer
      startTokenRefreshTimer();
      
      resolve(resp);
    };

    if (accessToken === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const signOut = () => {
  return new Promise((resolve) => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken);
      accessToken = null;
      tokenExpiresAt = null;
      
      // Clear stored token
      sessionStorage.removeItem('google_access_token');
      sessionStorage.removeItem('google_token_expiry');
      
      // Clear refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    }
    resolve();
  });
};

export const isSignedIn = () => {
  return accessToken !== null && tokenExpiresAt !== null && Date.now() < tokenExpiresAt;
};

// Get events from Google Calendar
export const getEvents = async (timeMin, timeMax) => {
  const response = await window.gapi.client.calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax,
    showDeleted: false,
    singleEvents: true,
    maxResults: 100,
    orderBy: 'startTime',
  });
  return response;
};

// Create a new event in Google Calendar
export const createEvent = async (event) => {
  const response = await window.gapi.client.calendar.events.insert({
    calendarId: 'primary',
    resource: {
      summary: event.title,
      start: {
        dateTime: event.start || new Date(event.date + 'T' + (event.time || '00:00')).toISOString(),
        timeZone: 'America/Chicago',
      },
      end: {
        dateTime: event.end || new Date(event.date + 'T' + (event.time || '01:00')).toISOString(),
        timeZone: 'America/Chicago',
      },
      description: event.description || '',
    },
  });
  return response;
};

// Update an existing event
export const updateEvent = async (eventId, event) => {
  const response = await window.gapi.client.calendar.events.update({
    calendarId: 'primary',
    eventId: eventId,
    resource: {
      summary: event.title,
      start: {
        dateTime: new Date(event.date + 'T' + (event.time || '00:00')).toISOString(),
        timeZone: 'America/Chicago',
      },
      end: {
        dateTime: new Date(event.date + 'T' + (event.time || '01:00')).toISOString(),
        timeZone: 'America/Chicago',
      },
    },
  });
  return response;
};

// Delete an event from Google Calendar
export const deleteEvent = async (eventId) => {
  const response = await window.gapi.client.calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
  return response;
};