# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install production dependencies
# Using npm ci is generally faster and more reliable for CI/CD
# Ensure you have a package-lock.json committed
RUN npm ci --only=production

# Copy backend application code
COPY . .

# Copy .env file - Alternatively, manage env vars via docker-compose
# COPY .env .env

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app using node
# This assumes your entry point is backend/server.js
CMD [ "node", "server.js" ]

