# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:17-jdk-jammy

# Set the working directory in the container
WORKDIR /app

# Copy the Maven wrapper and pom.xml to leverage Docker cache
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Build the application and create the executable JAR file
# Using --no-daemon to ensure the build completes within the container
RUN ./mvnw package -DskipTests

# Copy the built JAR file to the container
# The JAR is found in the 'target' directory
COPY target/java-0.0.1-SNAPSHOT.jar app.jar
# Make port 8080 available to the world outside this container
EXPOSE 8080

# Define the command to run your application
ENTRYPOINT ["java","-jar","/app/app.jar"]
