#!/data/data/com.termux/files/usr/bin/sh
# Installation sur la TV (exécuté dans Termux). SRC = serveur qui fournit les fichiers.
SRC=${SRC:-http://100.94.44.72:8082}
set -e
yes | pkg install -y python
mkdir -p "$HOME/qon" "$HOME/qon-server" "$HOME/.termux/boot"
curl -sSf "$SRC/site.tgz" | tar xz -C "$HOME/qon"
curl -sSf "$SRC/server.py" -o "$HOME/qon-server/server.py"
curl -sSf "$SRC/boot.sh" -o "$HOME/.termux/boot/qon.sh"
chmod +x "$HOME/.termux/boot/qon.sh"
pkill -f "python.*server.py" 2>/dev/null; sleep 1
(cd "$HOME/qon-server" && nohup python server.py >server.log 2>&1 &)
echo QON-INSTALL-OK
