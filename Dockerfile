FROM alpine:latest

# Install Node.js and npm
RUN apk update && \
    apk add  nodejs npm

    # Verify Node.js and npm installation
    RUN node --version
    RUN npm --version

    # Set the working directory
    WORKDIR /app

    # Copy and install dependencies
   # COPY package.json .
   # RUN npm install

    # Copy the rest of the application files
   # COPY . .
EXPOSE 8080
    # Start the application
 CMD ["npm", "run","dev"]
