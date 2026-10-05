# HAPPENING use cases

```mermaid
flowchart LR
    Guest["Guest"]
    User["USER"]
    Organizer["ORGANIZER"]
    Admin["ADMIN"]
    Discovery["Browse/search/filter approved events"]
    Account["Register and sign in"]
    Attend["Book/cancel, save favorites, review attended events"]
    Assistant["Ask grounded event assistant"]
    Organize["Create and manage own events"]
    Registration["View registrations and dashboard"]
    Moderate["Approve/reject submitted events"]
    Catalog["Manage users, organizers, categories, cities, bookings"]

    Guest --> Discovery
    Guest --> Account
    User --> Discovery
    User --> Attend
    User --> Assistant
    Organizer --> Organize
    Organizer --> Registration
    Admin --> Moderate
    Admin --> Catalog
    Admin --> Discovery
```

Backend policy is authoritative: users can access only their own bookings, favorites, and reviews; organizers can manage only their events; event approval and administrative endpoints are ADMIN-only.
