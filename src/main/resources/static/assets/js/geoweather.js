// --- HELPER FUNCTIONS FOR WEATHER WIDGET ---
function getWeatherIcon(iconCode) {
  const icons = {
    "01d": "☀️", "01n": "🌙",
    "02d": "🌤️", "02n": "🌤️",
    "03d": "⛅",  "03n": "⛅",
    "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌦️",
    "11d": "⚡",  "11n": "⚡",
    "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️"
  };
  return icons[iconCode] || "🌡️";
}

function formatTime(unix, offset) {
  if (!unix) return '--:--';
  const date = new Date((unix + (offset || 0)) * 1000);
  let hour = date.getUTCHours(), min = date.getUTCMinutes();
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12; if (hour === 0) hour = 12;
  return `${hour}:${min.toString().padStart(2,'0')} ${ampm}`;
}

function formatShortAddress(address) {
  if (!address) return '';
  const keys = ["road", "barangay", "village", "suburb", "town", "city", "municipality", "state"];
  return keys.map(k => address[k]).filter(Boolean).join(', ');
}


// --- FUNCTION TO FETCH AND DISPLAY LOCAL WEATHER WIDGET ---
const fetchLocalWeather = () => {
    const weatherWidget = document.getElementById('about-current-weather');
    if (!weatherWidget) return;

    if (navigator.geolocation) {
        weatherWidget.innerHTML = 'Detecting your current weather...';
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            // First, get address from Nominatim
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                .then(resp => resp.json())
                .then(nom => {
                    const addr = formatShortAddress(nom.address || {});
                    // Then, get weather from our own API
                    fetch(`/api/localweather?lat=${latitude}&lon=${longitude}`)
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok');
                            return response.json();
                        })
                        .then(data => {
                            if (data.error) {
                                weatherWidget.innerHTML = `<p>${data.error}</p>`;
                                return;
                            }
                             const main = data.main || {},
                                  weather = (Array.isArray(data.weather) && data.weather[0]) ? data.weather[0] : {},
                                  wind = data.wind || {}, sys = data.sys || {},
                                  temp = main.temp != null ? Math.round(main.temp) : '--',
                                  feels = main.feels_like != null ? Math.round(main.feels_like) : null,
                                  desc = weather.description 
                                    ? weather.description.charAt(0).toUpperCase() + weather.description.slice(1)
                                    : '',
                                  icon = getWeatherIcon(weather.icon),
                                  humidity = main.humidity || '--',
                                  windSpd = wind.speed != null ? wind.speed : '--',
                                  vis = data.visibility != null ? (data.visibility/1000).toFixed(1)+' km' : 'N/A',
                                  sunrise = formatTime(sys.sunrise, data.timezone), 
                                  sunset = formatTime(sys.sunset, data.timezone);

                            weatherWidget.innerHTML = `
                              <div class="mw-header">📍 <span>${addr || "Your location"}</span></div>
                              <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:3px;">
                                <span class="mw-icon">${icon}</span>
                                <span class="mw-temp">${temp}°C</span>
                                ${feels ? `<span class="mw-feels">(feels like ${feels}°C)</span>` : ''}
                              </div>
                              <div class="mw-pill" 
                                  style="display:inline-block; background:rgba(33,158,188,0.18); 
                                         border:1px solid rgba(33,158,188,0.35); color:#bfe7f4; 
                                         border-radius:999px; padding:5px 14px 5px 14px; font-size:13px; font-weight:600; margin-bottom:15px;">
                                  ${desc}
                              </div>
                              <div class="mw-row">
                                <div><small>Humidity</small><br><b>${humidity}${humidity!=='--'?'%':''}</b></div>
                                <div><small>Wind</small><br><b>${windSpd}${windSpd!=='--'?' m/s':''}</b></div>
                                <div><small>Visibility</small><br><b>${vis}</b></div>
                              </div>
                              <div class="mw-sun">
                                <span>🌅 ${sunrise}</span>
                                <span>🌇 ${sunset}</span>
                              </div>
                            `;
                        })
                        .catch(error => {
                            console.error('Error fetching local weather:', error);
                            weatherWidget.innerHTML = '<p>Could not fetch local weather data.</p>';
                        });
                })
                .catch(error => {
                    console.error('Error fetching address:', error);
                    weatherWidget.innerHTML = '<p>Could not determine location name.</p>';
                });
        }, error => {
            console.error('Geolocation error:', error);
            weatherWidget.innerHTML = '<p style="font-size: 14px; text-align: center;">Location access denied.<br>Enable it in your browser settings to see local weather here.</p>';
        });
    } else {
        weatherWidget.innerHTML = '<p>Geolocation is not supported by your browser.</p>';
    }
};
