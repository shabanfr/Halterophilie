
## Style de réponse
- Réponses courtes ou en code. Pas de phrases longues. Interlocuteur = dev/geek.

## TV Android (chambre) – accès ADB via Tailscale
- Appareil : TCL Android 8.0 (2 Go RAM), nom Tailscale `chambre`, IP `100.111.8.115`, ADB réseau `:5555`.
- Launcher : Projectivy (`com.spocky.projengmenu`), launchers Google désactivés.
- Le conteneur cloud est éphémère : à chaque nouvelle session, refaire l'installation ci-dessous.

```sh
# 1. Installer adb + tailscale (userspace/TUN, root)
apt-get update && apt-get install -y adb
V=$(curl -s https://pkgs.tailscale.com/stable/ | grep -o 'tailscale_[0-9.]*_amd64.tgz' | head -1)
mkdir -p /tmp/ts && cd /tmp/ts && curl -sSfO https://pkgs.tailscale.com/stable/$V && tar xzf $V
cd ${V%.tgz} && mkdir -p /var/lib/tailscale
nohup ./tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscaled.sock >/tmp/ts/tailscaled.log 2>&1 &
# 2. Login : ouvrir l'URL affichée (compte Tailscale de l'utilisateur)
./tailscale --socket=/var/run/tailscaled.sock up --hostname=claude-cloud
# 3. ADB
adb kill-server; adb connect 100.111.8.115:5555    # si "offline" : kill-server puis reconnecter
adb -s 100.111.8.115:5555 shell
```
- Si ADB demande une autorisation, l'utilisateur l'accepte sur la TV (« Toujours autoriser »).
- Si `chambre` est offline dans `tailscale status` : TV éteinte ou appli Tailscale fermée.

### État / modifications faites sur la TV (réversibles avec `pm enable <pkg>`)
- Désactivés : tvrecommendations, leanbacklauncher(.recommendations), tvlauncher, tcl.esticker,
  smartalexa, MultiScreenInteraction_TV, eletronicpolicy, tvweishi, versionUpdateApp, rc.ota,
  appmarket2, google.tts, katniss (pas de micro).
- Gardé : cast (`mediashell`), Netflix, YouTube, Tailscale, VLC.
- Tailscale : VPN permanent + whitelist deviceidle ; ADB réseau persistant après reboot.
- Animations à 0.5x. Ne pas toucher : com.tcl.tv, tvinput, tvpassthrough, settings, partnercustomizer, sourcemananger, initsetup.

### Site Queen of Nails (dossier `queen-of-nails/`)
- Affichage TV : Fully Kiosk plein écran. Musique jouée par la page (`music/*.mp3`, config `data.js` → `music`), plus par VLC.
- Gestion : `admin.html` (prestations, panorama, photos, musique, infos, télécommande via ntfy.sh). Test local : `python3 /tmp/ts/devserver.py` (écrit data.json/photos/musique).
- Déploiement : GitHub Pages via `.github/workflows/pages.yml` (après fusion sur `master`).
