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
import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    @Value("${app.openweather.key}")
    private String openWeatherApiKey;

    public RouteWeatherResponse getRouteWeather(String origin, String destination) {
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> originWeather = fetchWeatherByLocationName(restTemplate, origin);
        Map<String, Object> destinationWeather = fetchWeatherByLocationName(restTemplate, destination);

        RouteWeatherResponse response = new RouteWeatherResponse();
        response.setOrigin(origin);
        response.setDestination(destination);
        response.setOriginWeather(originWeather);
        response.setDestinationWeather(destinationWeather);

        return response;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getWeather(double lat, double lon) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = String.format(
                    "https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&units=metric&appid=%s",
                    lat, lon, openWeatherApiKey);
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || response.isEmpty() || (response.containsKey("cod") && !"200".equals(String.valueOf(response.get("cod"))))) {
                return Map.of("error", "Weather data for this point is currently unavailable.");
            }
            return response;
        } catch (Exception e) {
            System.err.println("Get weather failed. Error: " + e.getMessage());
            return Map.of("error", "Weather data for this point is currently unavailable.");
        }
    }

    private Map<String, Object> fetchWeatherByLocationName(RestTemplate restTemplate, String location) {
        try {
            String encodedLocation = URLEncoder.encode(location, StandardCharsets.UTF_8);
            String geocodingUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" +
                    encodedLocation + ",PH&limit=1&appid=" + openWeatherApiKey;
            
            ResponseEntity<List<Map<String, Object>>> geoResp = restTemplate.exchange(
                geocodingUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {}
            );

            List<Map<String, Object>> geoResults = geoResp.getBody();
            if (geoResults != null && !geoResults.isEmpty()) {
                Map<String, Object> primaryResult = geoResults.get(0);
                double lat = ((Number) primaryResult.get("lat")).doubleValue();
                double lon = ((Number) primaryResult.get("lon")).doubleValue();
                Map<String, Object> weatherData = getWeather(lat, lon);
                // Ensure the resolved name from geocoding is in the final map
                weatherData.put("name", primaryResult.get("name") + ", " + primaryResult.get("country"));
                return weatherData;
            } else {
                 return Map.of("error", "Location not found in the Philippines: " + location);
            }
        } catch (Exception ex) {
            System.err.println("Geocoding/weather error for location '" + location + "': " + ex.getMessage());
            return Map.of("error", "Could not retrieve weather for " + location);
        }
    }
}

