import * as THREE from 'three';
import * as FUNCTIONS from 'https://notrimuru.github.io/3d-naggers/functions.mjs';
import * as ENTITIES from 'https://notrimuru.github.io/3d-naggers/entities.mjs';

const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex( 0x111111 );

const camera = new THREE.PerspectiveCamera( 75, 1350 / 796, 0.02, 30 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( 1350, 796 );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const groundGeomatry = new THREE.BoxGeometry( 1000, 1000 );
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
const ground = new THREE.Mesh( groundGeomatry, groundMaterial );
scene.add( ground );
ground.rotation.x = -90 * ( Math.PI / 180 );
ground.position.y = -1;
ground.name = "ground";

const playerGeometry = new THREE.BoxGeometry( .3, .3, .3 );
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent : true, opacity : 0 });
const playerHitbox = new THREE.Mesh( playerGeometry, playerMaterial );
camera.add( playerHitbox );

ENTITIES.player.instance = camera;
ENTITIES.player.hitbox = playerHitbox;

let keyboard = {};


let damageCooldown = false;
window.onkeydown = (e) => {
    const key = e.key.toLowerCase();
    keyboard[key] = true;

    if( key == 'g' ) FUNCTIONS.createEnemy( scene );
    else if( key == 'r' && !damageCooldown ) {
        damageCooldown = true;

        FUNCTIONS.damage();

        setTimeout(() => {
            damageCooldown = false;
        }, 10000);
    } 
};

window.onkeyup = (e) => {
    const key = e.key.toLowerCase();
    keyboard[key] = false;
}


const clock = new THREE.Clock();
let delta = 0;
let jump = false;
let jumpVelocity = 0;

let dash = false;
let dashVelocity = 0;
let dashCooldown = false;

const movementHelper = new THREE.Mesh(new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
movementHelper.position.set( camera.position.x, camera.position.y, camera.position.z )

function movement() {
    movementHelper.attach( camera );

    if( keyboard["w"] ) movementHelper.translateZ( -1 * delta );
    if( keyboard["s"] ) movementHelper.translateZ( 1 * delta );
    if( keyboard["d"] ) movementHelper.translateX( 1 * delta );
    if( keyboard["a"] ) movementHelper.translateX( -1 * delta );
    if( keyboard["arrowleft"] ) movementHelper.rotateY( 3 * delta );
    if( keyboard["arrowright"] ) movementHelper.rotateY( -3 * delta );
    if( keyboard["arrowup"] ) camera.rotateX( 3 * delta );
    if( keyboard["arrowdown"] ) camera.rotateX( -3 * delta );
    if ( keyboard[" "] && jump == false ) {
        jump = true;
        jumpVelocity = 7;
    }
    if( keyboard["f"] && dash == false && dashCooldown == false) {
        dash = true;
        dashVelocity = 7;
        dashCooldown = true;
    }

    if ( jump == true ) {
        movementHelper.position.y += jumpVelocity * delta;

        jumpVelocity -= 9.8 * 2 * delta;
        if (movementHelper.position.y <= 0) {
            jump = false;
            jumpVelocity = 0;
            movementHelper.position.y = 0;
        }
    }

    if ( dash ) {
        if( keyboard["w"] ) movementHelper.translateZ( -dashVelocity * delta );
        if( keyboard["s"] ) movementHelper.translateZ( dashVelocity * delta );
        if( keyboard["d"] ) movementHelper.translateX( dashVelocity * delta );
        if( keyboard["a"] ) movementHelper.translateX( -dashVelocity * delta );

        dashVelocity -= 9.8 * 2 * delta;
        if ( dashVelocity <= 0 ) { 
            dash = false;

            let countdown = 5;
            const dashDiv = document.getElementById( "dash" );
            dashDiv.innerHTML = `${countdown}`;
            const countdownInterval = setInterval( () => {
                countdown --;
                dashDiv.innerHTML = `${countdown}`;
            }, 1000)

            setTimeout( () => {
                dashCooldown = false;
                clearInterval( countdownInterval );

                dashDiv.innerHTML = "Dash";
            }, 5000 );

            
        }
    }

    scene.attach( camera );

}

function spawnEnemies() {
    setInterval(() => {
        createEnemy();
    }, 1000);
}

function animate() {
    delta = clock.getDelta();

    if( keyboard["e"] == true ) FUNCTIONS.shoot( ENTITIES.player, scene );

    movement();

    for( const bullet of ENTITIES.playerBullets ) FUNCTIONS.bulletHandler( bullet, ENTITIES.playerBullets, scene, delta );
    for( const bullet of ENTITIES.enemyBullets )  FUNCTIONS.bulletHandler( bullet, ENTITIES.enemyBullets, scene, delta );

    FUNCTIONS.enemyHandler( scene, delta );

    const healthDiv = document.getElementById( "health" );
    healthDiv.style.width = `${ ENTITIES.player.health * 100 / ENTITIES.player.maxhealth }%`;
    const healthTextDiv = document.getElementById( "health-text" );
    healthTextDiv.innerHTML = `${ ENTITIES.player.health } / ${ ENTITIES.player.maxhealth }`;

	renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );
