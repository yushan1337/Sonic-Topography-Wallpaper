# KDE YesPlayMusic Setup

This setup is for a KDE/Linux desktop wallpaper workflow.

## Components

```text
YesPlayMusic
PipeWire / PulseAudio compatibility tools
Python WebSocket backend
React / Three.js frontend
KWin window rules
Chrome app window
```

## Runtime Files

```text
scripts/sonic-wallpaper
scripts/sonic-audio-ws
kde/sonic-wallpaper.desktop
kde/kwinrules-sonic-example.conf
```

## Install Scripts

Install the scripts into a directory on `PATH`, for example:

```bash
install -Dm755 scripts/sonic-wallpaper "$HOME/.local/bin/sonic-wallpaper"
install -Dm755 scripts/sonic-audio-ws "$HOME/.local/bin/sonic-audio-ws"
```

Install `kde/sonic-wallpaper.desktop` through your desktop environment if you want a launcher.

## Build Frontend

```bash
npm install
npm run build
```

Deploy the built frontend under the web root used by `scripts/sonic-wallpaper`.

By default:

```text
SONIC_WEB_ROOT=$HOME/www
SONIC_APP_PATH=/Sonic-Topography-Wallpaper/
```

Override those values if your deployment layout differs.

## Runtime Configuration

The launcher supports these environment variables:

```text
SONIC_REAL_SINK
SONIC_HTTP_PORT
SONIC_WS_PORT
SONIC_LOG_DIR
SONIC_LAUNCHER_SCRIPT
SONIC_WS_SCRIPT
SONIC_WEB_ROOT
SONIC_APP_PATH
SONIC_APP_URL
SONIC_CHROME_PROFILE
```

`SONIC_REAL_SINK` should usually be set to the real speaker sink on the target machine.

## Start

```bash
sonic-wallpaper
```

## Verify

```bash
bash -n scripts/sonic-wallpaper
python3 -m py_compile scripts/sonic-audio-ws
npm run lint
npm run build
```
