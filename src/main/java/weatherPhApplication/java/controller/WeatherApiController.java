package weatherPhApplication.java.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api")
public class WeatherApiController {

    @Value("${app.openweather.key}")
    private String openWeatherApiKey;

    @GetMapping("/localweather")
    @SuppressWarnings("unchecked") // Add this annotation here!
    public Map<String, Object> getLocalWeather(@RequestParam double lat, @RequestParam double lon) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = String.format(
                "https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&units=metric&appid=%s",
                lat, lon, openWeatherApiKey
            );
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || response.isEmpty() || response.containsKey("cod") && !"200".equals(String.valueOf(response.get("cod")))) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Weather unavailable for this location.");
                return err;
            }
            return response;
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Weather unavailable (" + e.getMessage() + ").");
            return err;
        }
    }

    @GetMapping("/forecast")
    @SuppressWarnings("unchecked")
    public Map<String, Object> getForecast(@RequestParam double lat, @RequestParam double lon) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            // Switched back to the free 5 day / 3 hour forecast API
            String url = String.format(
                "https://api.openweathermap.org/data/2.5/forecast?lat=%f&lon=%f&units=metric&appid=%s",
                lat, lon, openWeatherApiKey
            );
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
             if (response == null || response.isEmpty() || response.containsKey("cod") && !"200".equals(String.valueOf(response.get("cod")))) {
                Map<String, Object> err = new HashMap<>();
                err.put("error", "Forecast unavailable for this location.");
                return err;
            }
            return response;
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Forecast unavailable (" + e.getMessage() + ").");
            return err;
        }
    }
}

