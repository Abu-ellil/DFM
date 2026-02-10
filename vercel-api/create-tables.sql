CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        phone TEXT,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS date_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS crate_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        weight REAL NOT NULL,
        is_default INTEGER DEFAULT 0,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS daily_prices (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        price_per_qantar REAL NOT NULL,
        qantar_weight REAL DEFAULT 100.0,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS weighbridge (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        date_type_id INTEGER REFERENCES date_types(id),
        gross_weight REAL DEFAULT 0,
        net_weight REAL NOT NULL,
        price_per_qantar REAL NOT NULL,
        total REAL NOT NULL,
        crates_count INTEGER DEFAULT 0,
        commission REAL DEFAULT 0,
        notes TEXT,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS crates (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        crate_type_id INTEGER REFERENCES crate_types(id),
        crates_out INTEGER DEFAULT 0,
        crates_returned INTEGER DEFAULT 0,
        handler TEXT,
        notes TEXT,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS finance (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        transaction_type TEXT NOT NULL,
        amount_paid REAL DEFAULT 0,
        amount_received REAL DEFAULT 0,
        notes TEXT,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS supervisors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        _client_id TEXT,
        _synced_at INTEGER,
        _version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS auth_users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        machine_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(100),
        factory_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS license_keys (
        id SERIAL PRIMARY KEY,
        license_key VARCHAR(20) UNIQUE NOT NULL,
        machine_id VARCHAR(20) NOT NULL,
        factory_name VARCHAR(100),
        duration_code VARCHAR(5),
        expiry_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );