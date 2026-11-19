# Serveur local de la TV (Termux)

La TV héberge elle-même le site : Termux (Python) sert `~/qon`, enregistre le contenu publié depuis l'appli (`/__save`) et relaie la télécommande (`/__rc`, `/__state`) sans internet.

- `server.py` : serveur (port 8080).
- `boot.sh` : copié dans `~/.termux/boot/qon.sh` (Termux:Boot) : lance le serveur puis Fully Kiosk sur `http://127.0.0.1:8080/?tv=1`.
- `s.sh` : installation depuis un autre poste (`SRC` = serveur qui fournit `site.tgz`, `server.py`, `boot.sh`).
- Appli de gestion : `http://IP-DE-LA-TV:8080/admin.html` (réserver l'IP dans la box).
