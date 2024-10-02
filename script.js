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
  
  if (storedAccessToken && storedRefreshToken && storedExpiresAt) {
    accessToken = storedAccessToken;
    refreshToken = storedRefreshToken;
    expiresAt = storedExpiresAt;

    // If the token is expired, refresh it
    if (Date.now() / 1000 > expiresAt) {
      refreshAccessToken();
    } else {
      // User is already authorized
      document.getElementById('strava-login-btn').style.display = 'none';
      getActivities(accessToken);
    }
  }
}

// Check if the user has already authorized and hide button if so
window.onload = function () {
  checkAuthorization();
};

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

    // Store tokens in localStorage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);

    // Hide the login button since user is authorized
    document.getElementById('strava-login-btn').style.display = 'none';

    getActivities(accessToken);
  })
  .catch(error => console.error('Error fetching token:', error));
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

    // Update tokens in localStorage
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
    displayActivities(activities);
  })
  .catch(error => console.error('Error fetching activities:', error));
}

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
      // Create the activity card
      const card = document.createElement('div');
      card.classList.add('activity-card');

      // Activity title (name)
      const title = document.createElement('h3');
      title.textContent = activity.name;
      card.appendChild(title);

      // Activity metrics: Distance, Time, Elevation, Speed
      const metrics = document.createElement('div');
      metrics.classList.add('metrics');

      // Distance
      const distance = document.createElement('span');
      distance.classList.add('distance');
      distance.textContent = `Distance: ${(activity.distance / 1000).toFixed(2)} km`; // Convert meters to km
      metrics.appendChild(distance);

      // Time
      const time = document.createElement('span');
      time.classList.add('time');
      time.textContent = `Time: ${formatTime(activity.moving_time)}`;
      metrics.appendChild(time);

      // Elevation
      const elevation = document.createElement('span');
      elevation.classList.add('elevation');
      elevation.textContent = `Elevation: ${activity.total_elevation_gain} m`;
      metrics.appendChild(elevation);

      // Speed (average speed)
      const speed = document.createElement('span');
      speed.classList.add('speed');
      speed.textContent = `Speed: ${(activity.average_speed * 3.6).toFixed(2)} km/h`; // Convert m/s to km/h
      metrics.appendChild(speed);

      // Append metrics to card
      card.appendChild(metrics);

      // Append the card to the date section
      dateSection.appendChild(card);
    });

    // Append the date section to the activity list
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
