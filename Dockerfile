FROM php:8.3-fpm-alpine

RUN apk add --no-cache nginx supervisor nodejs npm mysql-client curl \
    && docker-php-ext-install pdo pdo_mysql mbstring bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && npm install && npm run build \
    && chmod -R 775 storage bootstrap/cache \
    && cp .env.example .env \
    && php artisan key:generate --force

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

EXPOSE 8080
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
