Background audio is broken — audio stops completely when the phone screen 

locks. This was working before the audio crack fix. The micro-fade 

visibility handler is likely interfering with the audio keep-alive.



Check what changed in the last commit to audio-engine.ts and revert 

anything that broke the background audio. The micro-fade on visibility 

change should NOT prevent audio from continuing in the background. 



Make sure:

1\. The silent audio element keep-alive is still running during sessions

2\. The AudioContext.resume() call still fires when visibility changes

3\. The micro-fade only affects gain values, not audio source playback

4\. No audio sources are being stopped or disconnected on visibilitychange



Background audio continuing through screen lock is MORE important than 

fixing the crack sound. If the micro-fade breaks background audio, 

remove the micro-fade entirely and accept the crack.

