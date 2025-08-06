# Stage 1: Build Angular
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # Generates files in `/app/dist/`

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy ALL files from /app/dist/ to Nginx's HTML directory
COPY --from=build /app/dist/ppdo-ar/browser /usr/share/nginx/html
# Override Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
