package weatherPhApplication.java.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import weatherPhApplication.java.model.RouteWeatherResponse;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    @Value("${app.openweather.api}")
    private String OPENWEATHER_API;

    @Value("${app.openweather.key}")
    private String OPENWEATHER_KEY;

    public RouteWeatherResponse getRouteWeather(String origin, String destination) {
        RestTemplate restTemplate = new RestTemplate();
        RouteWeatherResponse response = new RouteWeatherResponse();
        response.setOrigin(origin);
        response.setDestination(destination);

        // Fetch weather using the robust method that validates PH locations
        Map<String, Object> originWeather = fetchWeatherPrecisePH(restTemplate, origin.trim().toLowerCase());
        Map<String, Object> destinationWeather = fetchWeatherPrecisePH(restTemplate, destination.trim().toLowerCase());
        
        response.setOriginWeather(originWeather);
        response.setDestinationWeather(destinationWeather);

        // If geocoding failed, the weather map will contain an 'error' key. We stop here.
        if (originWeather.containsKey("error") || destinationWeather.containsKey("error")) {
            return response; // The controller will handle showing the error message
        }

        // Generate and set advisories
        Map<String, String> originAdvisories = splitWeatherAndTempAdvisory(originWeather);
        Map<String, String> destAdvisories = splitWeatherAndTempAdvisory(destinationWeather);

        response.setOriginHazard(originAdvisories.get("weather"));
        response.setOriginTravelHazard(originAdvisories.get("temp"));
        response.setDestinationHazard(destAdvisories.get("weather"));
        response.setDestinationTravelHazard(destAdvisories.get("temp"));
        
        // Extract and set coordinates
        setCoordinatesFromWeather(response, originWeather, "origin");
        setCoordinatesFromWeather(response, destinationWeather, "destination");
        
        // Set empty lists as Road Risk API is deprecated
        response.setOriginHazards(new ArrayList<>());
        response.setDestinationHazards(new ArrayList<>());

        return response;
    }

    private Map<String, Object> fetchWeatherPrecisePH(RestTemplate restTemplate, String location) {
        try {
            // First attempt: Search strictly within the Philippines
            String geocodingUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" +
                    URLEncoder.encode(location, StandardCharsets.UTF_8) + ",PH&limit=1&appid=" + OPENWEATHER_KEY;
            
            ResponseEntity<List<Map<String, Object>>> geoResp = restTemplate.exchange(
                geocodingUrl, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            
            List<Map<String, Object>> geo = geoResp.getBody();
            if (geo != null && !geo.isEmpty()) {
                return getWeatherFromGeoResult(restTemplate, geo.get(0), location);
            }

            // Second attempt (fallback): Search globally and filter for PH
            String fallbackUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" +
                    URLEncoder.encode(location, StandardCharsets.UTF_8) + "&limit=5&appid=" + OPENWEATHER_KEY;
            
            ResponseEntity<List<Map<String, Object>>> geoResp2 = restTemplate.exchange(
                fallbackUrl, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

            geo = geoResp2.getBody();
            if (geo != null && !geo.isEmpty()) {
                for (Map<String, Object> result : geo) {
                    String country = (String) result.get("country");
                    if ("PH".equalsIgnoreCase(country)) {
                        return getWeatherFromGeoResult(restTemplate, result, location);
                    }
                }
            }
            // If no result is found in the Philippines after both attempts, return an error
            return Map.of("error", "Location not found in the Philippines: " + location);
        } catch (Exception ex) {
            return Map.of("error", "Could not connect to geocoding service. " + ex.getMessage());
        }
    }

    private Map<String, Object> getWeatherFromGeoResult(RestTemplate restTemplate, Map<String, Object> loc, String originalLocation) {
        try {
            double lat = ((Number) loc.get("lat")).doubleValue();
            double lon = ((Number) loc.get("lon")).doubleValue();
            String resolvedName = (String) loc.getOrDefault("name", originalLocation);
            if (loc.containsKey("state")) resolvedName += ", " + loc.get("state");

            String url = OPENWEATHER_API + "?lat=" + lat + "&lon=" + lon + "&appid=" + OPENWEATHER_KEY + "&units=metric";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            
            Map<String, Object> data = response.getBody();
            if (data == null) return Map.of("error", "No weather data for coordinates.");

            // We must add the coordinates to the result for the controller to use
            data.put("coord", Map.of("lat", lat, "lon", lon));
            data.put("resolvedName", resolvedName); // Use a resolved name

            return data;
        } catch (Exception ex) {
            return Map.of("error", "Failed to get weather: " + ex.getMessage());
        }
    }

    private Map<String, String> splitWeatherAndTempAdvisory(Map<String, Object> weather) {
        // This is the detailed advisory logic previously in RouteController
        String weatherAdvice = null;
        String tempAdvice = null;
        if (weather == null || weather.containsKey("error")) {
            weatherAdvice = "No live weather data. Please check your connection or try again later.";
            return Map.of("weather", weatherAdvice, "temp", tempAdvice);
        }
        String mainCond = "", description = "";
        if (weather.get("weather") instanceof List) {
            List<?> weatherList = (List<?>) weather.get("weather");
            if (!weatherList.isEmpty() && weatherList.get(0) instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> weatherMain = (Map<String, Object>) weatherList.get(0);
                mainCond = weatherMain.get("main") != null ? weatherMain.get("main").toString().toLowerCase() : "";
                description = weatherMain.get("description") != null ? weatherMain.get("description").toString().toLowerCase() : "";
            }
        }
        double temp = Double.NaN;
        if (weather.containsKey("main") && weather.get("main") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> main = (Map<String, Object>) weather.get("main");
            if (main.get("temp") instanceof Number) {
                temp = ((Number) main.get("temp")).doubleValue();
            }
        }

        if (description.equals("overcast clouds")) {
            weatherAdvice = "☁️ Overcast Skies: Visibility may be reduced. Ensure your vehicle's headlights are on for safety.";
        } else if (description.equals("broken clouds")) {
            weatherAdvice = "🌥️ Partly Cloudy: Expect intermittent sun. Conditions are generally excellent for travel.";
        } else if (description.equals("scattered clouds")) {
            weatherAdvice = "⛅ Scattered Clouds: Mostly clear with good visibility. Travel conditions are ideal.";
        } else if (description.equals("few clouds")) {
            weatherAdvice = "🌤️ Mostly Sunny: Excellent visibility and road conditions expected. A great day for travel.";
        } else if (description.contains("light rain")) {
            weatherAdvice = "🌦️ Light Rain Advisory: Roads may be slick. Activate wipers and increase your following distance.";
        } else if (description.contains("moderate rain")) {
            weatherAdvice = "🌧️ Moderate Rain Warning: Reduce speed significantly and use headlights. Be alert for localized flooding.";
        } else if (description.contains("heavy rain")) {
            weatherAdvice = "🌧️ Heavy Rain Warning: High risk of flash floods and zero visibility. It is strongly advised to postpone travel.";
        } else if (description.contains("clear sky")) {
            weatherAdvice = "🌞 Clear Skies: Ideal travel conditions. Stay aware of road traffic and hydrate, especially during long drives.";
        } else if (mainCond.contains("thunderstorm")) {
            weatherAdvice = "⛈️ Thunderstorm Warning: Severe weather is active. High risk of lightning, flash floods, and strong winds. Do not travel.";
        } else if (mainCond.contains("snow")) {
            weatherAdvice = "❄️ Snow/Sleet Advisory: Roads will be extremely slippery and visibility poor. Travel is not recommended unless essential.";
        } else if (mainCond.contains("fog") || description.contains("fog") || mainCond.contains("mist")) {
            weatherAdvice = "🌫️ Low Visibility Warning: Dense fog or mist is present. Use low-beam headlights and fog lights, and reduce speed drastically.";
        } else if (mainCond.contains("wind")) {
            weatherAdvice = "💨 High Wind Advisory: Be cautious, especially with high-profile vehicles. Watch for falling debris and be prepared for sudden gusts.";
        }
        
        if (!Double.isNaN(temp)) {
            if (temp >= 37.0) {
                tempAdvice = "🌡️ Danger - Extreme Heat: Heatstroke risk is high. Avoid non-essential travel and stay hydrated. Never leave people or pets in a vehicle.";
            } else if (temp >= 34.0) {
                tempAdvice = "☀️ Heat Caution: Risk of heat exhaustion. Drink plenty of water, wear light clothing, and take breaks in the shade.";
            } else if (temp >= 28.0) {
                tempAdvice = "🌤️ Warm Weather: Conditions are pleasant. Ensure you have drinking water available for your journey.";
            } else if (temp >= 24.0) {
                tempAdvice = "😊 Pleasant Weather: Ideal temperature for travel. Enjoy the trip safely.";
            } else if (temp >= 20.0) {
                tempAdvice = "🌡️ Mild Temperature: Comfortable conditions for any travel plans.";
            } else if (temp <= 12.0) {
                tempAdvice = "🧥 Cool Conditions: Temperatures are low. A jacket is recommended, particularly for night travel or trips to higher elevations.";
            }
        }
        return Map.of("weather", weatherAdvice, "temp", tempAdvice);
    }
    
    private void setCoordinatesFromWeather(RouteWeatherResponse response, Map<String, Object> weatherData, String type) {
        if (weatherData != null && weatherData.get("coord") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> coords = (Map<String, Object>) weatherData.get("coord");
            double lat = ((Number) coords.get("lat")).doubleValue();
            double lon = ((Number) coords.get("lon")).doubleValue();
            if ("origin".equals(type)) {
                response.setOriginLat(lat);
                response.setOriginLon(lon);
            } else {
                response.setDestinationLat(lat);
                response.setDestinationLon(lon);
            }
        }
    }
}

