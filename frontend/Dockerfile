FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Add these environment variables to help with Vite
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
