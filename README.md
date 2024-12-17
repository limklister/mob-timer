# Mob Timer

Simple timer for mob programming sessions. Tracks drivers, rotations, and breaks.

## Features

- Timer with configurable rotation time
- Current and next driver display
- Drag & drop team reordering
- Break reminders
- Sound alerts
- Shareable URLs

## Usage

Add team members, set rotation time (default 5min), and hit start. Timer will notify when it's time to switch drivers.

## URL Parameters

Configure default settings via URL:
- `members`: comma-separated list of team members
- `driver`: current driver name
- `time`: rotation time in minutes
- `breaks`: number of rotations before break

Example:
```
index.html?members=Alice,Bob,Charlie&driver=Bob&time=7&breaks=4
```

## Stack

Pure JavaScript, CSS, and HTML. No dependencies.