package weatherPhApplication.java.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * This customizer completely bypasses Spring Security for static assets.
     * FIX: Added explicit AntMatcher to silence the warning about DeferredMatchers.
     */
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        // Use AntMatcher explicitly for static resources to satisfy the latest Spring Security version
        return (web) -> web.ignoring().requestMatchers("/assets/**");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authorizeRequests ->
                        authorizeRequests
                                // Permit all users to access the landing page, auth pages, and APIs
                                .requestMatchers("/", "/login", "/register", "/verify-email**", "/forgot-password", "/reset-password**", "/api/**").permitAll()
                                // All other requests require authentication
                                .anyRequest().authenticated()
                )
                .formLogin(formLogin ->
                        formLogin
                                .loginPage("/login")
                                .loginProcessingUrl("/login")
                                .usernameParameter("username")
                                .defaultSuccessUrl("/", true) // On success, go to dashboard
                                .permitAll()
                )
                .logout(logout ->
                        logout
                                .logoutUrl("/logout")
                                .logoutSuccessUrl("/login?logoutSuccess=true")
                                .permitAll()
                );
        return http.build();
    }
}
