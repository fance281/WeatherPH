package weatherPhApplication.java;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest
// FIX: Exclude database configurations to allow tests to run without a live DB connection.
@EnableAutoConfiguration(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
})
class JavaApplicationTests {

	@Test
	void contextLoads() {
        // Test passes if Spring Boot context loads successfully without connecting to the DB
	}

}
