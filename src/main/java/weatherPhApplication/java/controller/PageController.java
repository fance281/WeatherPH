package weatherPhApplication.java.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import weatherPhApplication.java.security.CustomUserDetails;

@Controller
public class PageController {

    private void addUserDetailsToModel(Model model, CustomUserDetails userDetails) {
        if (userDetails != null) {
            model.addAttribute("userFullName", userDetails.getFirstName() + " " + userDetails.getLastName());
            model.addAttribute("userInitial", userDetails.getFirstName().substring(0, 1).toUpperCase());
        }
    }

    @GetMapping("/advisories")
    public String advisories(Model model, @AuthenticationPrincipal CustomUserDetails userDetails) {
        addUserDetailsToModel(model, userDetails);
        model.addAttribute("currentPage", "advisories");
        return "advisories";
    }

    @GetMapping("/about")
    public String about(Model model, @AuthenticationPrincipal CustomUserDetails userDetails) {
        addUserDetailsToModel(model, userDetails);
        model.addAttribute("currentPage", "about");
        return "about";
    }
}
