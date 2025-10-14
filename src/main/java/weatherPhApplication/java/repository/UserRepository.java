package weatherPhApplication.java.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import weatherPhApplication.java.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    /**
     * Finds a user by their email address.
     * @param email The email to search for.
     * @return The User object if found, otherwise null.
     */
    User findByEmail(String email);
}
