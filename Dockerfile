# Production Dockerfile for Fullstack Hackathon Tracker
# Runs Express REST API + Svelte Frontend + SQLite & Supabase integration
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install

# Copy source code and build frontend
COPY . .
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=10000

# Expose Render standard port
EXPOSE 10000

# Start fullstack Express server
CMD ["node", "server/index.js"]
