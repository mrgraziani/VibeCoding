ARG REACT_APP_API_URL=http://person-crud:8080/api
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# copy everything (public, src, etc.) so the build has all files
COPY . .

# set build-time env var for create-react-app
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
# copy nginx config
COPY default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["/bin/sh", "-c", "nginx -g 'daemon off;'" ]
