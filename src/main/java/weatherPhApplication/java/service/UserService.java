package weatherPhApplication.java.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import weatherPhApplication.java.model.PasswordResetToken;
import weatherPhApplication.java.model.User;
import weatherPhApplication.java.model.VerificationToken;
import weatherPhApplication.java.repository.PasswordResetTokenRepository;
import weatherPhApplication.java.repository.UserRepository;
import weatherPhApplication.java.repository.VerificationTokenRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository verificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEnabled(false);
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public void createVerificationToken(User user, String token) {
        VerificationToken newUserToken = new VerificationToken(token, user);
        verificationTokenRepository.save(newUserToken);
    }

    public String validateVerificationToken(String token) {
        final VerificationToken verificationToken = verificationTokenRepository.findByToken(token);
        if (verificationToken == null) {
            return "invalidToken";
        }

        final User user = verificationToken.getUser();
        final long diff = verificationToken.getExpiryDate().getTime() - System.currentTimeMillis();
        if (diff <= 0) {
            verificationTokenRepository.delete(verificationToken);
            return "expired";
        }

        user.setEnabled(true);
        userRepository.save(user);
        verificationTokenRepository.delete(verificationToken);
        return "valid";
    }

    public void createPasswordResetTokenForUser(User user, String token) {
        PasswordResetToken myToken = new PasswordResetToken(token, user);
        passwordResetTokenRepository.save(myToken);
    }

    public String validatePasswordResetToken(String token) {
        final PasswordResetToken passToken = passwordResetTokenRepository.findByToken(token);
        if (passToken == null) {
            return "invalidToken";
        }

        final long diff = passToken.getExpiryDate().getTime() - System.currentTimeMillis();
        if (diff <= 0) {
            passwordResetTokenRepository.delete(passToken);
            return "expired";
        }
        return "valid";
    }

    public User getUserByPasswordResetToken(String token) {
        return passwordResetTokenRepository.findByToken(token).getUser();
    }

    /**
     * Corrected method to accept the token string directly.
     * This avoids calling a non-existent method on the User object.
     */
    public void changeUserPassword(User user, String password, String tokenString) {
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);
        
        // Once password is changed, invalidate the token using the provided string
        PasswordResetToken token = passwordResetTokenRepository.findByToken(tokenString);
        if (token != null) {
            passwordResetTokenRepository.delete(token);
        }
    }
}

