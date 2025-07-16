#!/bin/bash

# Wait for database to be ready
echo "Waiting for database connection..."
while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent; do
    sleep 1
done

echo "Database is ready!"

# Copy environment file
cp .env.docker .env

# Generate application key if not set
if grep -q "APP_KEY=base64:YOUR_APP_KEY_HERE" .env; then
    echo "Generating application key..."
    php artisan key:generate
fi

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Cache config
echo "Caching configuration..."
php artisan config:cache

echo "Laravel application is ready!"