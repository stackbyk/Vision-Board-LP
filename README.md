# Vision Board Workshop

A responsive, buildless recreation of the supplied first-screen reference. No package installation or build is required.

Run `python -m http.server 3000` in this folder and visit http://localhost:3000. You can also open index.html directly.

Files: index.html (content), styles.css (layout and brand tokens), script.js (booking placeholder dialog).

Typography uses real DM Serif Display and DM Sans through Google Fonts. All headings use --heading-size; all other text uses --body-size. Both variables adjust globally at responsive breakpoints. An internet connection is needed to load the fonts.

Brand colors: --purple #472C7D, --lavender #E5D8FF, --light-purple #CC88FF, --white #FFFFFF, --lime #E1FB62, --yellow #FFBC59, --pink #CD0067.

The supplied folder had no existing application, workshop video, or booking destination. Set `VIDEO_URL` at the top of video.js to a full YouTube watch/share/embed URL or a directly hosted MP4 URL (signed query strings are supported). Leave it empty for the dark Workshop Preview placeholder. YouTube uses a privacy-enhanced embed with controls; MP4 uses native playback controls. The CTA opens a booking-details placeholder dialog; replace its handler with the actual booking destination when supplied.
