const clientId = '89647';
const clientSecret = '5f3153577c7075ce79e34a136021a949ff52ed40';
const redirectUri = 'https://keegan-hugh-kelly.github.io/peleton.github.io/';
let accessToken = '3ab1bc609c9f8bdd88967f8cde8436dfddac5be7';
let refreshToken = '96ac84c86ca3e751e2eb29fb32fd55ac1a10bd47';
let expiresAt = 0; // To store the expiration time of the access token

function stravaLogin() {
  window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read`;
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
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
    getActivities(accessToken);
  })
  .catch(error => console.error('Error fetching token:', error));
} else if (localStorage.getItem('access_token')) {
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
    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    expiresAt = data.expires_at;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);
    getActivities(accessToken);
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
    displayActivities(activities); // Pass activities to display function
  })
  .catch(error => console.error('Error fetching activities:', error));
}

function displayActivities(activities) {
  const activityList = document.getElementById('activity-list');

  // Clear previous activities
  activityList.innerHTML = '';

  activities.forEach(activity => {
    // Create the activity card
    const card = document.createElement('div');
    card.classList.add('activity-card');

    // Add the activity image (using a placeholder for now)
    const img = document.createElement('img');
    img.src = activity.picture || 'https://via.placeholder.com/300x200'; // Use a placeholder image if no activity image
    img.alt = `Activity ${activity.id}`;
    card.appendChild(img);

    // Activity title (name)
    const title = document.createElement('h3');
    title.textContent = activity.name;
    card.appendChild(title);

    // Activity metrics: Time, Distance, Elevation
    const metrics = document.createElement('div');
    metrics.classList.add('metrics');

    // Time
    const time = document.createElement('span');
    time.classList.add('time');
    time.textContent = `Time: ${formatTime(activity.moving_time)}`;
    metrics.appendChild(time);

    // Distance
    const distance = document.createElement('span');
    distance.classList.add('distance');
    distance.textContent = `Distance: ${(activity.distance / 1000).toFixed(2)} km`; // Convert meters to km
    metrics.appendChild(distance);

    // Elevation
    const elevation = document.createElement('span');
    elevation.classList.add('elevation');
    elevation.textContent = `Elevation: ${activity.total_elevation_gain} m`;
    metrics.appendChild(elevation);

    // Append metrics to card
    card.appendChild(metrics);

    // Append the card to the activity list
    activityList.appendChild(card);
  });
}

// Utility to format time from seconds to HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}