package weatherPhApplication.java.controller;

import weatherPhApplication.java.model.RouteWeatherResponse;
import weatherPhApplication.java.security.CustomUserDetails;
import weatherPhApplication.java.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.text.SimpleDateFormat;
import java.util.*;

@Controller
public class RouteController {

    @Autowired
    private WeatherService weatherService;

    @Value("${app.mapbox.key}")
    private String mapboxApiKey;

    // Helper method to add user details to the model
    private void addUserDetailsToModel(Model model, CustomUserDetails userDetails) {
        if (userDetails != null) {
            model.addAttribute("userFullName", userDetails.getFirstName() + " " + userDetails.getLastName());
            model.addAttribute("userInitial", userDetails.getFirstName().substring(0, 1).toUpperCase());
        }
    }

    @GetMapping("/")
    public String index(Model model, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return "landing";
        }
        
        addUserDetailsToModel(model, userDetails);
        model.addAttribute("response", null);
        model.addAttribute("formError", null);
        model.addAttribute("currentPage", "home");
        model.addAttribute("mapboxApiKey", mapboxApiKey);
        return "index";
    }

    @PostMapping("/route")
    public String getRouteAdvisory(
            @RequestParam() String origin,
            @RequestParam() String destination,
            @RequestParam(value = "origin_lat", required = false) Double originLat,
            @RequestParam(value = "origin_lon", required = false) Double originLon,
            @RequestParam(value = "destination_lat", required = false) Double destinationLat,
            @RequestParam(value = "destination_lon", required = false) Double destinationLon,
            Model model,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {

        if (origin.isEmpty() || destination.isEmpty() || originLat == null || originLon == null || destinationLat == null || destinationLon == null) {
             redirectAttributes.addFlashAttribute("formError", "Please select a valid origin and destination from the search suggestions.");
            return "redirect:/route-advisory";
        }
        
        addUserDetailsToModel(model, userDetails);
        model.addAttribute("currentPage", "route-advisory");
        model.addAttribute("mapboxApiKey", mapboxApiKey);

        RouteWeatherResponse response = new RouteWeatherResponse();
        response.setOrigin(origin);
        response.setDestination(destination);

        Map<String, Object> originWeatherRaw = weatherService.getWeather(originLat, originLon);
        Map<String, Object> destWeatherRaw = weatherService.getWeather(destinationLat, destinationLon);
        
        // Use mutable maps and override the name with the more specific one from Mapbox
        Map<String, Object> originWeather = new HashMap<>(originWeatherRaw);
        if (!originWeather.containsKey("error")) {
            originWeather.put("name", origin);
        }

        Map<String, Object> destWeather = new HashMap<>(destWeatherRaw);
        if (!destWeather.containsKey("error")) {
            destWeather.put("name", destination);
        }

        response.setOriginWeather(originWeather);
        response.setDestinationWeather(destWeather);

        Map<String, String> originAdvisories = splitWeatherAndTempAdvisory(originWeather);
        Map<String, String> destAdvisories   = splitWeatherAndTempAdvisory(destWeather);

        model.addAttribute("response", response);
        model.addAttribute("formError", null);
        model.addAttribute("originHazard", originAdvisories.get("weather"));
        model.addAttribute("originTravelHazard", originAdvisories.get("temp"));
        model.addAttribute("destinationHazard", destAdvisories.get("weather"));
        model.addAttribute("destinationTravelHazard", destAdvisories.get("temp"));

        model.addAttribute("originSunrise", getFormattedTime(originWeather, "sunrise"));
        model.addAttribute("originSunset", getFormattedTime(originWeather, "sunset"));
        model.addAttribute("destSunrise", getFormattedTime(destWeather, "sunrise"));
        model.addAttribute("destSunset", getFormattedTime(destWeather, "sunset"));
        
        return "route-advisory";
    }

    private String getFormattedTime(Map<String, Object> weatherData, String timeKey) {
        if (weatherData == null || weatherData.get("sys") == null || weatherData.get("timezone") == null) {
            return "--:--";
        }
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> sys = (Map<String, Object>) weatherData.get("sys");
            Number timestampNum = (Number) sys.get(timeKey);
            Number timezoneNum = (Number) weatherData.get("timezone");

            if (timestampNum == null || timezoneNum == null) {
                return "--:--";
            }

            long timestamp = timestampNum.longValue();
            long timezone = timezoneNum.longValue();

            Date date = new Date((timestamp + timezone) * 1000L);
            SimpleDateFormat sdf = new SimpleDateFormat("h:mm a");
            sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
            
            return sdf.format(date);
        } catch (Exception e) {
            return "--:--";
        }
    }


    private Map<String, String> splitWeatherAndTempAdvisory(Map<String, Object> weather) {
        String weatherAdvice = "Weather data is currently unavailable.";
        String tempAdvice = ""; 

        if (weather == null || weather.containsKey("error")) {
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
        } else if (description.contains("heavy intensity rain") || description.contains("very heavy rain")) {
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
}
