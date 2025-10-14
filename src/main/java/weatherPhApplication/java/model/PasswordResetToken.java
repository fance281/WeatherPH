package weatherPhApplication.java.model;

import jakarta.persistence.*;
import java.util.Date;
import java.util.Calendar;

@Entity
public class PasswordResetToken {

    private static final int EXPIRATION = 60; // 1 hour

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // FIX: Changed from AUTO to IDENTITY
    private Long id;

    private String token;

    @OneToOne(targetEntity = User.class, fetch = FetchType.EAGER)
    @JoinColumn(nullable = false, name = "user_id")
    private User user;

    private Date expiryDate;
    
    private Date calculateExpiryDate(int expiryTimeInMinutes) {
        Calendar cal = Calendar.getInstance();
        cal.setTime(new Date());
        cal.add(Calendar.MINUTE, expiryTimeInMinutes);
        return new Date(cal.getTime().getTime());
    }

    // REQUIRED: A no-argument constructor for Hibernate
    public PasswordResetToken() {
        super();
        this.expiryDate = calculateExpiryDate(EXPIRATION);
    }


    public PasswordResetToken(String token, User user) {
        super();
        this.token = token;
        this.user = user;
        this.expiryDate = calculateExpiryDate(EXPIRATION);
    }

    // Getters and Setters
     public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }
    public User getUser() {
        return user;
    }
    public void setUser(User user) {
        this.user = user;
    }
    public Date getExpiryDate() {
        return expiryDate;
    }
    public void setExpiryDate(Date expiryDate) {
        this.expiryDate = expiryDate;
    }
}
