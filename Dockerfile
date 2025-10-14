# STAGE 1: Build the application using a full JDK
FROM eclipse-temurin:17-jdk-jammy AS builder

# Set the working directory
WORKDIR /app

# Copy the Maven wrapper and project definition files
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# *** FIX: Add execute permissions to the Maven Wrapper ***
RUN chmod +x mvnw

# Download dependencies to a cached layer
RUN ./mvnw dependency:go-offline

# Copy the rest of the application source code
COPY src ./src

# Build the application JAR file
RUN ./mvnw package -DskipTests


# STAGE 2: Create the final, lightweight production image
FROM eclipse-temurin:17-jre-jammy

# Set the working directory
WORKDIR /app

# Copy only the built JAR file from the 'builder' stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port the application runs on
EXPOSE 8080
	
# The command to run the application
ENTRYPOINT ["java","-jar","app.jar"]