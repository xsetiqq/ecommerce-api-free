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
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2001-05-20",
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
  "firstName": "Admin",
  "lastName": "User",
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

### Update current user profile

```http
PATCH /auth/@me
```

Access: `USER/ADMIN`

Updates current user's profile fields. `role` cannot be changed here.

Request body:

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "2001-05-20",
  "email": "john.smith@example.com",
  "photoUrl": "https://example.com/new-avatar.webp"
}
```

Optional fields:

- `firstName`
- `lastName`
- `dateOfBirth`
- `email`
- `photoUrl`

### Change password

```http
POST /auth/change-my-password
```

Access: `USER/ADMIN`

Request body:

```json
{
  "currentPassword": "oldStrongPass123!",
  "newPassword": "newStrongPass123!",
  "confirmPassword": "newStrongPass123!"
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
GET /products?categorySlug=smartphones&q=iphone&minPrice=100&maxPrice=5000&sortBy=price&order=asc&page=1&limit=20
```

Access: `Public`

Returns active, non-deleted products whose category is also active and non-deleted. Product list supports:

- `categorySlug` — filter by category slug
- `q` — search by title/description
- `minPrice`, `maxPrice` — price range
- `sortBy` — `createdAt`, `price`, `rating`, `title`
- `order` — `asc` or `desc`
- `page`, `limit` — pagination

Response is paginated:

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

## Product variants

Variants are optional product options such as SKU, color, size, variant-specific price, and variant-specific stock. Product reads include active, non-deleted variants.

### Create product variant

```http
POST /products/:id/variants
```

Access: `ADMIN`

Request body:

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

Required fields:

- `sku`
- `stock`

Optional fields:

- `color`
- `size`
- `price`
- `isActive`

### Update product variant

```http
PATCH /products/variants/:variantId
```

Access: `ADMIN`

Body may contain any variant fields:

```json
{
  "price": 89.99,
  "stock": 15,
  "isActive": true
}
```

### Delete product variant

```http
DELETE /products/variants/:variantId
```

Access: `ADMIN`

Soft-deletes the variant.

## Product reviews

Reviews are attached to products. A user can have only one active review per product. Product rating is recalculated after review create/update/delete.

### Get product reviews

```http
GET /products/:productId/reviews
```

Access: `Public`

### Create product review

```http
POST /products/:productId/reviews
```

Access: `USER/ADMIN`

Request body:

```json
{
  "rating": 5,
  "comment": "Great product"
}
```

`rating` must be an integer from `1` to `5`. `comment` is optional.

### Update review

```http
PATCH /reviews/:id
```

Access: `USER/ADMIN`

Users can update only their own reviews. Admin can update any review.

### Delete review

```http
DELETE /reviews/:id
```

Access: `USER/ADMIN`

Users can soft-delete only their own reviews. Admin can soft-delete any review.

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
  "variantId": "variant-id",
  "quantity": 1
}
```

`variantId` is optional. If the same product/variant combination already exists in the cart, quantity is increased.

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
- calculates `subtotal`, promo-code discount, and `total` on the backend
- creates `Order`
- creates `OrderItem[]`
- saves product or variant price into `OrderItem.price`
- decreases product or variant stock atomically
- clears the user's cart

Create order with a saved delivery address:

```json
{
  "deliveryAddressId": "address-id",
  "promoCode": "SUMMER10",
  "comment": "Call before delivery"
}
```

Create order with a manual delivery address:

```json
{
  "deliveryAddress": "Krakowskie Przedmieście 10A/12, 20-002 Lublin, Poland",
  "phone": "+481****6789",
  "promoCode": "SUMMER10",
  "comment": "Call before delivery"
}
```

Order stores:

- `subtotal` — cart total before discount
- `discountAmount` — promo-code discount amount
- `total` — final amount after discount
- `promoCodeId` — linked promo code if one was used

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

- switching an order to `CANCELLED` restores product/variant stock
- a cancelled order cannot be moved back to another status

## Promo codes

Promo codes can be percentage or fixed-amount discounts. Admin manages codes; users can validate a code and pass it to order creation as `promoCode`.

Discount types:

- `PERCENT` — percentage discount, for example `10` means 10%
- `FIXED` — fixed amount discount, for example `50` means subtract 50 from subtotal

### Validate promo code

```http
POST /promo-codes/validate
```

Access: `Public`

Request body:

```json
{
  "code": "SUMMER10"
}
```

Returns the active code if it exists and is currently usable.

### Get promo codes

```http
GET /promo-codes
```

Access: `ADMIN`

### Create promo code

```http
POST /promo-codes
```

Access: `ADMIN`

Request body:

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

Required fields:

- `code`
- `type`
- `value`

Optional fields:

- `minOrderAmount`
- `usageLimit`
- `startsAt`
- `expiresAt`
- `isActive`

### Update promo code

```http
PATCH /promo-codes/:id
```

Access: `ADMIN`

### Delete promo code

```http
DELETE /promo-codes/:id
```

Access: `ADMIN`

Soft-deletes the promo code.

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
