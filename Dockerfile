# Step 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package configuration and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# Step 2: Serve the build directory using Nginx
FROM nginx:alpine

# Copy custom build assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
