package weatherPhApplication.java.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import weatherPhApplication.java.model.User;
import weatherPhApplication.java.service.EmailService;
import weatherPhApplication.java.service.UserService;

import java.util.UUID;

@Controller
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private EmailService emailService;

    // NOTE: Original version did NOT have @Value injection

    @GetMapping("/login")
    public String showLoginForm(Model model) {
        // This ensures the login page is served as a Thymeleaf template
        return "login";
    }

    @GetMapping("/register")
    public String showRegistrationForm(Model model) {
        model.addAttribute("user", new User());
        return "register";
    }

    @PostMapping("/register")
    public String registerUser(@Valid @ModelAttribute("user") User user,
                               BindingResult bindingResult,
                               HttpServletRequest request,
                               RedirectAttributes redirectAttributes) {

        // Check if email already exists
        if (userService.findByEmail(user.getEmail()) != null) {
            bindingResult.rejectValue("email", "error.user", "An account already exists for this email");
        }

        // Added Password Confirmation Check
        if (user.getPassword() != null && user.getConfirmPassword() != null && !user.getPassword().equals(user.getConfirmPassword())) {
             bindingResult.rejectValue("confirmPassword", "error.user", "Passwords do not match");
        }
        // End of Added Check


        if (bindingResult.hasErrors()) {
            return "register";
        }

        User registeredUser = userService.registerUser(user);
        String token = UUID.randomUUID().toString();
        userService.createVerificationToken(registeredUser, token);

        String confirmationUrl = getAppUrl(request) + "/verify-email?token=" + token;
        String message = "Hello,\n\n" +
                "Thank you for registering with WeatherPH! To complete your registration and activate your account, please click the link below:\n\n" +
                confirmationUrl + "\n\n" +
                "If you did not create an account, no further action is required.\n\n" +
                "Regards,\nThe WeatherPH Team";

        emailService.sendVerificationEmail(registeredUser.getEmail(), "WeatherPH Account Verification", message);

        redirectAttributes.addFlashAttribute("verification_sent", true);
        return "redirect:/login";
    }

    @GetMapping("/verify-email")
    public String verifyEmail(@RequestParam("token") String token, RedirectAttributes redirectAttributes) {
        String result = userService.validateVerificationToken(token);
        if ("valid".equals(result)) {
            redirectAttributes.addFlashAttribute("message", "Your account has been successfully verified! You can now log in.");
        } else {
            String errorMessage = "expired".equals(result) ? "Your verification token has expired. Please register again." : "Invalid verification token.";
            redirectAttributes.addFlashAttribute("error", errorMessage);
        }
        return "redirect:/login";
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordForm() {
        return "forgot-password";
    }

    @PostMapping("/forgot-password")
    public String processForgotPassword(@RequestParam("email") String userEmail, HttpServletRequest request, RedirectAttributes redirectAttributes) {
        User user = userService.findByEmail(userEmail);
        if (user == null) {
            redirectAttributes.addFlashAttribute("error", "No account found with that email address.");
            return "redirect:/forgot-password";
        }

        String token = UUID.randomUUID().toString();
        userService.createPasswordResetTokenForUser(user, token);
        String resetUrl = getAppUrl(request) + "/reset-password?token=" + token;
        String message = "Hello,\n\n" +
                "A request has been received to change the password for your WeatherPH account. Please click the link below to reset your password:\n\n" +
                resetUrl + "\n\n" +
                "If you did not request a password reset, please ignore this email or contact support if you have concerns.\n\n" +
                "Regards,\nThe WeatherPH Team";

        emailService.sendPasswordResetEmail(user.getEmail(), "WeatherPH Password Reset", message);

        redirectAttributes.addFlashAttribute("message", "A password reset link has been sent to your email.");
        return "redirect:/forgot-password";
    }

    @GetMapping("/reset-password")
    public String showResetPasswordForm(@RequestParam("token") String token, Model model, RedirectAttributes redirectAttributes) {
        String result = userService.validatePasswordResetToken(token);
        if (!"valid".equals(result)) {
            String errorMessage = "expired".equals(result) ? "Your password reset token has expired." : "Invalid password reset token.";
            redirectAttributes.addFlashAttribute("error", errorMessage);
            return "redirect:/login";
        }
        model.addAttribute("token", token);
        return "reset-password";
    }

    @PostMapping("/reset-password")
    public String processResetPassword(@RequestParam("token") String token,
                                       @RequestParam("password") String newPassword,
                                       @RequestParam("confirmPassword") String confirmPassword,
                                       RedirectAttributes redirectAttributes) {

        String result = userService.validatePasswordResetToken(token);
        if (!"valid".equals(result)) {
             redirectAttributes.addFlashAttribute("error", "Invalid or expired password reset token.");
             return "redirect:/login";
        }

        if (!newPassword.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Passwords do not match.");
            return "redirect:/reset-password?token=" + token;
        }

        User user = userService.getUserByPasswordResetToken(token);
        userService.changeUserPassword(user, newPassword, token);

        redirectAttributes.addFlashAttribute("password_reset_success", true);
        return "redirect:/login";
    }

    private String getAppUrl(HttpServletRequest request) {
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null) {
            scheme = request.getScheme();
        }

        String host = request.getHeader("X-Forwarded-Host");
        if (host == null) {
            host = request.getServerName() + ":" + request.getServerPort();
        }

        return scheme + "://" + host + request.getContextPath();
    }


}