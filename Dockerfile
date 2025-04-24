# Use Node.js LTS version
FROM node:14

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project files
COPY . .

# Default command to run your bot
CMD ["node", "index.js"]
