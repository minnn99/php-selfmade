FROM php:8.2-apache

# 必要なシステムパッケージをインストール
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    mariadb-client \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Composerをインストール
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Apacheモジュールを有効化
RUN a2enmod rewrite

# 作業ディレクトリを設定
WORKDIR /var/www/html

# Composerファイルを先にコピー
COPY composer.json composer.lock ./

# Composerの依存関係をインストール
RUN composer install --no-scripts --no-autoloader

# プロジェクトファイルをコピー
COPY . .

# Composerの最適化
RUN composer dump-autoload --optimize

# 権限を設定
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Apacheの設定
COPY ./docker/apache.conf /etc/apache2/sites-available/000-default.conf

# 環境変数をコピー
COPY .env.docker .env

# アプリケーションキーを生成
RUN php artisan key:generate --force

# ポート80を開放
EXPOSE 80

# Apacheを起動
CMD ["apache2-foreground"]