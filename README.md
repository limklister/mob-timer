# Mob Timer

Beautiful and simple timer for mob programming sessions. Tracks drivers, rotations, breaks, and even team flow stats.

## Features

- Timer with configurable rotation time
- Current and next driver display
- Drag & drop team reordering
- Break timer with configurable length and frequency
- Flow & energy tracking for each rotation
- Visual stats timeline
- Sound alerts for timer end and breaks
- Shareable URLs
- Beautiful UI with animations and gradients

## Usage

1. Add team members
2. Configure settings (optional):
   - Rotation time (default: 5min)
   - Break frequency (default: every 4 rotations)
   - Break length (default: 5min)
3. Hit start to begin the mob session

When the timer ends:

1. Rate your energy level and flow state for the rotation
2. Take a break if it's break time, or continue to next driver
3. View your team's flow stats anytime with the "Show Stats" button

## URL Parameters

Configure default settings via URL:

- `members`: comma-separated list of team members
- `driver`: current driver name
- `time`: rotation time in minutes
- `breaks`: number of rotations before break
- `breakLength`: break duration in minutes

Example:

```
?members=Alice,Bob,Charlie&driver=Bob&time=7&breaks=4&breakLength=5
```

## Stack

Pure JavaScript, CSS, and HTML. No dependencies.
Beautiful responsive design using CSS Grid, Flexbox, and modern CSS features.

## Credits

Written by Claude from Anthropic to be a delightful tool for mob programming teams.
