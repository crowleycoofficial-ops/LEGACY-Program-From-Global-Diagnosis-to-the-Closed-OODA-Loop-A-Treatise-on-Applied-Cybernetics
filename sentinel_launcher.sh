#!/bin/bash
# ==================================================
#  sentinel_launcher.sh
#  Pour lancer SENTINEL-EARTH ou sentinel_forge
#  sans se taper les commandes à la main.
# ==================================================

# Cherche automatiquement le projet dans les dossiers courants
PROJECT_DIR=$(find ~/Downloads ~/Documents /mnt/chromeos/MyFiles/Downloads -maxdepth 2 -name "Cargo.toml" -printf "%h\n" 2>/dev/null | head -1)

if [ -z "$PROJECT_DIR" ]; then
  echo "Aucun projet Rust trouvé."
  exit 1
fi

echo "Projet trouvé : $PROJECT_DIR"
cd "$PROJECT_DIR" || exit

# Compile et lance
cargo build --release && ./target/release/sentinel_forge
