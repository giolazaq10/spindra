# Slot playback and audio controls

Available in all 25 slot cabinets.

- **Hold Space** for consecutive quick paid spins. Release Space to stop requesting more spins. The currently accepted spin completes.
- **Quick spin** shortens visual presentation for manual and automatic play. Hold-Space always uses quick presentation.
- **Autoplay** accepts 1–1,000 paid spins. The displayed stake total is the maximum planned sum of paid stakes; free-spin frames do not consume the selected count.
- **Stop repeats** cancels the next spin. It cannot cancel a wager that the server has already accepted.
- The total-stake selector and step buttons sit immediately beside the fixed primary Spin button. During a spin, that button becomes **Stop**: it stops repeated play and skips the remaining presentation of the confirmed result. If the server response is pending, it shows **Waiting** until confirmation. It never submits another wager, refunds an accepted bet, or discards a confirmed free-spin award.
- Repeating play stops on insufficient confirmed balance, unavailable account, request failure or uncertain result, window blur, hidden tab, an open dialog, or leaving the cabinet. It never retries an uncertain wager automatically.
- Classic-slot free-spin bonuses stop repeated paid play. Play or skip the already confirmed bonus before starting a new paid spin.
- Inputs and unrelated buttons retain their normal Space key behavior. Key-repeat events do not submit additional requests.
- Stake changes are disabled while repeated play is active.

There is one in-flight paid request at a time. The next spin starts only after the previous confirmed presentation finishes and the current wallet/account state permits another stake. Request IDs and authoritative cash settlement stay unchanged. Quick presentation affects no odds or payouts.

## Original audio

Every slot has a distinct root pitch, melody, tempo and oscillator profile, used for its original synthesized music and effect palette. No third-party recordings or provider audio assets are included.

Music and sound effects have separate toggles, plus a shared volume slider. Preferences persist on the device across cabinets. Audio starts only after a user interaction; unsupported or denied audio does not block play. Sound is paused when the window loses focus or the tab becomes hidden, and its timers and AudioContext are disposed when leaving the cabinet.
