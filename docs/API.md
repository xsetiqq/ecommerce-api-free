# E-commerce API Documentation

Base URL for local development:

```text
http://localhost:3031
```

Swagger UI:

```text
http://localhost:3031/docs
```

Protected endpoints require a JWT access token:

```http
Authorization: Bearer <accessToken>
```

Roles:

- `Public` — no token required
- `USER` — regular authenticated user
- `ADMIN` — administrator
- `USER/ADMIN` — both authenticated roles

## Auth

### Register user

```http
POST /auth/register
```

Access: `Public`

Creates a regular user. Public registration always assigns `USER`; clients cannot create admins through this endpoint.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "strongPass123!",
  "photoUrl": "https://example.com/avatar.jpg"
}
```

`photoUrl` is optional.

Response:

```json
{
  "message": "User john@example.com successfully created with role USER"
}
```

### Create admin

```http
POST /auth/admin
```

Access: `ADMIN`

Request body:

```json
{
  "name": "Admin User",
  "email": "admin2@example.com",
  "password": "strongAdminPass123!",
  "photoUrl": "https://example.com/admin.jpg"
}
```

`photoUrl` is optional.

Response:

```json
{
  "message": "Admin admin2@example.com successfully created"
}
```

### Login

```http
POST /auth/login
```

Access: `Public`

Request body:

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

The refresh token is saved in an HTTP-only cookie.

### Refresh token

```http
POST /auth/refresh
```

Access: `Public`, requires `refreshToken` cookie.

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

Access: `Public`

Clears the refresh token cookie.

Response:

```json
true
```

### Current user

```http
GET /auth/@me
```

Access: `USER/ADMIN`

Response example:

```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "photoUrl": "https://example.com/avatar.jpg",
  "createdAt": "2026-06-01T10:00:00.000Z",
  "updatedAt": "2026-06-01T10:00:00.000Z"
}
```

### Change password

```http
POST /auth/change-my-password
```

Access: `USER/ADMIN`

Request body:

```json
{
  "password": "newStrongPass123!"
}
```

Response: empty body.

### Change profile photo

```http
PATCH /auth/change-photo
```

Access: `USER/ADMIN`

Request body:

```json
{
  "photoUrl": "https://example.com/new-avatar.jpg"
}
```

Use `null` to remove the photo:

```json
{
  "photoUrl": null
}
```

## Categories

### Get categories

```http
GET /categories
```

Access: `Public`

Returns active, non-deleted categories.

### Get category by slug

```http
GET /categories/:slug
```

Access: `Public`

### Create category

```http
POST /categories
```

Access: `ADMIN`

Request body:

```json
{
  "name": "Smartphones",
  "slug": "smartphones",
  "description": "Mobile phones and accessories",
  "imageUrl": "https://example.com/category.jpg",
  "isActive": true
}
```

`description`, `imageUrl`, and `isActive` are optional.

### Update category

```http
PATCH /categories/:id
```

Access: `ADMIN`

Request body may contain any category fields:

```json
{
  "name": "Phones",
  "isActive": false
}
```

### Delete category

```http
DELETE /categories/:id
```

Access: `ADMIN`

Soft-deletes the category.

## Products

### Get products

```http
GET /products
GET /products?categorySlug=smartphones
```

Access: `Public`

Returns active, non-deleted products whose category is also active and non-deleted.

### Get product by slug

```http
GET /products/:slug
```

Access: `Public`

### Create product

```http
POST /products
```

Access: `ADMIN`

Request body:

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

Required fields:

- `title`
- `slug`
- `description`
- `price`
- `categoryId`

Optional fields:

- `oldPrice`
- `imageUrl`
- `images`
- `stock`
- `rating`
- `isActive`

### Update product

```http
PATCH /products/:id
```

Access: `ADMIN`

Request body may contain any product fields:

```json
{
  "price": 4599.99,
  "stock": 7,
  "isActive": true
}
```

### Delete product

```http
DELETE /products/:id
```

Access: `ADMIN`

Soft-deletes the product.

## Product images

### Upload product image

```http
POST /upload/products
```

Access: `ADMIN`

Content type: `multipart/form-data`

Form field:

```text
file
```

Allowed file types:

- `jpg`
- `jpeg`
- `png`
- `webp`

Maximum file size: `10 MB`

Response:

```json
{
  "url": "http://localhost:9002/product-images/file-id.webp",
  "mimeType": "image/webp",
  "key": "file-id.webp",
  "originalName": "image.webp"
}
```

### Delete product image

```http
DELETE /upload/products?key=file-id.webp
```

Access: `ADMIN`

Response:

```json
{
  "success": true
}
```

## Delivery addresses

Delivery addresses are owned by the current authenticated user. The API never accepts `userId` from request bodies.

### Get delivery addresses

```http
GET /delivery-addresses
```

Access: `USER/ADMIN`

### Create delivery address

```http
POST /delivery-addresses
```

Access: `USER/ADMIN`

Request body:

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

Required fields:

- `fullName`
- `phone`
- `city`
- `street`
- `building`

Optional fields:

- `country`
- `apartment`
- `postalCode`
- `comment`
- `isDefault`

### Update delivery address

```http
PATCH /delivery-addresses/:id
```

Access: `USER/ADMIN`

Users can update only their own addresses.

### Set default delivery address

```http
PATCH /delivery-addresses/:id/default
```

Access: `USER/ADMIN`

Users can set only their own addresses as default.

### Delete delivery address

```http
DELETE /delivery-addresses/:id
```

Access: `USER/ADMIN`

Soft-deletes the current user's address.

## Favorites

### Get favorites

```http
GET /favorites
```

Access: `USER/ADMIN`

Returns the current user's favorite products.

### Add favorite product

```http
POST /favorites/:productId
```

Access: `USER/ADMIN`

Adds a product to the current user's favorites. If it already exists, the existing favorite is returned.

### Remove favorite product

```http
DELETE /favorites/:productId
```

Access: `USER/ADMIN`

Removes a product from the current user's favorites.

## Cart

### Get cart

```http
GET /cart
```

Access: `USER/ADMIN`

Returns the current user's cart items.

### Add cart item

```http
POST /cart/items
```

Access: `USER/ADMIN`

Request body:

```json
{
  "productId": "product-id",
  "quantity": 1
}
```

If the product already exists in the cart, quantity is increased.

### Update cart item

```http
PATCH /cart/items/:id
```

Access: `USER/ADMIN`

Request body:

```json
{
  "quantity": 3
}
```

### Remove cart item

```http
DELETE /cart/items/:id
```

Access: `USER/ADMIN`

Users can remove only their own cart items.

### Clear cart

```http
DELETE /cart
```

Access: `USER/ADMIN`

Clears the current user's cart.

## Orders

Orders are created from the current user's cart. The cart is temporary; order items are permanent order snapshots.

Checkout flow:

```text
CartItem[] -> Order + OrderItem[] -> delete CartItem[]
```

### Create order

```http
POST /orders
```

Access: `USER/ADMIN`

Backend behavior:

- reads the current user's cart
- validates products and stock
- calculates `total` on the backend
- creates `Order`
- creates `OrderItem[]`
- saves product price into `OrderItem.price`
- decreases product stock atomically
- clears the user's cart

Create order with a saved delivery address:

```json
{
  "deliveryAddressId": "address-id",
  "comment": "Call before delivery"
}
```

Create order with a manual delivery address:

```json
{
  "deliveryAddress": "Krakowskie Przedmieście 10A/12, 20-002 Lublin, Poland",
  "phone": "+48123456789",
  "comment": "Call before delivery"
}
```

### Get current user's orders

```http
GET /orders/my
```

Access: `USER/ADMIN`

### Get order by ID

```http
GET /orders/:id
```

Access: `USER/ADMIN`

Rules:

- `USER` can access only their own order
- `ADMIN` can access any order

### Update order status

```http
PATCH /orders/:id/status
```

Access: `ADMIN`

Request body:

```json
{
  "status": "PROCESSING"
}
```

Available statuses:

- `PENDING`
- `PAID`
- `PROCESSING`
- `SHIPPED`
- `COMPLETED`
- `CANCELLED`

Important rules:

- switching an order to `CANCELLED` restores product stock
- a cancelled order cannot be moved back to another status

## Local demo data

Seed command:

```bash
npm run seed
```

The seed creates demo categories and products using idempotent `upsert` operations.

Demo categories:

- `Smartphones`
- `Laptops`

Demo products:

- `iPhone 15`
- `Samsung Galaxy S24`
- `MacBook Air 13`
- `Lenovo ThinkPad X1 Carbon`
