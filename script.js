const clientId = '89647';
const clientSecret = '5f3153577c7075ce79e34a136021a949ff52ed40';
const redirectUri = 'https://keegan-hugh-kelly.github.io/peleton.github.io/';

// Check if user is already authorized (no tokens saved in localStorage)
function checkAuthorization() {
  const storedAccessToken = localStorage.getItem('access_token');  // We still check for stored tokens but won't use them
  const storedRefreshToken = localStorage.getItem('refresh_token');
  const storedExpiresAt = localStorage.getItem('expires_at');
  
  console.log("Stored Access Token:", storedAccessToken);
  console.log("Stored Refresh Token:", storedRefreshToken);
  console.log("Stored Expires At:", storedExpiresAt);

  if (storedAccessToken && storedRefreshToken && storedExpiresAt) {
    // If tokens found in localStorage, just use them and check for expiration
    if (Date.now() / 1000 > storedExpiresAt) {
      console.log("Token expired, refreshing...");
      refreshAccessToken();  // Refresh if expired
    } else {
      console.log("Token valid.");
    }
  } else {
    console.log("No tokens found, user needs to authorize.");
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
  console.log("Authorization code received:", code);
  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${redirectUri}`,
  })
  .then(response => response.json())
  .then(data => {
    console.log("Authorization Data:", data);

    if (data.access_token) {
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      const expiresAt = data.expires_at;

      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);
      console.log("Expires At:", expiresAt);

      // Hide the login button and section since the user is authorized
      document.getElementById('strava-login-btn').style.display = 'none';
      document.getElementById('strava-login-section').style.display = 'none';
    } else {
      console.log("Failed to retrieve access token:", data);
    }
  })
  .catch(error => {
    console.error('Error exchanging code:', error);
  });
}

// Function to refresh access token when expired
function refreshAccessToken() {
  const refreshToken = ''; // We no longer store a refresh token, so we'll need to re-authorize
  console.log("Refreshing access token using refresh token:", refreshToken); // This will be unused
  
  // Since we are not using refresh tokens anymore, the user must authorize every time
  stravaLogin(); // Force re-authorization
}
