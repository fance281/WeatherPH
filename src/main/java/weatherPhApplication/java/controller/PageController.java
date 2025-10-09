package weatherPhApplication.java.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @Value("${app.google.maps.apiKey:}")
    private String googleMapsApiKey; 

    @GetMapping("/advisories")
    public String advisories(Model model) {
        model.addAttribute("page", "advisories");
        model.addAttribute("googleMapsApiKey", googleMapsApiKey);
        return "advisories";
    }

    @GetMapping("/about")
    public String about(Model model) {
        model.addAttribute("page", "about");
        model.addAttribute("googleMapsApiKey", googleMapsApiKey);
        return "about";
    }
}
