package weatherPhApplication.java.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import weatherPhApplication.java.model.User;
import weatherPhApplication.java.repository.UserRepository;
import weatherPhApplication.java.security.CustomUserDetails;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * This is the critical change. This method now returns a CustomUserDetails
     * object, which makes the user's first and last name available to the
     * application after they log in.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }
        // Return our custom UserDetails object which contains the full user information
        return new CustomUserDetails(user);
    }
}

