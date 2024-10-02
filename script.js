const clientId = '89647';
const clientSecret = '5f3153577c7075ce79e34a136021a949ff52ed40';
const redirectUri = 'https://keegan-hugh-kelly.github.io/peleton.github.io/';
let accessToken = '3ab1bc609c9f8bdd88967f8cde8436dfddac5be7';
let refreshToken = '96ac84c86ca3e751e2eb29fb32fd55ac1a10bd47';
let expiresAt = 0; // To store the expiration time of the access token

function stravaLogin() {
  // Redirect user to Strava for authorization
  window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read`;
}

// Check if Strava has redirected with an authorization code
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
  // If the user has authorized and returned with the code, exchange for an access token
  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
    }),
  })
  .then(response => response.json())
  .then(data => {
    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    expiresAt = data.expires_at;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);
    getActivities(accessToken); // Fetch user activities
  })
  .catch(error => console.error('Error fetching token:', error));
} else if (localStorage.getItem('access_token')) {
  // If there's already an access token stored, check its expiration
  accessToken = localStorage.getItem('access_token');
  refreshToken = localStorage.getItem('refresh_token');
  expiresAt = localStorage.getItem('expires_at');
  
  if (Date.now() / 1000 > expiresAt) {
    refreshAccessToken();
  } else {
    getActivities(accessToken);
  }
}

function refreshAccessToken() {
  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  .then(response => response.json())
  .then(data => {
    // Store new tokens
    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    expiresAt = data.expires_at;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);
    getActivities(accessToken); // Fetch user activities
  })
  .catch(error => console.error('Error refreshing access token:', error));
}

function getActivities(accessToken) {
  fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  .then(response => response.json())
  .then(activities => {
    displayActivities(activities); // Display activities on the page
  })
  .catch(error => console.error('Error fetching activities:', error));
}

function displayActivities(activities) {
  const activityList = document.getElementById('activity-list');
  activityList.innerHTML = ''; // Clear any existing activities

  activities.forEach(activity => {
    const activityItem = document.createElement('li');
    activityItem.textContent = `${activity.name} - ${activity.distance / 1000} km`;
    activityList.appendChild(activityItem);
  });
}
