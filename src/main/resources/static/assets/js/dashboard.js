document.addEventListener('DOMContentLoaded', function () {
    const MAPBOX_TOKEN = 'pk.eyJ1IjoibGFuY2UyMiIsImEiOiJjbWdrOTVvcjAwcnpyMmtxeTRlN2piaWx4In0.PqGLzIZ6SFCSQaBv2a7_JQ';
    mapboxgl.accessToken = MAPBOX_TOKEN;

    let map;
    let marker;

    const locationNameEl = document.getElementById('location-name');
    const currentWeatherContentEl = document.getElementById('current-weather-content');
    const hourlyForecastEl = document.getElementById('hourly-forecast');
    const dailyForecastEl = document.getElementById('daily-forecast');

    function initializeMap(center) {
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10', // Default style
            center: center,
            zoom: 14 // Increased zoom level
        });

        marker = new mapboxgl.Marker().setLngLat(center).addTo(map);

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            countries: 'ph', // Prioritize search results for the Philippines
            types: 'country,region,place,postcode,locality,neighborhood,address,poi', // Broader search types
        });

        document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

        geocoder.on('result', function (e) {
            const coords = e.result.center;
            const placeName = e.result.place_name;
            locationNameEl.textContent = placeName;
            updateWeather(coords[1], coords[0]);
        });
        
        // Add click listener to the map
        map.on('click', function(e) {
            const coords = e.lngLat;
            updateWeather(coords.lat, coords.lng);
            // Reverse geocode to get location name from pinpoint
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


        // Add event listeners for map style buttons
        document.querySelectorAll('.map-style-btn').forEach(button => {
            button.addEventListener('click', function() {
                const style = this.getAttribute('data-style');
                map.setStyle(style);
                
                // Update active button
                document.querySelectorAll('.map-style-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    function updateWeather(lat, lon) {
        // Update marker and map view
        const newCoords = [lon, lat];
        marker.setLngLat(newCoords);
        map.flyTo({ 
            center: newCoords, 
            zoom: 14, // Increased zoom level
            duration: 2000, // Makes the animation smoother
            easing: function (t) {
                return t * (2 - t);
            }
        });

        // Fetch Current Weather
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

        // Fetch Forecast (from 2.5/forecast API)
        fetch(`/api/forecast?lat=${lat}&lon=${lon}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    hourlyForecastEl.innerHTML = `<p>${data.error}</p>`;
                    dailyForecastEl.innerHTML = `<p>${data.error}</p>`;
                    return;
                }
                displayHourlyForecast(data.list);
                displayDailyForecast(data.list);
            })
            .catch(error => {
                 console.error('Error fetching forecast:', error);
                hourlyForecastEl.innerHTML = `<p>Could not load forecast data.</p>`;
            });
    }

    function displayCurrentWeather(data) {
        // Only update location name if the geocoder hasn't already
        if (!locationNameEl.textContent.includes(',')) {
            locationNameEl.textContent = data.name;
        }
        const weather = data.weather[0];
        const iconUrl = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;

        // Convert wind speed from m/s to km/h
        const windSpeedKmh = (data.wind.speed * 3.6).toFixed(1);

        currentWeatherContentEl.innerHTML = `
            <div class="current-temp">${(data.main.temp).toFixed(1)}°C</div>
            <div class="current-desc">
                <img src="${iconUrl}" alt="${weather.description}">
                <span>${weather.description}</span>
            </div>
            <div class="weather-extra-details">
                 <p>
                    <strong>Feels like:</strong> <span>${(data.main.feels_like).toFixed(1)}°C</span>
                </p>
                <p>
                    <strong>Humidity:</strong> <span>${data.main.humidity}%</span>
                </p>
                <p>
                    <strong>Wind:</strong> <span>${windSpeedKmh} km/h</span>
                </p>
                <p>
                    <strong>Pressure:</strong> <span>${data.main.pressure} hPa</span>
                </p>
            </div>
        `;
    }

    function displayHourlyForecast(list) {
        hourlyForecastEl.innerHTML = '';
        if (!list) return;
    
        const next8intervals = list.slice(0, 8);
    
        const table = document.createElement('table');
        table.className = 'hourly-forecast-table';
    
        const thead = document.createElement('thead');
        let headerRow = '<tr><th></th>';
        next8intervals.forEach(item => {
            const date = new Date(item.dt * 1000);
            let hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const timeString = `${hours} ${ampm}`;
            headerRow += `<th>${timeString}</th>`;
        });
        headerRow += '</tr>';
        thead.innerHTML = headerRow;
    
        const tbody = document.createElement('tbody');
        let weatherRow = '<tr><td><div class="td-flex-content"><svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg> Weather</div></td>';
        let tempRow = `<tr><td><div class="td-flex-content"><svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg> Temp (°C)</div></td>`;
        let humidityRow = `<tr><td><div class="td-flex-content"><svg class="detail-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg> Humidity (%)</div></td>`;
    
        next8intervals.forEach(item => {
            const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
            const tooltipContent = `
                Feels like: ${(item.main.feels_like).toFixed(2)}°C<br>
                Precipitation: ${item.pop * 100}%<br>
                Wind speed: ${(item.wind.speed * 3.6).toFixed(1)} km/h<br>
                Wind direction: ${item.wind.deg}°
            `;
            weatherRow += `<td><div class="tooltip-container"><img src="${iconUrl}" alt="${item.weather[0].description}"><div class="tooltip">${tooltipContent}</div></div></td>`;
            tempRow += `<td><div class="tooltip-container">${(item.main.temp).toFixed(1)}<div class="tooltip">${tooltipContent}</div></div></td>`;
            humidityRow += `<td><div class="tooltip-container">${item.main.humidity}<div class="tooltip">${tooltipContent}</div></div></td>`;
        });
    
        weatherRow += '</tr>';
        tempRow += '</tr>';
        humidityRow += '</tr>';
        tbody.innerHTML = weatherRow + tempRow + humidityRow;
        
        table.appendChild(thead);
        table.appendChild(tbody);
        hourlyForecastEl.appendChild(table);
    }
    

    function displayDailyForecast(list) {
        dailyForecastEl.innerHTML = '';
        if (!list) return;
        
        const dailyData = {};

        list.forEach(item => {
            const date = new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    feels_like: [],
                    pops: [],
                    wind_speeds: [],
                    wind_degs: [],
                    icons: {},
                    descriptions: {}
                };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].feels_like.push(item.main.feels_like);
            dailyData[date].pops.push(item.pop);
            dailyData[date].wind_speeds.push(item.wind.speed);
            dailyData[date].wind_degs.push(item.wind.deg);
            const icon = item.weather[0].icon.replace('n', 'd');
            dailyData[date].icons[icon] = (dailyData[date].icons[icon] || 0) + 1;
            dailyData[date].descriptions[item.weather[0].description] = (dailyData[date].descriptions[item.weather[0].description] || 0) + 1;
        });

        Object.keys(dailyData).slice(0, 7).forEach(date => {
            const day = dailyData[date];
            const maxTemp = (Math.max(...day.temps)).toFixed(1);
            const minTemp = (Math.min(...day.temps)).toFixed(1);
            const avgFeelsLike = (day.feels_like.reduce((a, b) => a + b, 0) / day.feels_like.length).toFixed(2);
            const avgPop = ((day.pops.reduce((a, b) => a + b, 0) / day.pops.length) * 100).toFixed(0);
            const avgWindSpeed = ((day.wind_speeds.reduce((a, b) => a + b, 0) / day.wind_speeds.length) * 3.6).toFixed(1);
            const avgWindDeg = (day.wind_degs.reduce((a, b) => a + b, 0) / day.wind_degs.length).toFixed(0);
            
            const mostCommonIcon = Object.keys(day.icons).reduce((a, b) => day.icons[a] > day.icons[b] ? a : b);
            const iconUrl = `https://openweathermap.org/img/wn/${mostCommonIcon}.png`;
            const mostCommonDesc = Object.keys(day.descriptions).reduce((a, b) => day.descriptions[a] > day.descriptions[b] ? a : b);

            const tooltipContent = `
                Feels like: ${avgFeelsLike}°C<br>
                Precipitation: ${avgPop}%<br>
                Wind speed: ${avgWindSpeed} km/h<br>
                Wind direction: ${avgWindDeg}°
            `;

            const dailyItem = document.createElement('div');
            dailyItem.className = 'daily-item tooltip-container';
            dailyItem.innerHTML = `
                <span class="daily-date">${date}</span>
                <img src="${iconUrl}" alt="${mostCommonDesc}">
                <span class="daily-temp">${maxTemp}° / ${minTemp}°</span>
                <div class="tooltip">${tooltipContent}</div>
            `;
            dailyForecastEl.appendChild(dailyItem);
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

                    // Reverse geocode to get initial location name
                    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`)
                        .then(response => response.json())
                        .then(data => {
                            if (data.features && data.features.length > 0) {
                                locationNameEl.textContent = data.features[0].place_name;
                            }
                        });
                },
                () => {
                    // Fallback to a default location (e.g., Manila)
                    const fallbackCoords = [120.9842, 14.5995];
                    initializeMap(fallbackCoords);
                    updateWeather(fallbackCoords[1], fallbackCoords[0]);
                    locationNameEl.textContent = "Manila, Philippines";
                }
            );
        } else {
            // Fallback for browsers without geolocation
            const fallbackCoords = [120.9842, 14.5995];
            initializeMap(fallbackCoords);
            updateWeather(fallbackCoords[1], fallbackCoords[0]);
            locationNameEl.textContent = "Manila, Philippines";
        }
    }

    // --- Event Listener for Forecast Toggle ---
    const forecastToggleButtons = document.querySelectorAll('.forecast-toggle-btn');
    const hourlyForecastContainer = document.getElementById('hourly-forecast');
    const dailyForecastContainer = document.getElementById('daily-forecast');

    forecastToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update button active state
            forecastToggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Show/hide forecast containers
            const forecastType = this.getAttribute('data-forecast');
            if (forecastType === 'hourly') {
                hourlyForecastContainer.style.display = 'block';
                dailyForecastContainer.style.display = 'none';
            } else {
                hourlyForecastContainer.style.display = 'none';
                dailyForecastContainer.style.display = 'flex';
            }
        });
    });

    getUserLocation();
});

