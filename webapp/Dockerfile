FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application source code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the application
CMD [ "node", "server.js" ]
