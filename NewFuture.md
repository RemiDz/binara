Add an "Auto Motion" toggle in Create mode, next to the existing Phone 

Sensors toggle. This simulates the gyroscope tilt effect using randomised 

smooth oscillation — no actual phone movement needed.



When enabled:

\- Generate slow, smooth random values that simulate gentle phone tilting

\- Use multiple layered sine waves at different speeds for organic movement:

&nbsp; - Slow drift: 0.02–0.05 Hz (one full cycle every 20–50 seconds)

&nbsp; - Medium drift: 0.08–0.15 Hz (gentle wave)

&nbsp; - Tiny fast variation: 0.3–0.5 Hz (subtle shimmer, very low amplitude)

\- Combine these to create the gamma (left/right) and beta (forward/back) 

&nbsp; values, same as real gyroscope input

\- Feed these simulated values into the exact same sensor modulation 

&nbsp; function that the real gyroscope uses — stereo balance shift, carrier 

&nbsp; frequency drift, and stillness detection (stillness should NOT trigger 

&nbsp; during auto motion since the simulation is always moving)



Parameters the user can control:

\- Intensity slider (0–100%) — controls how wide the simulated tilt range is

&nbsp; - 0% = barely perceptible movement  

&nbsp; - 50% = gentle, meditative drift (default)

&nbsp; - 100% = full range, more dynamic



Behaviour:

\- Auto Motion and Phone Sensors are mutually exclusive — enabling one 

&nbsp; disables the other

\- Auto Motion is available to ALL users (free and PRO) in Create mode 

&nbsp; since it doesn't require phone hardware

\- Label: "Auto Motion" with a small infinity symbol or wave icon

\- When active, show a subtle animated indicator (slow breathing dot or 

&nbsp; gentle wave animation) so the user knows it's running



This feature should also be available in Listen and Mix mode sessions, 

not just Create mode. Same toggle placement as Phone Sensors.



Do not touch the existing Phone Sensors implementation — Auto Motion 

feeds into the same modulation pipeline but with simulated data instead 

of real sensor data.

