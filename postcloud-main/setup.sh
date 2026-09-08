#!/bin/bash
# ===============================
# start.sh - cross-platform dev setup
# Linux / macOS version
# ===============================
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OS="$(uname -s)"

remove_path() {
  local path="$1"

  if [ ! -e "$path" ]; then
    return 0
  fi

  if rm -rf "$path" 2>/dev/null; then
    return 0
  fi

  echo "⚠ Could not remove $path with current permissions."

  if [ "$OS" = "Darwin" ]; then
    echo "🔹 Removing macOS ACL restrictions from $path..."
    chmod -RN "$path" 2>/dev/null || sudo chmod -RN "$path"

    if rm -rf "$path" 2>/dev/null; then
      return 0
    fi
  fi

  if [ "$OS" = "Darwin" ] || [ "$OS" = "Linux" ]; then
    echo "🔹 Taking ownership of $path, then removing it..."
    sudo chown -R "$(id -u):$(id -g)" "$path"
    rm -rf "$path" 2>/dev/null || sudo rm -rf "$path"
  else
    echo "❌ Please remove $path manually, then run setup again."
    exit 1
  fi
}

install_dependencies() {
  local service_dir="$1"
  local service_name="$2"

  echo "🔹 Installing $service_name dependencies..."
  cd "$ROOT_DIR/$service_dir"
  remove_path node_modules
  npm install
}

# Step 0: copy .env.example to .env if not exists
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "🔹 Creating .env from .env.example..."
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
fi

# Step 1: fix permissions (optional, avoids npm EACCES errors)
# Step 1: fix permissions (Linux only)
echo "🔹 Fixing project folder permissions..."

if [ "$OS" = "Linux" ]; then
  sudo chown -R "$USER:$USER" "$ROOT_DIR"
  echo "✔ chown applied (Linux)"
else
  echo "⚠ Skipping chown (not needed on $OS)"
fi

# Step 2: install worker dependencies
install_dependencies "ocr-worker" "OCR worker"

# Step 2: install backend dependencies
install_dependencies "backend" "backend"

# Step 3: install frontend dependencies
install_dependencies "frontend" "frontend"

# Step 4: bring up Docker Compose
echo "🔹 Bringing up Docker Compose..."
cd "$ROOT_DIR"
docker compose down
docker compose up -d --build

echo "🔹 Seeding development data..."
for attempt in {1..12}; do
  if docker compose exec -T backend npm run seed -- 100; then
    break
  fi

  if [ "$attempt" -eq 12 ]; then
    echo "❌ Development seed failed after backend startup retries."
    exit 1
  fi

  echo "⚠ Backend not ready for seeding yet. Retrying in 5 seconds..."
  sleep 5
done

echo "✅ Setup complete!"
echo "Backend: http://localhost:5001"
echo "OCR Worker: http://localhost:6000"
echo "Frontend: http://localhost:3000"
echo "pgAdmin: http://localhost:8080 (Email: admin@example.com, Password: admin123)"
echo "Seed users: admin1@example.com through admin10@example.com (Password: Admin@123456)"
