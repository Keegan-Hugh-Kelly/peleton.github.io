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
  
  // If tokens are stored and not expired, proceed to authorize and fetch activities
  if (storedAccessToken && storedRefreshToken && storedExpiresAt) {
    accessToken = storedAccessToken;
    refreshToken = storedRefreshToken;
    expiresAt = storedExpiresAt;

    // If the token is expired, refresh it
    if (Date.now() / 1000 > expiresAt) {
      refreshAccessToken();
    } else {
      // User is already authorized, hide the login button and fetch activities
      document.getElementById('strava-login-btn').style.display = 'none';
      document.getElementById('strava-login-section').style.display = 'none'; // Hide entire section if authorized
      getActivities(accessToken);
    }
  }
}

// Run authorization check when the page loads
window.onload = function () {
  checkAuthorization();
};

// Function to trigger Strava login
function stravaLogin() {
  window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read`;
}

const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

// If the authorization code is present, exchange it for access and refresh tokens
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

    // Store tokens in localStorage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);

    // Hide the login button and section since the user is authorized
    document.getElementById('strava-login-btn').style.display = 'none';
    document.getElementById('strava-login-section').style.display = 'none';

    getActivities(accessToken);
  })
  .catch(error => console.error('Error fetching token:', error));
}

// Function to refresh the access token using the refresh token
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

    // Update tokens in localStorage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);

    getActivities(accessToken);
  })
  .catch(error => console.error('Error refreshing access token:', error));
}

// Fetch the user's Strava activities using the access token
function getActivities(accessToken) {
  fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  .then(response => response.json())
  .then(activities => {
    if (activities.length === 0) {
      // Display a message if no activities are found
      document.getElementById('activity-list').innerHTML = '<p>No activities found.</p>';
    } else {
      displayActivities(activities);
    }
  })
  .catch(error => console.error('Error fetching activities:', error));
}

// Display activities grouped by date
function displayActivities(activities) {
  const activityList = document.getElementById('activity-list');

  // Check if the activity list exists before attempting to populate it
  if (!activityList) {
    console.error("Activity list element not found!");
    return;
  }

  // Clear previous activities
  activityList.innerHTML = '';

  // Group activities by date
  const activitiesByDate = {};
  activities.forEach(activity => {
    const activityDate = new Date(activity.start_date).toDateString(); // Format date (e.g. "Wed Oct 02 2024")
    if (!activitiesByDate[activityDate]) {
      activitiesByDate[activityDate] = [];
    }
    activitiesByDate[activityDate].push(activity);
  });

  // Create cards for each date
  Object.keys(activitiesByDate).forEach(date => {
    const dateSection = document.createElement('div');
    dateSection.classList.add('date-section');

    const dateTitle = document.createElement('h2');
    dateTitle.textContent = date; // Display the date
    dateSection.appendChild(dateTitle);

    activitiesByDate[date].forEach(activity => {
      const card = document.createElement('div');
      card.classList.add('activity-card');

      const title = document.createElement('h3');
      title.textContent = activity.name;
      card.appendChild(title);

      const metrics = document.createElement('div');
      metrics.classList.add('metrics');

      const distance = document.createElement('span');
      distance.classList.add('distance');
      distance.textContent = `Distance: ${(activity.distance / 1000).toFixed(2)} km`;
      metrics.appendChild(distance);

      const time = document.createElement('span');
      time.classList.add('time');
      time.textContent = `Time: ${formatTime(activity.moving_time)}`;
      metrics.appendChild(time);

      const elevation = document.createElement('span');
      elevation.classList.add('elevation');
      elevation.textContent = `Elevation: ${activity.total_elevation_gain} m`;
      metrics.appendChild(elevation);

      const speed = document.createElement('span');
      speed.classList.add('speed');
      speed.textContent = `Speed: ${(activity.average_speed * 3.6).toFixed(2)} km/h`;
      metrics.appendChild(speed);

      card.appendChild(metrics);
      dateSection.appendChild(card);
    });

    activityList.appendChild(dateSection);
  });
}

// Utility to format time from seconds to HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}
