document.addEventListener('DOMContentLoaded', function () {
    // The MAPBOX_TOKEN is now expected to be defined in the HTML file before this script runs.
    if (typeof MAPBOX_TOKEN === 'undefined') {
        console.error('Mapbox token is not defined. Please ensure it is passed from the server.');
        return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    let map;
    let marker;
    let hourlyDataStore = [];

    const locationNameEl = document.getElementById('location-name');
    const currentWeatherCardEl = document.getElementById('current-weather-card');
    const currentWeatherContentEl = document.getElementById('current-weather-content');
    const hourlyForecastEl = document.getElementById('hourly-forecast');
    const dailyForecastEl = document.getElementById('daily-forecast');

    function initializeMap(center) {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            center: center,
            zoom: 12
        });

        marker = new mapboxgl.Marker().setLngLat(center).addTo(map);

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            countries: 'ph',
            types: 'country,region,place,postcode,locality,neighborhood,address,poi',
        });

        document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

        geocoder.on('result', function (e) {
            const coords = e.result.center;
            locationNameEl.textContent = e.result.place_name;
            updateWeather(coords[1], coords[0]);
        });
        
        map.on('click', function(e) {
            const coords = e.lngLat;
            updateWeather(coords.lat, coords.lng);
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${MAPBOX_TOKEN}`)
                .then(response => response.json())
                .then(data => {
                    if (data.features && data.features.length > 0) {
                        locationNameEl.textContent = data.features[0].place_name;
                    } else {
                        locationNameEl.textContent = 'Unknown Location';
                    }
                });
        });

        document.querySelectorAll('.map-style-btn').forEach(button => {
            button.addEventListener('click', function() {
                const style = this.getAttribute('data-style');
                map.setStyle(style);
                document.querySelectorAll('.map-style-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function updateWeather(lat, lon) {
        const newCoords = [lon, lat];
        marker.setLngLat(newCoords);
        map.flyTo({ center: newCoords, zoom: 12, duration: 2000, easing: t => t * (2 - t) });

        fetch(`/api/localweather?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    currentWeatherContentEl.innerHTML = `<p>${data.error}</p>`;
                    return;
                }
                displayCurrentWeather(data);
            })
            .catch(error => {
                console.error('Error fetching current weather:', error);
                currentWeatherContentEl.innerHTML = `<p>Could not load weather data.</p>`;
            });

        fetch(`/api/forecast?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    hourlyForecastEl.innerHTML = `<p>${data.error}</p>`;
                    dailyForecastEl.innerHTML = `<p>${data.error}</p>`;
                    return;
                }
                hourlyDataStore = data.list; // Store for reuse
                displayHourlyForecast(data.list);
                displayDailyForecast(data.list);
            })
            .catch(error => {
                 console.error('Error fetching forecast:', error);
                hourlyForecastEl.innerHTML = `<p>Could not load forecast data.</p>`;
            });
    }

    function setWeatherBackground(weatherMain) {
        const bgOverlay = currentWeatherCardEl.querySelector('.weather-bg-overlay');
        let imageUrl = '';
        switch (weatherMain) {
            case 'Clear':
                imageUrl = 'https://images.unsplash.com/photo-1590071353885-d75bae2135ab?q=80&w=1887&auto=format&fit=crop';
                break;
            case 'Clouds':
                imageUrl = 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=2070&auto=format&fit=crop';
                break;
            case 'Rain':
            case 'Drizzle':
                imageUrl = 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1935&auto=format&fit=crop';
                break;
            case 'Thunderstorm':
                imageUrl = 'https://images.unsplash.com/photo-1605727226343-9364a6f44558?q=80&w=1887&auto=format&fit=crop';
                break;
            case 'Snow':
                 imageUrl = 'https://images.unsplash.com/photo-1483664852095-d692180e2e5b?q=80&w=2070&auto=format&fit=crop';
                break;
            default: // Mist, Smoke, Haze, etc.
                imageUrl = 'https://images.unsplash.com/photo-1543236338-0276d1637519?q=80&w=1933&auto=format&fit=crop';
        }
        bgOverlay.style.backgroundImage = `url('${imageUrl}')`;
    }

    function formatTime(unix, timezoneOffset) {
      if (!unix) return '--:--';
      const date = new Date((unix + timezoneOffset) * 1000);
      let hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? '0' + minutes : minutes;
      return hours + ':' + minutesStr + ' ' + ampm;
    }

    function displayCurrentWeather(data) {
        if (!locationNameEl.textContent.includes(',')) {
            locationNameEl.textContent = data.name;
        }
        const weather = data.weather[0];
        const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
        const windSpeedKmh = (data.wind.speed * 3.6).toFixed(1);
        const visibilityKm = (data.visibility / 1000).toFixed(1);
        const sunrise = formatTime(data.sys.sunrise, data.timezone);
        const sunset = formatTime(data.sys.sunset, data.timezone);


        setWeatherBackground(weather.main);

        currentWeatherContentEl.innerHTML = `
             <div class="weather-main-info">
                <img src="${iconUrl}" alt="${weather.description}">
                <div class="current-temp">${(data.main.temp).toFixed(1)}°C</div>
                <div class="current-desc">${weather.description}</div>
            </div>
            <div class="weather-extra-details">
                <p><strong>Feels like</strong> <span>${(data.main.feels_like).toFixed(1)}°C</span></p>
                <p><strong>Wind</strong> <span>${windSpeedKmh} km/h</span></p>
                <p><strong>Humidity</strong> <span>${data.main.humidity}%</span></p>
                <p><strong>Visibility</strong> <span>${visibilityKm} km</span></p>
                <p><strong>Sunrise</strong> <span>${sunrise}</span></p>
                <p><strong>Sunset</strong> <span>${sunset}</span></p>
            </div>
        `;
    }

    function displayHourlyForecast(list) {
        if (!list || list.length === 0) {
            hourlyForecastEl.innerHTML = '<p>Hourly forecast not available.</p>';
            return;
        }
        hourlyForecastEl.innerHTML = ''; 

        const next8Hours = list.slice(0, 8);

        next8Hours.forEach((item) => {
            const date = new Date(item.dt * 1000);
            let hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const timeString = `${hours} ${ampm}`;
            
            const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
            const temp = `${(item.main.temp).toFixed(0)}°`;
            const description = item.weather[0].description;
            
            const itemWrapper = document.createElement('div');
            
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'daily-item';
            hourlyItem.innerHTML = `
                <div class="daily-date">
                    <div>${timeString}</div>
                    <div class="daily-desc">${description}</div>
                </div>
                <img src="${iconUrl}" alt="${description}">
                <div class="daily-temp">${temp}C</div>
            `;
            
            const detailsItem = document.createElement('div');
            detailsItem.className = 'daily-details';
            detailsItem.innerHTML = `
                <div><strong>Feels like</strong><span>${(item.main.feels_like).toFixed(1)}°C</span></div>
                <div><strong>Wind</strong><span>${(item.wind.speed * 3.6).toFixed(1)} km/h</span></div>
                <div><strong>Humidity</strong><span>${item.main.humidity}%</span></div>
                <div><strong>Pressure</strong><span>${item.main.pressure} hPa</span></div>
                <div style="grid-column: 1 / -1;"><strong>Cloud Cover</strong><span>${item.clouds.all}%</span></div>
            `;

            hourlyItem.addEventListener('click', () => {
                const isActive = hourlyItem.classList.toggle('active');
                detailsItem.classList.toggle('show', isActive);
            });

            itemWrapper.appendChild(hourlyItem);
            itemWrapper.appendChild(detailsItem);
            hourlyForecastEl.appendChild(itemWrapper);
        });
    }

    function displayDailyForecast(list) {
        if (!list) {
             dailyForecastEl.innerHTML = '<p>Daily forecast not available.</p>';
            return;
        }
        
        const dailyData = {};
        list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toISOString().split('T')[0];
            if (!dailyData[day]) {
                dailyData[day] = {
                    temps: [],
                    humidity: [],
                    wind: [],
                    icons: {},
                    descriptions: {}
                };
            }
            dailyData[day].temps.push(item.main.temp);
            dailyData[day].humidity.push(item.main.humidity);
            dailyData[day].wind.push(item.wind.speed);
            const icon = item.weather[0].icon.replace('n', 'd');
            dailyData[day].icons[icon] = (dailyData[day].icons[icon] || 0) + 1;
            dailyData[day].descriptions[item.weather[0].description] = (dailyData[day].descriptions[item.weather[0].description] || 0) + 1;
        });

        dailyForecastEl.innerHTML = '';

        Object.keys(dailyData).slice(0, 7).forEach(day => {
            const dayData = dailyData[day];
            const date = new Date(day);
            const dayName = date.toLocaleDateString(undefined, { weekday: 'long' });
            const maxTemp = Math.round(Math.max(...dayData.temps));
            const minTemp = Math.round(Math.min(...dayData.temps));
            const avgHumidity = Math.round(dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length);
            const maxWind = (Math.max(...dayData.wind) * 3.6).toFixed(1);
            const mostCommonIcon = Object.keys(dayData.icons).reduce((a, b) => dayData.icons[a] > dayData.icons[b] ? a : b);
            const iconUrl = `https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png`;
            const mostCommonDesc = Object.keys(dayData.descriptions).reduce((a, b) => dayData.descriptions[a] > dayData.descriptions[b] ? a : b);

            const itemWrapper = document.createElement('div');
            
            const dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item';
            dailyItem.innerHTML = `
                <div class="daily-date">
                    <div>${dayName}</div>
                    <div class="daily-desc">${mostCommonDesc}</div>
                </div>
                <img src="${iconUrl}" alt="${mostCommonDesc}">
                <div class="daily-temp">${maxTemp}° / ${minTemp}°</div>
            `;
            
            const detailsItem = document.createElement('div');
            detailsItem.className = 'daily-details';
            detailsItem.innerHTML = `
                <div><strong>Avg. Humidity</strong><span>${avgHumidity}%</span></div>
                <div><strong>Max Wind</strong><span>${maxWind} km/h</span></div>
                <div style="grid-column: 1 / -1;"><strong>Condition</strong><span style="text-transform:capitalize;">${mostCommonDesc}</span></div>
            `;

            dailyItem.addEventListener('click', () => {
                const isActive = dailyItem.classList.toggle('active');
                detailsItem.classList.toggle('show', isActive);
            });

            itemWrapper.appendChild(dailyItem);
            itemWrapper.appendChild(detailsItem);
            dailyForecastEl.appendChild(itemWrapper);
        });
    }

    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const initialCoords = [longitude, latitude];
                    initializeMap(initialCoords);
                    updateWeather(latitude, longitude);

                    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.features && data.features.length > 0) {
                                locationNameEl.textContent = data.features[0].place_name;
                            }
                        });
                },
                () => {
                    const fallbackCoords = [120.9842, 14.5995];
                    initializeMap(fallbackCoords);
                    updateWeather(fallbackCoords[1], fallbackCoords[0]);
                    locationNameEl.textContent = "Manila, Philippines";
                }
            );
        } else {
            const fallbackCoords = [120.9842, 14.5995];
            initializeMap(fallbackCoords);
            updateWeather(fallbackCoords[1], fallbackCoords[0]);
            locationNameEl.textContent = "Manila, Philippines";
        }
    }

    const forecastToggleButtons = document.querySelectorAll('.forecast-toggle-btn');
    forecastToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            forecastToggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const forecastType = this.getAttribute('data-forecast');
            if (forecastType === 'hourly') {
                hourlyForecastEl.style.display = 'flex';
                dailyForecastEl.style.display = 'none';
            } else {
                hourlyForecastEl.style.display = 'none';
                dailyForecastEl.style.display = 'flex';
            }
        });
    });

    // Set default view
    hourlyForecastEl.style.display = 'flex';
    dailyForecastEl.style.display = 'none';


    getUserLocation();
});

