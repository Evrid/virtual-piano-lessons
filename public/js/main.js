// Begin MIDI loader widger
MIDI.loader = new widgets.Loader({
    message: "Loading: Soundfont..."
});

function smoothstep(a, b, x) {
    if(x < a) return 0.0;
    if(x > b) return 1.0;
    var y = (x - a) / (b - a);
    return y * y * (3.0 - 2.0 * y);
}

function mix(a,b,x) {
    return a + (b - a) * Math.min(Math.max(x, 0.0), 1.0);
}            

function init_lights() {
    //var spotlight = new THREE.SpotLight(0xffffff);
    var spotlight = new THREE.DirectionalLight(0xffffff);
    
    spotlight.position.set(1.0,2.4,-7.5);
    spotlight.target.position.set(6.0, -6, 7);
    spotlight.shadowCameraVisible = false;
    spotlight.shadowDarkness = 0.75;
    spotlight.intensity = 1;
    spotlight.castShadow = true;
    spotlight.shadowMapWidth = 2048;
    spotlight.shadowMapHeight = 2048;

    spotlight.shadowCameraNear = 5.0;
    spotlight.shadowCameraFar = 20.0;
    spotlight.shadowBias = 0.0025;
    
    spotlight.shadowCameraLeft = -8.85;
    spotlight.shadowCameraRight = 5.5;
    spotlight.shadowCameraTop = 4;
    spotlight.shadowCameraBottom = 0;                
    scene.add(spotlight);
    
    var light = new THREE.DirectionalLight( 0xddffff, 0.5 );
    light.position.set( 1, 1, 1 ).normalize();
    scene.add( light );

    var light = new THREE.DirectionalLight( 0xff5555, 0.5 );
    light.position.set( -1, -1, -1 ).normalize();
    scene.add( light );
}

function initialize_keys(obj) {
    keys_obj.push(obj);                
    obj.rotation.x = -Math.PI/4.0;
    obj.rotation.y = 0;
    obj.rotation.z = 0;
    obj.keyState = keyState.unpressed;
    obj.clock = new THREE.Clock(false);
    obj.castShadow = true;
    obj.receiveShadow = true;

    // only add meshes in the material redefinition (to make keys change their color when pressed)
    if (obj instanceof THREE.Mesh) {
        old_material = obj.material;
        obj.material = new THREE.MeshPhongMaterial( { color:old_material.color} );
        obj.material.shininess = 35.0;
        obj.material.specular = new THREE.Color().setRGB(0.25, 0.25, 0.25);;
        obj.material.note_off = obj.material.color.clone();
    }
}

function keyStatus (keyName, status) {
    var obj = scene.getObjectByName(keyName, true);
    if (obj != undefined) {                 
        obj.clock.start();
        obj.clock.elapsedTime = 0;
        obj.keyState = status;
    }
}

function frame() {
    requestAnimationFrame(frame);
    var delta = clock.getDelta();
    update(delta);
    render(delta);
}

function update_key( obj, delta ) {
    if (obj.keyState == keyState.note_on) {
        obj.rotation.x = mix(-Math.PI/4.0, -controls.key_max_rotation, smoothstep(0.0, 1.0, controls.key_attack_time*obj.clock.getElapsedTime()));
        if (obj.rotation.x >= -controls.key_max_rotation) {
            obj.keyState = keyState.pressed;
            obj.clock.elapsedTime = 0;
        }                    
        obj.material.color = noteOnColor;
    }
    else if (obj.keyState == keyState.note_off) {
        obj.rotation.x = mix(-controls.key_max_rotation, -Math.PI/4.0, smoothstep(0.0, 1.0, controls.key_attack_time*obj.clock.getElapsedTime()));
        if (obj.rotation.x <= -Math.PI/4.0) {
            obj.keyState = keyState.unpressed;
            obj.clock.elapsedTime = 0;
        }
        obj.material.color = obj.material.note_off;
    }
}

function update(delta) {
    cameraControls.update(delta);
    for(i in keys_obj) {
        update_key(keys_obj[i], delta);
    }
}

function render(delta) {                
    renderer.render(scene, camera);
};

function keyCodeToNote(keyCode) {
    var note = -1;
    //-----------------------------------
    if(keyCode == 90)  note= 0; // C 0
    if(keyCode == 83)  note= 1; // C#0
    if(keyCode == 88)  note= 2; // D 0
    if(keyCode == 68)  note= 3; // D#0
    if(keyCode == 67)  note= 4; // E 0
    if(keyCode == 86)  note= 5; // F 0
    if(keyCode == 71)  note= 6; // F#0
    if(keyCode == 66)  note= 7; // G 0
    if(keyCode == 72)  note= 8; // G#0
    if(keyCode == 78)  note= 9; // A 0
    if(keyCode == 74)  note=10; // A#0
    if(keyCode == 77)  note=11; // B 0
    if(keyCode == 188) note=12; // C 0
    //-----------------------------------
    if(keyCode == 81)  note=12; // C 1
    if(keyCode == 50)  note=13; // C#1
    if(keyCode == 87)  note=14; // D 1
    if(keyCode == 51)  note=15; // D#1
    if(keyCode == 69)  note=16; // E 1
    if(keyCode == 82)  note=17; // F 1
    if(keyCode == 53)  note=18; // F#1
    if(keyCode == 84)  note=19; // G 1
    if(keyCode == 54)  note=20; // G#1
    if(keyCode == 89)  note=21; // A 1
    if(keyCode == 55)  note=22; // A#1
    if(keyCode == 85)  note=23; // B 1
    //-----------------------------------
    if(keyCode == 73)  note=24; // C 2
    if(keyCode == 57)  note=25; // C#2
    if(keyCode == 79)  note=26; // D 2
    if(keyCode == 48)  note=27; // D#2
    if(keyCode == 80)  note=28; // E 2
    if(keyCode == 219) note=29; // F 2
    if(keyCode == 187) note=30; // F#2
    if(keyCode == 221) note=31; // G 2
    //-----------------------------------
    //
    if(note == -1) return -1;
    return ("_" + (note + controls.octave * 12));
}


function playNote(channelId, note, velocity, delay) {
    if (keys_down[note] != true) {
        if (note != -1) {
            keyStatus(note, keyState.note_on);
            keys_down[note] = true;                     

            MIDI.setVolume(0, velocity);   
            MIDI.noteOn(channelId, note, velocity, delay);                        
            console.log("playing note: ", note, " at velocity ", velocity);
        }
    }
}

function releaseNote(channelId, note, delay) {
    if (keys_down[note] == true) {
        keyStatus(note, keyState.note_off);
        keys_down[note] = false;
        MIDI.noteOff(channelId, note, delay);
    }
}

var controls = new function() {
    this.key_attack_time = 9.0;
    this.key_max_rotation = 0.72;
    this.octave = 2;
    this.song = "game_of_thrones.mid";
    this.noteOnColor = [65, 210, 250, 1.0 ];

    this.play = function() {
        MIDI.Player.resume();
    };

    this.stop = function() {
        MIDI.Player.stop();
    }
};

// this is basically an enum
var keyState = Object.freeze({unpressed: {}, note_on: {}, pressed: {}, note_off: {}});

////////////////////////////////////////////////////////////////
// Set Up the Canvas
////////////////////////////////////////////////////////////////
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 2.0, 5000);

var keys_down = [];
var keys_obj = [];

var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);          
renderer.shadowMapEnabled = true;  
renderer.shadowMapSoft = true;
renderer.shadowMapType = THREE.PCFSoftShadowMap;
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.physicallyBasedShading = true;

document.body.appendChild(renderer.domElement);

var material = new THREE.MeshLambertMaterial({ color: 0x606060}) 

floor = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshBasicMaterial({color: 0xf0f0f0}));
floor.rotation.x = - 90 * ( Math.PI / 180 );
floor.position.y = -0.45;
floor.receiveShadow = true;
floor.castShadow = true;
scene.add(floor);
scene.fog = new THREE.Fog(0xffffff, 40, 50);

noteOnColor = new THREE.Color().setRGB(
    controls.noteOnColor[0] / 256.0, 
    controls.noteOnColor[1] / 256.0, 
    controls.noteOnColor[2] / 256.0
);

init_lights();

var loader = new THREE.ColladaLoader();
loader.load('obj/piano.dae', function(collada) {
    collada.scene.traverse(initialize_keys);                
    scene.add(collada.scene);                
});

camera.position.x = -2.77;
camera.position.z = 10.04;
camera.position.y = 5.51;

var cameraControls = new THREE.OrbitAndPanControls(camera, renderer.domElement);
cameraControls.target.set(4.5,0,0);

var clock = new THREE.Clock();

frame();
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// Set Up Midi Controller
////////////////////////////////////////////////////////////////
var context = new AudioContext();
var oscillators = {};
var midi, data;
var socket = io();

function onMIDImessage(message) {
    let note = {on: message.data[0], pitch: message.data[1], velocity: message.data[2]}
    socket.emit('midi', note);
    switch (note.on) {
        case 144:
            playNote(0, note.pitch, note.velocity, 0);
            break;
        case 128:
            releaseNote(0, note.pitch, note.velocity);
            break;
    }
}

function onMIDISuccess(midiData) {
    console.log(midiData);
    midi = midiData;
    var allInputs = midi.inputs.values();
    for (var input = allInputs.next(); input && !input.done; input = allInputs.next()) {
        input.value.onmidimessage = onMIDImessage;
    }
}

function onMIDIFailure() {
 console.warn("Not finding a MIDI controller");
}

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({sysex: false}).then(onMIDISuccess, onMIDIFailure);
} else {
    console.warn("No MIDI support in your browser");
}

socket.on('externalMidi', (note) => {
    playNote(0, note.pitch, note.velocity, 0);
});
////////////////////////////////////////////////////////////////
    

window.onkeydown = function(ev) {
    var note = keyCodeToNote(ev.keyCode);
    keyStatus(note, keyState.note_on);
    if (note !== -1) {
        note = parseInt(note.substr(1)) + 21;
        playNote(0, note, 127, 0);
    }
}            

window.onkeyup = function(ev) {
    var note = keyCodeToNote(ev.keyCode);
    if (note !== -1) {
        note = parseInt(note.substr(1)) + 21;
        releaseNote(0, note, 0.08);
    }
}                  

window.onload = function () {
    MIDI.loadPlugin(function () {
        //MIDI.Player.loadFile(song[0], MIDI.Player.start);
        MIDI.Player.timeWarp = 1.0; // speed the song is played back
        MIDI.Player.loadFile("midi/" + controls.song);                    
        
        MIDI.Player.addListener(function(data) {
            var pianoKey = data.note - MIDI.pianoKeyOffset - 3;
            if (data.message === 144) {
                keyStatus("_" + pianoKey, keyState.note_on);
            } else {
                keyStatus("_" + pianoKey, keyState.note_off);
            }
        });

        // Close the MIDI loader widget and open the GUI                                        
        MIDI.loader.stop();
        songsToFiles = {
            "Game Of Thrones Theme, Ramin Djawadi": "game_of_thrones.mid",
            "Mario Overworld Theme (Super Mario Bros 3), Koji Kondo": "mario_-_overworld_theme.mid",                                    
            "He's a Pirate (Pirates of the Caribbean), Klaus Badelt" : "hes_a_pirate.mid",
            "Hedwigs Theme (Harry Potter), John Williams": "hedwigs_theme.mid",
            "Something There (Beauty and the Beast), Alan Menken":"something_there.mid",
            "Cruel Angel Thesis (Neon Genesis Evangelion)": "cruel_angel__s_thesis.mid",
            "Me cuesta tanto olvidarte (Mecano)": "me_cuesta.mid",
            "Sonata No. 14 C# minor (Moonlight), Beethoven": "mond_1.mid",
            "For Elise, Beethoven": "for_elise_by_beethoven.mid",                                    
            "Asturias (Leyenda), Albeniz": "alb_se5_format0.mid",
            "Aragon (Fantasia), Albeniz": "alb_se6.mid",
            "Prelude and Fugue in C major BWV 846, Bach": "bach_846.mid",
            "Fantasia C major, Schubert": "schub_d760_1.mid",
            "Sonata No. 16 C major, Mozart": "mz_545_1.mid",			    
            "Sonata No. 11 A major (K331, First Movement), Mozart": "mz_331_1.mid",
            "March - Song of the Lark, Tchaikovsky":"ty_maerz.mid",
            "Piano Sonata in C major, Hoboken, Haydn": "haydn_35_1.mid",
            "Etudes, Opus 25, Chopin": "chpn_op25_e1.mid",
            "Polonaise Ab major, Opus 53, Chopin": "chpn_op53.mid",
            "No. 2 - Oriental, Granados": "gra_esp_2.mid",
            "Bohemian Rhapsody, Queen": "bohemian1.mid",                                    
        };
        var gui = new dat.GUI({width: 625});
        //gui.add(controls, 'key_attack_time', 2.0 , 40.0);
        //gui.add(controls, 'key_max_rotation',0.2 , 1.0);                             
        var song = gui.add(controls, 'song', songsToFiles);
        var noteOnColorControl = gui.addColor(controls, 'noteOnColor');
        noteOnColorControl.onChange(function(value) {
            noteOnColor = new THREE.Color().setRGB(controls.noteOnColor[0]/256.0, controls.noteOnColor[1]/256.0, controls.noteOnColor[2]/256.0);;
        });

        song.onChange(function(value) {
            MIDI.Player.stop();
            MIDI.Player.loadFile("midi/" + value, MIDI.Player.start);
        });

        // make sure to remove any key pressed when changing the octave
        var octave = gui.add(controls, 'octave',0 , 4).step(1);
        octave.onChange(function(value) {
            for (keyCode in keys_down) {  
                var note = keyCodeToNote(keyCode);
                keyStatus(note, keyState.note_off);
            }
        });

        gui.add(controls, 'play');
        gui.add(controls, 'stop');
    });                               
};            

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}, false);
