package weatherPhApplication.java.model;

import java.util.Map;
import java.util.List;

public class RouteWeatherResponse {
    private String origin;
    private String destination;
    private Map<String, Object> originWeather;
    private Map<String, Object> destinationWeather;
    private String originHazard;
    private String destinationHazard;

    // ADD: lat/lon for reuse everywhere
    private Double originLat;
    private Double originLon;
    private Double destinationLat;
    private Double destinationLon;

    private List<String> originHazards;
    private List<String> destinationHazards;

    public RouteWeatherResponse() {}

    public RouteWeatherResponse(
        String origin,
        String destination,
        Map<String, Object> originWeather,
        Map<String, Object> destinationWeather,
        String originHazard,
        String destinationHazard,
        List<String> originHazards,
        List<String> destinationHazards,
        Double originLat,
        Double originLon,
        Double destinationLat,
        Double destinationLon
    ) {
        this.origin = origin;
        this.destination = destination;
        this.originWeather = originWeather;
        this.destinationWeather = destinationWeather;
        this.originHazard = originHazard;
        this.destinationHazard = destinationHazard;
        this.originHazards = originHazards;
        this.destinationHazards = destinationHazards;
        this.originLat = originLat;
        this.originLon = originLon;
        this.destinationLat = destinationLat;
        this.destinationLon = destinationLon;
    }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }
    public Map<String, Object> getOriginWeather() { return originWeather; }
    public void setOriginWeather(Map<String, Object> originWeather) { this.originWeather = originWeather; }
    public Map<String, Object> getDestinationWeather() { return destinationWeather; }
    public void setDestinationWeather(Map<String, Object> destinationWeather) { this.destinationWeather = destinationWeather; }
    public String getOriginHazard() { return originHazard; }
    public void setOriginHazard(String originHazard) { this.originHazard = originHazard; }
    public String getDestinationHazard() { return destinationHazard; }
    public void setDestinationHazard(String destinationHazard) { this.destinationHazard = destinationHazard; }

    // --- New hazard list + lat/lon getters/setters ---
    public List<String> getOriginHazards() { return originHazards; }
    public void setOriginHazards(List<String> originHazards) { this.originHazards = originHazards; }
    public List<String> getDestinationHazards() { return destinationHazards; }
    public void setDestinationHazards(List<String> destinationHazards) { this.destinationHazards = destinationHazards; }

    public Double getOriginLat() { return originLat; }
    public void setOriginLat(Double originLat) { this.originLat = originLat; }
    public Double getOriginLon() { return originLon; }
    public void setOriginLon(Double originLon) { this.originLon = originLon; }
    public Double getDestinationLat() { return destinationLat; }
    public void setDestinationLat(Double destinationLat) { this.destinationLat = destinationLat; }
    public Double getDestinationLon() { return destinationLon; }
    public void setDestinationLon(Double destinationLon) { this.destinationLon = destinationLon; }

    @Override
    public String toString() {
        return "RouteWeatherResponse{" +
                "origin='" + origin + '\'' +
                ", destination='" + destination + '\'' +
                ", originWeather=" + originWeather +
                ", destinationWeather=" + destinationWeather +
                ", originHazard='" + originHazard + '\'' +
                ", destinationHazard='" + destinationHazard + '\'' +
                ", originHazards=" + originHazards +
                ", destinationHazards=" + destinationHazards +
                ", originLat=" + originLat +
                ", originLon=" + originLon +
                ", destinationLat=" + destinationLat +
                ", destinationLon=" + destinationLon +
                '}';
    }
}

