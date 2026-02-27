Two bugs to fix:



1\. SESSION DURATION NOT APPLIED: When user selects a session duration 

&nbsp;  (e.g. 5 min) on the preset detail screen and taps "Start Session", 

&nbsp;  the session ignores the selection and plays the default duration instead 

&nbsp;  (e.g. 30 min). The selected duration from the pill buttons must be 

&nbsp;  passed to the session and used as the total session time. Session phases 

&nbsp;  should also recalculate based on the user-selected duration, not the 

&nbsp;  preset default.



2\. OVERSIZED HEADER IN PWA/STANDALONE MODE: When the app is added to 

&nbsp;  the home screen and opened as a standalone PWA (no browser chrome), 

&nbsp;  the header area is too tall — it's probably adding padding for the 

&nbsp;  browser address bar that no longer exists. Add a check for standalone 

&nbsp;  display mode and reduce the top padding accordingly:



&nbsp;  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 

&nbsp;    || (navigator as any).standalone === true;



&nbsp;  If standalone, remove or reduce the extra top padding/safe-area that 

&nbsp;  was compensating for the browser chrome. The header should sit close 

&nbsp;  to the status bar, not have a huge empty gap.

