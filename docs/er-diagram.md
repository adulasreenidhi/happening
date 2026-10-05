# HAPPENING ER diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        string name
        string email UK
        string phone
        string password
        enum role
    }
    CATEGORIES {
        bigint id PK
        string name UK
    }
    CITIES {
        bigint id PK
        string name UK
    }
    EVENTS {
        bigint id PK
        bigint category_id FK
        bigint city_id FK
        bigint organizer_id FK
        string title
        date date
        time time
        decimal price
        int capacity
        int available_seats
        enum status
    }
    BOOKINGS {
        bigint id PK
        bigint user_id FK
        bigint event_id FK
        int quantity
        decimal total_amount
        enum booking_status
        enum payment_status
        datetime created_at
    }
    FAVORITES {
        bigint id PK
        bigint user_id FK
        bigint event_id FK
    }
    REVIEWS {
        bigint id PK
        bigint user_id FK
        bigint event_id FK
        int rating
        string comment
        datetime created_at
    }
    EVENT_EMBEDDINGS {
        bigint event_id PK
        text embedding
        string model
        datetime updated_at
    }

    USERS ||--o{ EVENTS : organizes
    CATEGORIES ||--o{ EVENTS : classifies
    CITIES ||--o{ EVENTS : locates
    USERS ||--o{ BOOKINGS : places
    EVENTS ||--o{ BOOKINGS : receives
    USERS ||--o{ FAVORITES : saves
    EVENTS ||--o{ FAVORITES : is_saved
    USERS ||--o{ REVIEWS : writes
    EVENTS ||--o{ REVIEWS : receives
    EVENTS ||--o| EVENT_EMBEDDINGS : indexed_as
```

`EVENTS.status` uses `PENDING`, `APPROVED`, `REJECTED`, or `CANCELLED`; public event reads are restricted to `APPROVED`. User roles are `USER`, `ORGANIZER`, and `ADMIN`. Booking statuses are `CONFIRMED` and `CANCELLED`; payment statuses are `PENDING`, `PAID`, `FAILED`, and `REFUNDED`. `EVENT_EMBEDDINGS.event_id` is the primary key but is not mapped as a database foreign key in the current entity. A unique user/event constraint prevents duplicate favorites and reviews. Confirm exact column types and constraints against the JPA entities when changing the schema.
