# Документация API интернет-магазина

Base URL для локальной разработки:

```text
http://localhost:3031
```

Swagger UI:

```text
http://localhost:3031/docs
```

Для защищённых endpoints нужен JWT access token:

```http
Authorization: Bearer <accessToken>
```

Роли:

- `Public` — токен не нужен
- `USER` — обычный авторизованный пользователь
- `ADMIN` — администратор
- `USER/ADMIN` — доступны обе роли

## Auth

### Регистрация пользователя

```http
POST /auth/register
```

Доступ: `Public`

Создаёт обычного пользователя. Публичная регистрация всегда выдаёт роль `USER`. Через этот endpoint нельзя создать администратора.

Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2001-05-20",
  "email": "john@example.com",
  "password": "strongPass123!",
  "photoUrl": "https://example.com/avatar.jpg"
}
```

Обязательные поля:

- `name`
- `email`
- `password`

Необязательные поля:

- `photoUrl`

Response:

```json
{
  "message": "User john@example.com successfully created with role USER"
}
```

### Создание администратора

```http
POST /auth/admin
```

Доступ: `ADMIN`

Создаёт нового пользователя с ролью `ADMIN`. Endpoint доступен только уже авторизованному администратору.

Body:

```json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin2@example.com",
  "password": "strongAdminPass123!",
  "photoUrl": "https://example.com/admin.jpg"
}
```

Response:

```json
{
  "message": "Admin admin2@example.com successfully created"
}
```

### Логин

```http
POST /auth/login
```

Доступ: `Public`

Body:

```json
{
  "email": "john@example.com",
  "password": "strongPass123!"
}
```

Response:

```json
{
  "accessToken": "jwt_access_token"
}
```

`refreshToken` сохраняется в HTTP-only cookie.

### Обновление токена

```http
POST /auth/refresh
```

Доступ: `Public`, но нужен `refreshToken` cookie.

Response:

```json
{
  "accessToken": "new_jwt_access_token"
}
```

### Logout

```http
POST /auth/logout
```

Доступ: `Public`

Очищает refresh cookie.

Response:

```json
true
```

### Текущий пользователь

```http
GET /auth/@me
```

Доступ: `USER/ADMIN`

Response example:

```json
{
  "id": "user-id",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2001-05-20T00:00:00.000Z",
  "email": "john@example.com",
  "role": "USER",
  "photoUrl": "https://example.com/avatar.jpg",
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-01T10:00:00.000Z"
}
```

### Обновить профиль текущего пользователя

```http
PATCH /auth/@me
```

Доступ: `USER/ADMIN`

Обновляет поля профиля текущего пользователя. `role` тут менять нельзя.

Body:

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "2001-05-20",
  "email": "john.smith@example.com",
  "photoUrl": "https://example.com/new-avatar.webp"
}
```

Необязательные поля:

- `firstName`
- `lastName`
- `dateOfBirth`
- `email`
- `photoUrl`

### Изменение пароля

```http
POST /auth/change-my-password
```

Доступ: `USER/ADMIN`

Body:

```json
{
  "currentPassword": "oldStrongPass123!",
  "newPassword": "newStrongPass123!",
  "confirmPassword": "newStrongPass123!"
}
```

Response: пустое тело.

### Изменение фото профиля

```http
PATCH /auth/change-photo
```

Доступ: `USER/ADMIN`

Body:

```json
{
  "photoUrl": "https://example.com/new-avatar.jpg"
}
```

Чтобы удалить фото, можно передать `null`:

```json
{
  "photoUrl": null
}
```

## Categories

### Получить категории

```http
GET /categories
```

Доступ: `Public`

Возвращает активные и не удалённые категории.

### Получить категорию по slug

```http
GET /categories/:slug
```

Доступ: `Public`

Например:

```http
GET /categories/smartphones
```

### Создать категорию

```http
POST /categories
```

Доступ: `ADMIN`

Body:

```json
{
  "name": "Smartphones",
  "slug": "smartphones",
  "description": "Mobile phones and accessories",
  "imageUrl": "https://example.com/category.jpg",
  "isActive": true
}
```

Обязательные поля:

- `name`
- `slug`

Необязательные поля:

- `description`
- `imageUrl`
- `isActive`

### Обновить категорию

```http
PATCH /categories/:id
```

Доступ: `ADMIN`

Body может содержать любые поля категории:

```json
{
  "name": "Phones",
  "isActive": false
}
```

### Удалить категорию

```http
DELETE /categories/:id
```

Доступ: `ADMIN`

Категория удаляется мягко: `isDelete = true`, `deletedAt = now()`.

## Products

### Получить товары

```http
GET /products
GET /products?categorySlug=smartphones&q=iphone&minPrice=100&maxPrice=5000&sortBy=price&order=asc&page=1&limit=20
```

Доступ: `Public`

Возвращает активные и не удалённые товары. Категория товара тоже должна быть активной и не удалённой. Список товаров поддерживает:

- `categorySlug` — фильтр по slug категории
- `q` — поиск по названию/описанию
- `minPrice`, `maxPrice` — диапазон цены
- `sortBy` — `createdAt`, `price`, `rating`, `title`
- `order` — `asc` или `desc`
- `page`, `limit` — пагинация

Response с пагинацией:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Получить товар по slug

```http
GET /products/:slug
```

Доступ: `Public`

Например:

```http
GET /products/iphone-15
```

### Создать товар

```http
POST /products
```

Доступ: `ADMIN`

Body:

```json
{
  "title": "iPhone 15 Pro",
  "slug": "iphone-15-pro",
  "description": "Apple smartphone with 256 GB storage",
  "price": 4999.99,
  "oldPrice": 5499.99,
  "imageUrl": "https://example.com/products/iphone.webp",
  "images": ["https://example.com/products/iphone-1.webp"],
  "stock": 10,
  "rating": 4.8,
  "isActive": true,
  "categoryId": "category-id"
}
```

Обязательные поля:

- `title`
- `slug`
- `description`
- `price`
- `categoryId`

Необязательные поля:

- `oldPrice`
- `imageUrl`
- `images`
- `stock`
- `rating`
- `isActive`

### Обновить товар

```http
PATCH /products/:id
```

Доступ: `ADMIN`

Body может содержать любые поля товара:

```json
{
  "price": 4599.99,
  "stock": 7,
  "isActive": true
}
```

### Удалить товар

```http
DELETE /products/:id
```

Доступ: `ADMIN`

Товар удаляется мягко: `isDelete = true`, `deletedAt = now()`.

## Product Variants

Варианты товара — это опциональные SKU/цвет/размер/цена/остаток для конкретного варианта. При чтении товара возвращаются активные и не удалённые варианты.

### Создать вариант товара

```http
POST /products/:id/variants
```

Доступ: `ADMIN`

Body:

```json
{
  "sku": "TSHIRT-BLACK-M",
  "color": "Black",
  "size": "M",
  "price": 99.99,
  "stock": 10,
  "isActive": true
}
```

Обязательные поля:

- `sku`
- `stock`

Необязательные поля:

- `color`
- `size`
- `price`
- `isActive`

### Обновить вариант товара

```http
PATCH /products/variants/:variantId
```

Доступ: `ADMIN`

Body может содержать любые поля варианта:

```json
{
  "price": 89.99,
  "stock": 15,
  "isActive": true
}
```

### Удалить вариант товара

```http
DELETE /products/variants/:variantId
```

Доступ: `ADMIN`

Вариант удаляется мягко.

## Product Reviews

Отзывы привязаны к товарам. Один пользователь может иметь только один активный отзыв на один товар. Rating товара пересчитывается после создания/обновления/удаления отзыва.

### Получить отзывы товара

```http
GET /products/:productId/reviews
```

Доступ: `Public`

### Создать отзыв

```http
POST /products/:productId/reviews
```

Доступ: `USER/ADMIN`

Body:

```json
{
  "rating": 5,
  "comment": "Great product"
}
```

`rating` — целое число от `1` до `5`. `comment` необязательный.

### Обновить отзыв

```http
PATCH /reviews/:id
```

Доступ: `USER/ADMIN`

Пользователь может обновить только свой отзыв. Admin может обновить любой отзыв.

### Удалить отзыв

```http
DELETE /reviews/:id
```

Доступ: `USER/ADMIN`

Пользователь может мягко удалить только свой отзыв. Admin может удалить любой отзыв.

## Product Images

### Загрузить изображение товара

```http
POST /upload/products
```

Доступ: `ADMIN`

Content-Type:

```text
multipart/form-data
```

Form field:

```text
file
```

Разрешённые типы файлов:

- `jpg`
- `jpeg`
- `png`
- `webp`

Максимальный размер файла: `10 MB`

Response:

```json
{
  "url": "http://localhost:9002/product-images/file-id.webp",
  "mimeType": "image/webp",
  "key": "file-id.webp",
  "originalName": "image.webp"
}
```

### Удалить изображение товара

```http
DELETE /upload/products?key=file-id.webp
```

Доступ: `ADMIN`

`key` — это ключ файла из response upload endpoint.

Response:

```json
{
  "success": true
}
```

## Delivery Addresses

Адреса доставки принадлежат текущему авторизованному пользователю. API не принимает `userId` из body.

### Получить адреса доставки

```http
GET /delivery-addresses
```

Доступ: `USER/ADMIN`

Возвращает адреса текущего пользователя.

### Создать адрес доставки

```http
POST /delivery-addresses
```

Доступ: `USER/ADMIN`

Body:

```json
{
  "fullName": "John Doe",
  "phone": "+48123456789",
  "country": "Poland",
  "city": "Lublin",
  "street": "Krakowskie Przedmieście",
  "building": "10A",
  "apartment": "12",
  "postalCode": "20-002",
  "comment": "Call before delivery",
  "isDefault": true
}
```

Обязательные поля:

- `fullName`
- `phone`
- `city`
- `street`
- `building`

Необязательные поля:

- `country`
- `apartment`
- `postalCode`
- `comment`
- `isDefault`

Если это первый адрес пользователя, backend автоматически сделает его default.

### Обновить адрес доставки

```http
PATCH /delivery-addresses/:id
```

Доступ: `USER/ADMIN`

Пользователь может обновлять только свои адреса.

Body может содержать любые поля адреса:

```json
{
  "city": "Warsaw",
  "street": "Marszałkowska",
  "building": "1"
}
```

### Сделать адрес default

```http
PATCH /delivery-addresses/:id/default
```

Доступ: `USER/ADMIN`

Пользователь может сделать default только свой адрес. У пользователя остаётся только один default-адрес.

### Удалить адрес доставки

```http
DELETE /delivery-addresses/:id
```

Доступ: `USER/ADMIN`

Пользователь может удалить только свой адрес. Адрес удаляется мягко.

## Favorites

### Получить избранное

```http
GET /favorites
```

Доступ: `USER/ADMIN`

Возвращает избранные товары текущего пользователя.

### Добавить товар в избранное

```http
POST /favorites/:productId
```

Доступ: `USER/ADMIN`

Добавляет товар в избранное текущего пользователя. Если товар уже есть в избранном, возвращается существующая запись.

### Удалить товар из избранного

```http
DELETE /favorites/:productId
```

Доступ: `USER/ADMIN`

Удаляет товар из избранного текущего пользователя.

## Cart

### Получить корзину

```http
GET /cart
```

Доступ: `USER/ADMIN`

Возвращает позиции корзины текущего пользователя.

### Добавить товар в корзину

```http
POST /cart/items
```

Доступ: `USER/ADMIN`

Body:

```json
{
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 1
}
```

`variantId` необязательный. Если такая же комбинация product/variant уже есть в корзине, количество увеличивается.

### Обновить позицию корзины

```http
PATCH /cart/items/:id
```

Доступ: `USER/ADMIN`

Body:

```json
{
  "quantity": 3
}
```

Пользователь может обновлять только свои позиции корзины.

### Удалить позицию корзины

```http
DELETE /cart/items/:id
```

Доступ: `USER/ADMIN`

Пользователь может удалить только свою позицию корзины.

### Очистить корзину

```http
DELETE /cart
```

Доступ: `USER/ADMIN`

Очищает корзину текущего пользователя.

## Orders

Заказ создаётся из текущей корзины пользователя.

Flow оформления заказа:

```text
CartItem[] -> Order + OrderItem[] -> delete CartItem[]
```

Корзина — временное состояние. Заказ и `OrderItem[]` — постоянный snapshot покупки.

### Создать заказ

```http
POST /orders
```

Доступ: `USER/ADMIN`

Что делает backend:

- берёт корзину текущего пользователя
- проверяет, что корзина не пустая
- проверяет, что товары активные и не удалены
- проверяет наличие товара на складе
- считает `subtotal`, скидку по promo code и `total` на backend
- создаёт `Order`
- создаёт `OrderItem[]`
- сохраняет цену товара или варианта в `OrderItem.price`
- атомарно уменьшает `stock` товара или варианта
- очищает корзину пользователя

Создание заказа через сохранённый адрес:

```json
{
  "deliveryAddressId": "address-id",
  "promoCode": "SUMMER10",
  "comment": "Call before delivery"
}
```

Создание заказа через ручной адрес:

```json
{
  "deliveryAddress": "Krakowskie Przedmieście 10A/12, 20-002 Lublin, Poland",
  "phone": "+481****6789",
  "promoCode": "SUMMER10",
  "comment": "Call before delivery"
}
```

Важно:

- если используется `deliveryAddressId`, адрес должен принадлежать текущему пользователю
- в заказ сохраняется snapshot адреса и телефона
- если потом пользователь изменит адрес, старый заказ не изменится

Заказ сохраняет:

- `subtotal` — сумма корзины до скидки
- `discountAmount` — сумма скидки по promo code
- `total` — итоговая сумма после скидки
- `promoCodeId` — ссылка на promo code, если он был использован

### Получить свои заказы

```http
GET /orders/my
```

Доступ: `USER/ADMIN`

Возвращает заказы текущего пользователя.

### Получить заказ по ID

```http
GET /orders/:id
```

Доступ: `USER/ADMIN`

Правила доступа:

- `USER` может получить только свой заказ
- `ADMIN` может получить любой заказ

### Обновить статус заказа

```http
PATCH /orders/:id/status
```

Доступ: `ADMIN`

Body:

```json
{
  "status": "PROCESSING"
}
```

Доступные статусы:

- `PENDING`
- `PAID`
- `PROCESSING`
- `SHIPPED`
- `COMPLETED`
- `CANCELLED`

Важные правила:

- при переводе заказа в `CANCELLED` stock товаров/вариантов возвращается
- отменённый заказ нельзя вернуть в другой статус

## Promo Codes

Promo code может быть процентной или фиксированной скидкой. Admin управляет кодами, пользователь может проверить код и передать его при создании заказа как `promoCode`.

Типы скидок:

- `PERCENT` — процентная скидка, например `10` = 10%
- `FIXED` — фиксированная скидка, например `50` = минус 50 от subtotal

### Проверить promo code

```http
POST /promo-codes/validate
```

Доступ: `Public`

Body:

```json
{
  "code": "SUMMER10"
}
```

Возвращает активный код, если он существует и сейчас может быть использован.

### Получить promo codes

```http
GET /promo-codes
```

Доступ: `ADMIN`

### Создать promo code

```http
POST /promo-codes
```

Доступ: `ADMIN`

Body:

```json
{
  "code": "SUMMER10",
  "type": "PERCENT",
  "value": 10,
  "minOrderAmount": 100,
  "usageLimit": 100,
  "startsAt": "2026-06-01T00:00:00.000Z",
  "expiresAt": "2026-07-01T00:00:00.000Z",
  "isActive": true
}
```

Обязательные поля:

- `code`
- `type`
- `value`

Необязательные поля:

- `minOrderAmount`
- `usageLimit`
- `startsAt`
- `expiresAt`
- `isActive`

### Обновить promo code

```http
PATCH /promo-codes/:id
```

Доступ: `ADMIN`

### Удалить promo code

```http
DELETE /promo-codes/:id
```

Доступ: `ADMIN`

Promo code удаляется мягко.

## Demo data / Seed

Запуск seed:

```bash
npm run seed
```

Seed создаёт demo категории и товары через idempotent `upsert`, поэтому его можно запускать несколько раз.

Demo категории:

- `Smartphones`
- `Laptops`

Demo товары:

- `iPhone 15`
- `Samsung Galaxy S24`
- `MacBook Air 13`
- `Lenovo ThinkPad X1 Carbon`
