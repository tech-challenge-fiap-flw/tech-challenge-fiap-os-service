CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  type ENUM('admin','mechanic','customer') NOT NULL DEFAULT 'customer',
  active TINYINT(1) NOT NULL DEFAULT 1,
  creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cpf VARCHAR(20) NOT NULL,
  cnpj VARCHAR(20) NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(50) NULL,
  zipCode VARCHAR(20) NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idPlate VARCHAR(20) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  manufactureYear INT NOT NULL,
  modelYear INT NOT NULL,
  color VARCHAR(50) NOT NULL,
  ownerId INT NOT NULL,
  deletedAt DATETIME NULL,
  FOREIGN KEY (ownerId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS diagnosis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description TEXT NOT NULL,
  creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vehicleId INT NOT NULL,
  responsibleMechanicId INT NULL,
  deletedAt DATETIME NULL,
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id),
  FOREIGN KEY (responsibleMechanicId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS service_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  description TEXT NOT NULL,
  creationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  currentStatus ENUM('Recebida','Em diagnóstico','Aguardando aprovação','Recusada','Aguardando início','Em execução','Finalizada','Entregue') NOT NULL DEFAULT 'Recebida',
  budgetId INT NULL,
  customerId INT NOT NULL,
  mechanicId INT NULL,
  vehicleId INT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (customerId) REFERENCES users(id),
  FOREIGN KEY (mechanicId) REFERENCES users(id),
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
);

-- Tabela de idempotência para eventos SQS processados
CREATE TABLE IF NOT EXISTS processed_events (
  event_id VARCHAR(36) PRIMARY KEY,
  processed_at DATETIME NOT NULL,
  INDEX idx_processed_at (processed_at)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_vehicles_owner ON vehicles(ownerId);
CREATE INDEX idx_diagnosis_vehicle ON diagnosis(vehicleId);
CREATE INDEX idx_service_orders_customer ON service_orders(customerId);
