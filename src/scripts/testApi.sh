#!/bin/bash

# Stale Deal Nagger - API Test Helper
# Usage: source src/scripts/testApi.sh
# Then use: sdn_login, sdn_deal_stats, etc.

export SDN_BASE_URL="http://localhost:3000/api/v1"
export SDN_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper to print colored output
sdn_print() {
  echo -e "${GREEN}[SDN]${NC} $1"
}

sdn_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

sdn_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# Health check
sdn_health() {
  sdn_print "Checking server health..."
  curl -s http://localhost:3000/health | jq '.'
}

# Register a new user
sdn_register() {
  local team_name="${1:-Test Team}"
  local name="${2:-Test User}"
  local email="${3:-test@example.com}"
  local password="${4:-password123}"
  
  sdn_print "Registering user: $email"
  
  local response=$(curl -s -X POST "$SDN_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"teamName\":\"$team_name\",\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$password\"}")
  
  echo "$response" | jq '.'
  
  # Extract and save token if registration successful
  local token=$(echo "$response" | jq -r '.data.tokens.accessToken // empty')
  if [ ! -z "$token" ]; then
    export SDN_TOKEN="$token"
    sdn_print "Token saved: ${SDN_TOKEN:0:20}..."
  fi
}

# Login
sdn_login() {
  local email="${1:-vedang@test.com}"
  local password="${2:-password123}"
  
  sdn_print "Logging in as: $email"
  
  local response=$(curl -s -X POST "$SDN_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")
  
  echo "$response" | jq '.'
  
  # Extract and save token
  local token=$(echo "$response" | jq -r '.data.tokens.accessToken // empty')
  if [ ! -z "$token" ]; then
    export SDN_TOKEN="$token"
    sdn_print "Token saved: ${SDN_TOKEN:0:20}..."
  else
    sdn_error "Login failed - no token received"
  fi
}

# Create a deal
sdn_create_deal() {
  if [ -z "$SDN_TOKEN" ]; then
    sdn_error "No token set. Run sdn_login first."
    return 1
  fi
  
  local title="${1:-Test Deal}"
  local value="${2:-50000}"
  local stage="${3:-Discovery}"
  local crm_id="${4:-CRM-$(date +%s)}"
  
  sdn_print "Creating deal: $title"
  
  curl -s -X POST "$SDN_BASE_URL/deals" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SDN_TOKEN" \
    -d "{\"title\":\"$title\",\"value\":$value,\"stage\":\"$stage\",\"crmDealId\":\"$crm_id\"}" | jq '.'
}

# List all deals
sdn_list_deals() {
  if [ -z "$SDN_TOKEN" ]; then
    sdn_error "No token set. Run sdn_login first."
    return 1
  fi
  
  sdn_print "Fetching all deals..."
  
  curl -s -X GET "$SDN_BASE_URL/deals" \
    -H "Authorization: Bearer $SDN_TOKEN" | jq '.'
}

# Get deal stats
sdn_deal_stats() {
  if [ -z "$SDN_TOKEN" ]; then
    sdn_error "No token set. Run sdn_login first."
    return 1
  fi
  
  sdn_print "Fetching deal statistics..."
  
  curl -s -X GET "$SDN_BASE_URL/deals/stats" \
    -H "Authorization: Bearer $SDN_TOKEN" | jq '.'
}

# Get single deal
sdn_get_deal() {
  if [ -z "$SDN_TOKEN" ]; then
    sdn_error "No token set. Run sdn_login first."
    return 1
  fi
  
  local deal_id="$1"
  
  if [ -z "$deal_id" ]; then
    sdn_error "Please provide a deal ID"
    return 1
  fi
  
  sdn_print "Fetching deal: $deal_id"
  
  curl -s -X GET "$SDN_BASE_URL/deals/$deal_id" \
    -H "Authorization: Bearer $SDN_TOKEN" | jq '.'
}

# Update a deal
sdn_update_deal() {
  if [ -z "$SDN_TOKEN" ]; then
    sdn_error "No token set. Run sdn_login first."
    return 1
  fi
  
  local deal_id="$1"
  local field="$2"
  local value="$3"
  
  if [ -z "$deal_id" ] || [ -z "$field" ] || [ -z "$value" ]; then
    sdn_error "Usage: sdn_update_deal <deal_id> <field> <value>"
    return 1
  fi
  
  sdn_print "Updating deal $deal_id: $field=$value"
  
  curl -s -X PATCH "$SDN_BASE_URL/deals/$deal_id" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SDN_TOKEN" \
    -d "{\"$field\":\"$value\"}" | jq '.'
}

# Delete a deal
sdn_delete_deal() {
  if [ -z "$SDN_TOKEN" ]; then
    sdn_error "No token set. Run sdn_login first."
    return 1
  fi
  
  local deal_id="$1"
  
  if [ -z "$deal_id" ]; then
    sdn_error "Please provide a deal ID"
    return 1
  fi
  
  sdn_print "Deleting deal: $deal_id"
  
  curl -s -X DELETE "$SDN_BASE_URL/deals/$deal_id" \
    -H "Authorization: Bearer $SDN_TOKEN" | jq '.'
}

# Quick test suite
sdn_quick_test() {
  sdn_print "Running quick test suite..."
  echo ""
  
  sdn_health
  echo ""
  
  sdn_login
  echo ""
  
  if [ ! -z "$SDN_TOKEN" ]; then
    sdn_deal_stats
  else
    sdn_error "Cannot continue - login failed"
  fi
}

# Show help
sdn_help() {
  echo -e "${BLUE}Stale Deal Nagger - API Test Helper${NC}"
  echo ""
  echo "Available commands:"
  echo "  ${GREEN}sdn_health${NC}                          - Check server health"
  echo "  ${GREEN}sdn_register${NC} [team] [name] [email]  - Register new user"
  echo "  ${GREEN}sdn_login${NC} [email] [password]        - Login (default: vedang@test.com)"
  echo "  ${GREEN}sdn_create_deal${NC} [title] [value]     - Create a new deal"
  echo "  ${GREEN}sdn_list_deals${NC}                      - List all deals"
  echo "  ${GREEN}sdn_deal_stats${NC}                      - Get deal statistics"
  echo "  ${GREEN}sdn_get_deal${NC} <deal_id>             - Get single deal"
  echo "  ${GREEN}sdn_update_deal${NC} <id> <field> <val> - Update a deal field"
  echo "  ${GREEN}sdn_delete_deal${NC} <deal_id>          - Delete a deal"
  echo "  ${GREEN}sdn_quick_test${NC}                      - Run quick test suite"
  echo "  ${GREEN}sdn_help${NC}                            - Show this help"
  echo ""
  echo "Current token: ${SDN_TOKEN:0:30}..."
}

sdn_print "Test helper loaded! Type ${GREEN}sdn_help${NC} for available commands."
