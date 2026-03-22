# TalenHuman.Web Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY src/TalenHuman.Web/package*.json ./
RUN npm install

# Build the app
COPY src/TalenHuman.Web/ .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
