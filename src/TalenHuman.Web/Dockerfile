# TalenHuman.Web Dockerfile
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY src/TalenHuman.Web/package*.json ./
RUN npm install --legacy-peer-deps

# Build the app
COPY src/TalenHuman.Web/ .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY src/TalenHuman.Web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
