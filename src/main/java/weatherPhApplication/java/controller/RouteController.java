package weatherPhApplication.java.controller;

import weatherPhApplication.java.model.RouteWeatherResponse;
import weatherPhApplication.java.service.PagasaAdvisoryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import java.util.*;

@Controller
public class RouteController {

    @Value("${app.openweather.key}")
    private String openWeatherApiKey;

    @Autowired
    private PagasaAdvisoryService pagasaAdvisoryService;

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("response", null);
        model.addAttribute("formError", null);
        model.addAttribute("pagasaAdvisories", pagasaAdvisoryService.fetchLatestAdvisories());
        return "index";
    }

    @PostMapping("/route")
    public String getRouteAdvisory(
            @RequestParam String origin,
            @RequestParam String destination,
            Model model) {

        Map<String, Double> originCoords = geocode(origin);
        Map<String, Double> destCoords = geocode(destination);

        if (originCoords == null || destCoords == null) {
            model.addAttribute("formError", "Could not locate one or both places.");
            model.addAttribute("response", null);
            model.addAttribute("pagasaAdvisories", pagasaAdvisoryService.fetchLatestAdvisories());
            return "index";
        }

        Map<String, Object> originWeather = getWeather(originCoords.get("lat"), originCoords.get("lon"));
        Map<String, Object> destWeather = getWeather(destCoords.get("lat"), destCoords.get("lon"));

        Map<String, String> originAdvisories = splitWeatherAndTempAdvisory(originWeather);
        Map<String, String> destAdvisories   = splitWeatherAndTempAdvisory(destWeather);

        RouteWeatherResponse response = new RouteWeatherResponse(
                origin,
                destination,
                originWeather,
                destWeather,
                originAdvisories.get("weather"),
                destAdvisories.get("weather"),
                new ArrayList<>(), // Road hazards are removed
                new ArrayList<>(), // Road hazards are removed
                originCoords.get("lat"),
                originCoords.get("lon"),
                destCoords.get("lat"),
                destCoords.get("lon")
        );

        model.addAttribute("response", response);
        model.addAttribute("formError", null);
        model.addAttribute("originHazard", originAdvisories.get("weather"));
        model.addAttribute("originTravelHazard", originAdvisories.get("temp"));
        model.addAttribute("destinationHazard", destAdvisories.get("weather"));
        model.addAttribute("destinationTravelHazard", destAdvisories.get("temp"));
        model.addAttribute("pagasaAdvisories", pagasaAdvisoryService.fetchLatestAdvisories());
        return "index";
    }

    private Map<String, String> splitWeatherAndTempAdvisory(Map<String, Object> weather) {
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

        // --- NEW DESCRIPTIONS ---
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
        
        // Temperature-based (for Travel Advisory box)
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

    @SuppressWarnings("unchecked")
    private Map<String, Double> geocode(String place) {
        try {
            // Parse latitude,longitude directly if given
            if (place != null && place.matches("\\-?\\d+\\.?\\d*\\s*,\\s*\\-?\\d+\\.?\\d*")) {
                String[] coords = place.split(",");
                double lat = Double.parseDouble(coords[0].trim());
                double lon = Double.parseDouble(coords[1].trim());
                Map<String, Double> map = new HashMap<>();
                map.put("lat", lat);
                map.put("lon", lon);
                return map;
            }
            // Geocode default for names
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://nominatim.openstreetmap.org/search?q=" + place + ", Philippines&format=json";
            List<Map<String, Object>> results = restTemplate.getForObject(url, List.class);
            if (results != null && !results.isEmpty()) {
                Map<String, Object> first = results.get(0);
                double lat = Double.parseDouble((String) first.get("lat"));
                double lon = Double.parseDouble((String) first.get("lon"));
                Map<String, Double> map = new HashMap<>();
                map.put("lat", lat);
                map.put("lon", lon);
                return map;
            }
        } catch (Exception e) { 
            // Log the error for debugging
            System.err.println("Geocoding failed for place: " + place + ". Error: " + e.getMessage());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getWeather(double lat, double lon) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = String.format(
                    "https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&units=metric&appid=%s",
                    lat, lon, openWeatherApiKey);
            Map<String, Object> result = restTemplate.getForObject(url, Map.class);
            return result;
        } catch (Exception e) {
            System.err.println("Get weather failed. Error: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Weather data for this point is currently unavailable.");
            return error;
        }
    }
}

