# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json from the root context
COPY package*.json ./

# Install production dependencies
# Ensure you have a package-lock.json committed in the root directory
RUN npm ci --only=production

# Copy backend application code from the 'backend' subfolder in the context into /app
COPY ./backend ./

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app using node
# server.js is now directly in /app
CMD [ "node", "server.js" ]

