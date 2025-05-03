#!/bin/bash
# This script creates .env.local with the correct CORS settings for local development

cat > mlpie/.env.local <<EOL
API__CORS_ALLOWED_ORIGINS="http://localhost:3002,http://127.0.0.1:3002"
EOL

echo ".env.local created with CORS settings in mlpie directory" 