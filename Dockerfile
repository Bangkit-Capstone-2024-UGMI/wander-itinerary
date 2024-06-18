# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:16

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.
COPY . .

# Use the PORT environment variable in production (default to 3000)
ENV PORT 8080

# Run the web service on container startup.
CMD [ "node", "index.js" ]

# Expose the port the app runs on
EXPOSE 8080