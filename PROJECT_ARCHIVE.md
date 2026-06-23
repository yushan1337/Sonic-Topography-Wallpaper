# Project Archive Notes

Date: 2026-06-23

## Upstream Relationship

This project is a sanitized independent archive derived from:

```text
https://github.com/hgbhh258-spec/Sonic-Topography-Wallpaper
```

That project states that it is based on:

```text
https://github.com/yin-yizhen/sonic-topography
```

The original MIT license and copyright notice are retained in `LICENSE`.

The GitHub-visible fork relationship is not preserved because this archive was rebuilt as a clean root commit to avoid carrying machine-specific local history. The upstream relationship is documented in `README.md` and in this file.

## Purpose

This archive documents a KDE/Linux desktop wallpaper adaptation for a local music workflow:

- YesPlayMusic provides the audio stream.
- PipeWire routes the player output into a virtual visualization source.
- A Python WebSocket backend streams FFT data and synced lyric metadata.
- The React/Three.js frontend renders a music-reactive chessboard wave wallpaper.

## Tracked Runtime Files

```text
scripts/sonic-wallpaper
scripts/sonic-audio-ws
kde/sonic-wallpaper.desktop
kde/kwinrules-sonic-example.conf
```

The tracked scripts avoid machine-specific absolute paths. Local deployments can be adjusted with environment variables such as:

```text
SONIC_REAL_SINK
SONIC_WEB_ROOT
SONIC_APP_PATH
SONIC_APP_URL
SONIC_WS_SCRIPT
SONIC_LAUNCHER_SCRIPT
SONIC_CHROME_PROFILE
```

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

## Verification

The archived version should pass:

```bash
bash -n scripts/sonic-wallpaper
python3 -m py_compile scripts/sonic-audio-ws
npm run lint
npm run build
```

## Notes

Machine-specific runtime state is intentionally not stored in Git. This includes currently loaded PipeWire modules, the active KWin rule database, generated build output, temporary browser profiles, and local deployment directories.
