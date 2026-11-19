#!/data/data/com.termux/files/usr/bin/sh
# Démarrage automatique de la TV : serveur Queen of Nails puis affichage plein écran (Fully Kiosk).
termux-wake-lock
cd "$HOME/qon-server" || exit 1
pgrep -f "python.*server.py" >/dev/null || nohup python server.py >server.log 2>&1 &
sleep 20
am start -a android.intent.action.VIEW -d "http://127.0.0.1:8080/?tv=1" -n de.ozerov.fully/.MainActivity >/dev/null 2>&1
