# Stage 1: Build the NestJS application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Run the production build
FROM node:22-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Provide an environment variable placeholder
ENV PORT=3333
EXPOSE 3333

# Start the application
CMD ["npm", "run", "start:prod"]
