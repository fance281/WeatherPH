package weatherPhApplication.java.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import weatherPhApplication.java.model.RouteWeatherResponse;
import org.springframework.http.HttpMethod;
import java.net.URLEncoder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@Service
public class WeatherService {

    @Value("${app.openweather.api}")
    private String OPENWEATHER_API;

    @Value("${app.openweather.key}")
    private String OPENWEATHER_KEY;

    public RouteWeatherResponse getRouteWeather(String origin, String destination) {
        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> originWeather = fetchWeatherPrecisePH(restTemplate, origin.trim().toLowerCase());
        Map<String, Object> destinationWeather = fetchWeatherPrecisePH(restTemplate, destination.trim().toLowerCase());

        String originHazard = extractHazard(originWeather);
        String destinationHazard = extractHazard(destinationWeather);

        RouteWeatherResponse response = new RouteWeatherResponse();
        response.setOrigin(origin);
        response.setDestination(destination);
        response.setOriginWeather(originWeather);
        response.setDestinationWeather(destinationWeather);
        response.setOriginHazard(originHazard);
        response.setDestinationHazard(destinationHazard);

        // Set empty lists as Road Risk API is deprecated
        response.setOriginHazards(new ArrayList<>());
        response.setDestinationHazards(new ArrayList<>());

        return response;
    }

    private Map<String, Object> fetchWeatherPrecisePH(RestTemplate restTemplate, String location) {
        try {
            String geocodingUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" +
                    URLEncoder.encode(location, "UTF-8") + ",PH&limit=1&appid=" + OPENWEATHER_KEY;
            ResponseEntity<List<Map<String, Object>>> geoResp = restTemplate.exchange(
                geocodingUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            List<Map<String, Object>> geo = geoResp.getBody();
            if (geo != null && !geo.isEmpty()) {
                return getWeatherFromGeoResult(restTemplate, geo.get(0), location);
            }
            String fallbackUrl = "http://api.openweathermap.org/geo/1.0/direct?q=" +
                    URLEncoder.encode(location, "UTF-8") + "&limit=5&appid=" + OPENWEATHER_KEY;
            ResponseEntity<List<Map<String, Object>>> geoResp2 = restTemplate.exchange(
                fallbackUrl,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
            );
            geo = geoResp2.getBody();
            if (geo != null && !geo.isEmpty()) {
                for (Map<String, Object> result : geo) {
                    String country = (String) result.get("country");
                    if ("PH".equals(country) || "Philippines".equals(country)) {
                        return getWeatherFromGeoResult(restTemplate, result, location);
                    }
                }
            }
            return Map.of("error", "Location not found in the Philippines: " + location);
        } catch (Exception ex) {
            return Map.of("error", "Geocoding/weather error: " + ex.getMessage());
        }
    }

    private Map<String, Object> getWeatherFromGeoResult(RestTemplate restTemplate, Map<String, Object> loc, String originalLocation) {
        try {
            double lat = ((Number) loc.get("lat")).doubleValue();
            double lon = ((Number) loc.get("lon")).doubleValue();
            String resolvedName = (String) loc.getOrDefault("name", originalLocation);
            if (loc.containsKey("state"))
                resolvedName += ", " + loc.get("state");

            String url = OPENWEATHER_API + "?lat=" + lat + "&lon=" + lon + "&appid=" + OPENWEATHER_KEY + "&units=metric";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            Map<String, Object> data = response.getBody();
            if (data == null) return Map.of("error", "No weather data for coordinates.");

            HashMap<String, Object> result = new HashMap<>();
            result.put("name", resolvedName);
            result.put("main", data.get("main"));
            result.put("weather", data.get("weather"));
            result.put("wind", data.get("wind"));
            result.put("visibility", data.get("visibility"));
            result.put("timezone", data.get("timezone"));
            result.put("sys", data.get("sys"));
            result.put("coord", Map.of("lat", lat, "lon", lon));
            return result;
        } catch (Exception ex) {
            return Map.of("error", "Failed to get weather: " + ex.getMessage());
        }
    }

    private String extractHazard(Map<String, Object> w) {
        try {
            if (w == null || w.containsKey("error")) return "No weather data available.";
            if (w.get("weather") == null) return "No weather data available.";

            var list = (java.util.List<?>) w.get("weather");
            if (list.isEmpty()) return "No weather data available.";
            var item = (Map<?, ?>) list.get(0);
            String desc = String.valueOf(item.get("description")).toLowerCase();

            if (desc.contains("heavy") && desc.contains("rain")) {
                return "⚠️ Heavy rain detected. Potential flooding—avoid low-lying areas.";
            }
            if (desc.contains("thunderstorm") || desc.contains("storm")) {
                return "⚠️ Stormy conditions. Expect poor visibility and strong winds.";
            }
            if (desc.contains("rain") || desc.contains("drizzle")) {
                return "ℹ️ Rain expected. Drive carefully and check flood-prone routes.";
            }
            if (desc.contains("wind") || desc.contains("windy")) {
                return "💨 Windy conditions. Be cautious with high-profile vehicles.";
            }
            return "✅ No immediate hazards detected for travel.";
        } catch (Exception e) {
            return "Unable to assess travel hazards.";
        }
    }
}
