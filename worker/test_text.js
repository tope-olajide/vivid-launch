const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const bg = path.join(__dirname, 'tmp', 'bg.mp4');
const out = path.join(__dirname, 'tmp', 'test_text.mp4');

// Create dummy bg
try {
    console.log("Creating bg...");
    execSync(`"${ffmpeg}" -y -f lavfi -i color=c=blue:s=1280x720 -t 2 "${bg}"`);
    console.log("Adding text...");
    // The exact quote escaping strategy for Windows CMD drawtext
    const filter = `drawtext="fontfile=C\\\\:/Windows/Fonts/arial.ttf: text='HELLO WORLD': fontcolor=white: fontsize=50: x=100: y=100"`;
    execSync(`"${ffmpeg}" -y -i "${bg}" -vf ${filter} "${out}"`, { stdio: 'inherit'});
    console.log("Success!");
} catch (e) {
    console.error("Failed:", e.message);
}
