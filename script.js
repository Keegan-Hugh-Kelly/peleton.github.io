const clientId = '89647';
const clientSecret = '5f3153577c7075ce79e34a136021a949ff52ed40';
const redirectUri = 'https://keegan-hugh-kelly.github.io/peleton.github.io/';
let accessToken = '3ab1bc609c9f8bdd88967f8cde8436dfddac5be7';
let refreshToken = '96ac84c86ca3e751e2eb29fb32fd55ac1a10bd47';
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
    expiresAt = Math.floor(Date.now() / 1000) + data.expires_in; // Save expiration time in seconds

    // Save tokens and expiration time to local storage
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('expires_at', expiresAt);

    // Hide the login section after successful login
    document.getElementById('strava-login-section').style.display = 'none';

    // Fetch activities after successful authorization
    getActivities(accessToken);
  })
  .catch(error => console.error('Error during authorization:', error));
}

// Refresh the access token using the refresh token
function refreshAccessToken() {
  fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.access_token) {
      accessToken = data.access_token;
      expiresAt = Math.floor(Date.now() / 1000) + data.expires_in; // Save expiration time in seconds
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('expires_at', expiresAt);
      getActivities(accessToken); // Fetch activities after refresh
    } else {
      console.error('Error refreshing access token:', data);
      // If refreshing failed, log the error and ask the user to reauthorize
      alert('Failed to refresh access token. Please reauthorize.');
    }
  })
  .catch(error => {
    console.error('Error refreshing access token:', error);
  });
}

// Fetch activities from Strava
function getActivities(accessToken) {
  fetch('https://www.strava.com/api/v3/athlete/activities', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        // Log the error response from Strava
        console.error('Error fetching activities:', errorData);
        throw new Error('Failed to fetch activities');
      });
    }
    return response.json();
  })
  .then(activities => {
    console.log('Activities:', activities); // Log the response for inspection
    if (Array.isArray(activities)) {
      displayActivities(activities);
      displayChart(activities); // Show activities chart
    } else {
      console.error('Expected activities to be an array, but received:', activities);
    }
  })
  .catch(error => {
    console.error('Error fetching activities:', error);
  });
}

// Display activities in a list
function displayActivities(activities) {
  const activityList = document.getElementById('activity-list');
  
  // Check if activities is an array
  if (Array.isArray(activities)) {
    activities.forEach(activity => {
      const activityCard = document.createElement('div');
      activityCard.classList.add('activity-card');
      activityCard.innerHTML = `
        <h3>${activity.name}</h3>
        <p><strong>Type:</strong> ${activity.type}</p>
        <p><strong>Distance:</strong> ${(activity.distance / 1000).toFixed(2)} km</p>
        <p><strong>Date:</strong> ${new Date(activity.start_date).toLocaleDateString()}</p>
      `;
      activityList.appendChild(activityCard);
    });
  } else {
    console.error('Received data is not an array:', activities);
  }
}

// Display activities chart
function displayChart(activities) {
  const ctx = document.getElementById('myChart').getContext('2d');
  const labels = activities.map(activity => new Date(activity.start_date).toLocaleDateString());
  const data = activities.map(activity => activity.distance / 1000); // Convert meters to km

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Distance (km)',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          beginAtZero: true,
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}
