# Sonic Topography Wallpaper - KDE YesPlayMusic Edition

A KDE desktop wallpaper adaptation of Sonic Topography Wallpaper. This version is built around a local Linux desktop workflow: YesPlayMusic provides the audio, PipeWire routes it into a visualizer source, a Python WebSocket backend streams FFT data and lyrics metadata, and the React/Three.js frontend renders the animated chessboard wave wallpaper.

## Upstream

This repository is a sanitized independent archive derived from:

```text
https://github.com/hgbhh258-spec/Sonic-Topography-Wallpaper
```

Original copyright retained from the MIT license:

```text
Copyright (c) 2026 eeegg
```

This repository does not currently preserve GitHub's visible fork relationship because its history was rebuilt as a clean archive. The upstream relationship is documented here instead. The original MIT License is retained, and the original `LICENSE` file is kept unchanged.

## What Changed

- Added a KDE/Linux wallpaper workflow using a local Chrome app window, KWin window rules, and a desktop launcher.
- Added PipeWire/PulseAudio routing scripts for YesPlayMusic so the wallpaper reacts to player output without playing its own audio.
- Added a Python WebSocket backend that streams 512-bin FFT frequency data from `sonic_viz_mic`.
- Added YesPlayMusic MPRIS metadata support and NetEase LRC lyric fetching through the same WebSocket backend.
- Restored the 3D lyrics overlay without restoring the original visible player controls.
- Added visual controls for palette, detail/column count, frame rate, and wave strength.
- Tuned the shader to reduce bright-center stripe artifacts and improve wave response.
- Added frontend WebSocket reconnect handling for the local audio backend.
- Added tracked archive copies of the runtime scripts and KDE configuration examples.

## Runtime Architecture

```text
YesPlayMusic
  -> sonic_viz_sink
       -> loopback -> real speaker sink
       -> sonic_viz_mic
            -> sonic-audio-ws
                 -> binary WebSocket frames: 512 FFT bins
                 -> JSON WebSocket messages: lyrics and playback state
                      -> React / Three.js wallpaper
```

Default local endpoints:

```text
http://localhost:8000/Sonic-Topography-Wallpaper/
ws://127.0.0.1:8082
```

## Project Structure

```text
.
├── kde/
│   ├── kwinrules-sonic-example.conf
│   └── sonic-wallpaper.desktop
├── public/
├── scripts/
│   ├── sonic-audio-ws
│   └── sonic-wallpaper
├── src/
│   ├── components/
│   ├── lib/
│   ├── App.tsx
│   └── main.tsx
├── PROJECT_ARCHIVE.md
├── SETUP.md
├── LICENSE
├── package.json
└── vite.config.ts
```

## Dependencies

Frontend:

```bash
npm install
```

Runtime tools used by the KDE wallpaper mode:

```text
python3
numpy
sounddevice
websockets
pactl
systemd-run
busctl
google-chrome-stable
YesPlayMusic
KDE / KWin
```

## Build

```bash
npm run lint
npm run build
```

## Local Install

Install the runtime scripts:

```bash
mkdir -p ~/.local/bin
cp scripts/sonic-wallpaper ~/.local/bin/sonic-wallpaper
cp scripts/sonic-audio-ws ~/.local/bin/sonic-audio-ws
chmod +x ~/.local/bin/sonic-wallpaper ~/.local/bin/sonic-audio-ws
```

Install `kde/sonic-wallpaper.desktop` through your desktop environment if you want a launcher.

The launcher defaults to serving the built frontend from:

```text
$HOME/www/Sonic-Topography-Wallpaper/
```

and served from:

```text
http://localhost:8000/Sonic-Topography-Wallpaper/
```

Adjust `scripts/sonic-wallpaper` if your local paths are different.

## KDE Window Rule

The wallpaper effect depends on KWin rules similar to:

```text
kde/kwinrules-sonic-example.conf
```

The important window properties are:

- no border
- below normal windows
- skip taskbar
- match the Sonic window class

The tracked file is an example, not a full replacement for an existing `~/.config/kwinrulesrc`.

## Start

```bash
sonic-wallpaper
```

The launcher:

- creates `sonic_viz_sink` if missing
- creates `sonic_viz_mic` if missing
- creates a loopback from the visualization sink to the real speaker sink
- routes YesPlayMusic audio into the visualization sink
- starts the Python WebSocket backend
- starts a local HTTP server
- launches a Chrome app window for the wallpaper

## Lyrics

Lyrics are driven by YesPlayMusic MPRIS metadata:

```text
org.mpris.MediaPlayer2.yesplaymusic
```

The backend reads the current track ID, title, artist, playback status, and position with `busctl --user`, then fetches synced LRC lyrics from NetEase by track ID. The frontend receives lyrics over the same WebSocket connection used for FFT data.

## Verification

The current archive branch was checked with:

```bash
bash -n scripts/sonic-wallpaper
python3 -m py_compile scripts/sonic-audio-ws
npm run lint
npm run build
```

## Notes

This repository documents a local desktop setup. Machine-specific runtime state is not fully represented in Git, including loaded PipeWire modules, the active KWin rule database, the temporary Chrome profile, and deployed files under `$HOME/www`.
