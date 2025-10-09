package weatherPhApplication.java.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class PagasaAdvisoryService {
    private static final String ADVISORY_URL = "https://www.pagasa.dost.gov.ph/weather/weather-advisory";

    public List<String> fetchLatestAdvisories() {
        List<String> advisories = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(ADVISORY_URL).get();
            Elements items = doc.select(".advisory-content, .advisory-title"); // Adjust selector if needed
            for (org.jsoup.nodes.Element el : items) {
                advisories.add(el.text());
            }
        } catch (IOException e) {
            advisories.add("Unable to load official advisories.");
        }
        return advisories;
    }

    // Find advisories matching city/province/region string
    public List<String> filterAdvisoriesForLocation(List<String> advisories, String location) {
        List<String> results = new ArrayList<>();
        String loc = location.toLowerCase();
        for (String adv : advisories) {
            String advLower = adv.toLowerCase();
            if (advLower.contains(loc)) {
                results.add(adv);
            }
            // Optionally match regions (Luzon, Visayas, Mindanao)
            if (loc.contains("luzon") && advLower.contains("luzon")) results.add(adv);
            if (loc.contains("visayas") && advLower.contains("visayas")) results.add(adv);
            if (loc.contains("mindanao") && advLower.contains("mindanao")) results.add(adv);
        }
        if (results.isEmpty()) results.add("No official hazard/advisory for this location.");
        return results;
    }
}
