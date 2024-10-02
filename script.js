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
  const calendar = document.getElementById('calendar');

  // Clear previous activities
  calendar.innerHTML = '';

  activities.forEach(activity => {
    const activityDate = new Date(activity.start_date);
    const day = activityDate.getDate();
    const month = activityDate.getMonth();
    const year = activityDate.getFullYear();

    // Create a calendar cell for the activity date
    let dayCell = document.querySelector(`#calendar .day[data-day="${day}"][data-month="${month}"][data-year="${year}"]`);

    if (!dayCell) {
      // If the day cell does not exist, create a new cell
      dayCell = document.createElement('div');
      dayCell.classList.add('calendar-cell');
      dayCell.setAttribute('data-day', day);
      dayCell.setAttribute('data-month', month);
      dayCell.setAttribute('data-year', year);
      calendar.appendChild(dayCell);
    }

    // Create the activity card
    const card = document.createElement('div');
    card.classList.add('activity-card');

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

    // Add a map for each activity route
    const mapDiv = document.createElement('div');
    mapDiv.classList.add('activity-map');
    card.appendChild(mapDiv);

    // Use Leaflet.js to render the map
    const map = L.map(mapDiv).setView([activity.start_latitude, activity.start_longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const routeCoordinates = activity.map.summary_polyline ? decodePolyline(activity.map.summary_polyline) : [];
    if (routeCoordinates.length) {
      L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);
      map.fitBounds(L.polyline(routeCoordinates).getBounds());
    }

    // Append the card to the day cell
    dayCell.appendChild(card);
  });
}

// Function to decode the polyline provided by Strava
function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let result = 1, shift = 0, byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result += byte << shift;
      shift += 5;
    } while (byte >= 0x20);

    let dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0, result = 1;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result += byte << shift;
      shift += 5;
    } while (byte >= 0x20);

    let dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push([lat / 1E5, lng / 1E5]);
  }

  return points;
}

// Utility to format time from seconds to HH:MM:SS
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}
