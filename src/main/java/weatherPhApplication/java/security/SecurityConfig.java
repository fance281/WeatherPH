package weatherPhApplication.java.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                // Permit all on site pages, public APIs, and static assets
                .requestMatchers("/", "/route", "/advisories", "/about", "/api/**",
                                 "/assets/**", "/css/**", "/js/**", "/images/**", "/webjars/**").permitAll()
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable())
            .formLogin(login -> login.disable())
            .httpBasic(basic -> basic.disable());
        return http.build();
    }
}
