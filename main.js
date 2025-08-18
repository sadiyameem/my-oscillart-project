// setup
const input = document.getElementById('input');
const color_picker = document.getElementById('color');
const vol_slider = document.getElementById('vol-slider');
const recording_toggle = document.getElementById('record');

// create web audio api elements
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();

// create Oscillator node
const oscillator = audioCtx.createOscillator();
oscillator.connect(gainNode);
gainNode.connect(audioCtx.destination);
oscillator.type = "sine";
oscillator.start();
gainNode.gain.value = 0;

// Place Map here
const notenames = new Map();
notenames.set("C", 261.6);
notenames.set("D", 293.7);
notenames.set("E", 329.6);
notenames.set("F", 349.2);
notenames.set("G", 392.0);
notenames.set("A", 440);
notenames.set("B", 493.9);

// Function to play a note given a pitch
function frequency(pitch) {
    freq = pitch / 10000;

    // Start the volume controlled by slider
    gainNode.gain.setValueAtTime(vol_slider.value / 100, audioCtx.currentTime);
    setting = setInterval(() => { gainNode.gain.value = vol_slider.value / 100 }, 1);

    // Set the oscillator frequency
    oscillator.frequency.setValueAtTime(pitch, audioCtx.currentTime);

    // Stop the interval and reset gain after the note ends
    setTimeout(() => { 
        clearInterval(setting); 
        gainNode.gain.value = 0; 
    }, timepernote - 10);
}

// Function called when button is clicked
function handle() {
    reset = true;
    audioCtx.resume();          // Resume audio context on user interaction
    gainNode.gain.value = 0;    // Keep gain silent until play

    var usernotes = String(input.value);    // Convert user input to a string

    length = usernotes.length;
    timepernote = (6000 / length);

    var noteslist = [];
    for (i = 0; i < usernotes.length; i++) {
        noteslist.push(notenames.get(usernotes.charAt(i)));

    }
    let j = 0;
    // Play the first note immediately so the wave shows right away
    if (noteslist.length > 0) {
        frequency(noteslist[0]);
        drawWave();
        j = 1;
    }
let repeat = setInterval(() => {
    if (j < noteslist.length) {
        frequency(noteslist[j]);  // play the note
        drawWave();                // draw its wave
        j++;
    } else {
        clearInterval(repeat);    // stop when done
    }
}, timepernote); // 1 second per note
}

// recording variables
var blob, recorder = null;
var chunks = [];

// define canvas variables
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d"); 
var width = ctx.canvas.width;
var height = ctx.canvas.height;

// start recording function
function startRecording() {
    const canvasStream = canvas.captureStream(20);
    const audioDestination = audioCtx.createMediaStreamDestination();
    const combinedStream = new MediaStream(); 

    gainNode.connect(audioDestination);

    canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

    audioDestination.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));

    recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });

    recorder.ondataavailable = e => {
 if (e.data.size > 0) {
   chunks.push(e.data);
 }
};


recorder.onstop = () => {
   const blob = new Blob(chunks, { type: 'video/webm' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'recording.webm';
   a.click();
   URL.revokeObjectURL(url);
};

    recorder.start();
}


// Sine wave variables
var x = 0;
var counter = 0;     // interval counter
var freq = 0.01;        //horizontal frequency
var interval = null;    // will hold the setInterval reference
var reset = false;      // used to reset

// Variables for spacing notes
var timepernote = 0;
var length = 0;

// Function to draw a line for sine wave
function line() {
    const color_picker = document.getElementById('color');
    let y = height/2 + vol_slider.value * 2 * Math.sin(x * 2 * Math.PI * freq * (0.5 * length));
    ctx.lineTo(x, y);
    ctx.strokeStyle = color_picker.value;
    ctx.lineWidth = 3;
    ctx.stroke();
    x = x + 1;
    counter++;      //increase counter each time line() runs

    if (counter > (timepernote / 20)) {
        clearInterval(interval); // stop the interval after 50
    }
}

// funtion to draw the wave using an interval
function drawWave() {
    clearInterval(interval);
    if (reset) {
    ctx.clearRect(0, 0, width, height);
    x = 0;
    let y = height/2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    reset = false;
    } 
    counter = 0;
    interval = setInterval(line, 20);
}

// recording and toggle variables
var is_recording = false;
function toggle() {
    is_recording = !is_recording; 
   if(is_recording){
       recording_toggle.innerHTML = "Stop Recording";
       startRecording(); 
   } else {
       recording_toggle.innerHTML = "Start Recording";
       recorder.stop();
   }
    
}