const clientId = '89647';
const clientSecret = '5f3153577c7075ce79e34a136021a949ff52ed40';
const redirectUri = 'https://keegan-hugh-kelly.github.io/peleton.github.io/';
let accessToken = '';
let refreshToken = '';
let expiresAt = 0; // To store the expiration time of the access token

// Check if user is already authorized on page load
function checkAuthorization() {
  const storedAccessToken = localStorage.getItem('access_token');
  const storedRefreshToken = localStorage.getItem('refresh_token');
  const storedExpiresAt = localStorage.getItem('expires_at');
  
  // If tokens are stored and not expired, proceed to authorize
  if (storedAccessToken && storedRefreshToken && storedExpiresAt) {
    accessToken = storedAccessToken;
    refreshToken = storedRefreshToken;
    expiresAt = storedExpiresAt;

    console.log("Access Token:", accessToken);
    console.log("Expires At:", expiresAt);
    
    // If the token is expired, refresh it
    if (Date.now() / 1000 > expiresAt) {
      console.log("Token expired, refreshing...");
      refreshAccessToken();  // Refresh the token
    } else {
      console.log("Token valid.");
      // User is already authorized, hide the login button
      document.getElementById('strava-login-btn').style.display = 'none';
      document.getElementById('strava-login-section').style.display = 'none'; // Hide entire section if authorized
    }
  } else {
    console.log("No tokens found, user not authorized.");
  }
}

// Run authorization check when the page loads
window.onload = function () {
  checkAuthorization();
};

// Function to trigger Strava login
function stravaLogin() {
  const url = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read`;
  window.location.href = url;
}

// Handling the redirect after Strava authorization
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

// If the authorization code is present, exchange it for access and refresh tokens
if (code) {
  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`,
  })
  .then(response => response.json())
  .then(data => {
    if (data.access_token) {
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      expiresAt = data.expires_at;

      // Store tokens in localStorage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('expires_at', expiresAt);

      // Hide the login button and section since the user is authorized
      document.getElementById('strava-login-btn').style.display = 'none';
      document.getElementById('strava-login-section').style.display = 'none';
    }
  })
  .catch(error => console.error('Error exchanging code:', error));
}

// Function to refresh access token when expired
function refreshAccessToken() {
  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`,
  })
  .then(response => response.json())
  .then(data => {
    if (data.access_token) {
      accessToken = data.access_token;
      expiresAt = data.expires_at;

      // Store new tokens in localStorage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('expires_at', expiresAt);

      console.log("Access token refreshed.");
    }
  })
  .catch(error => console.error('Error refreshing token:', error));
}

// Function to get activity data (now removed)
