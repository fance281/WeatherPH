package weatherPhApplication.java.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import weatherPhApplication.java.model.VerificationToken;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    VerificationToken findByToken(String token);
}
