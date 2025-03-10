import * as THREE from 'three';
import { element, vec3 } from 'three/tsl';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 100 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

let movementStatus = {
    w : false,
    s : false,
    a : false,
    d : false,
    space : false,
    arrowright : false,
    arrowleft : false
};

const movementKeys = ['w', 's', 'a', 'd', 'space', 'arrowright', 'arrowleft'];

window.onkeydown = (e) => {
    const key = e.key.toLowerCase();

    if(movementKeys.includes(key)){
        movementStatus[key] = true;
    }
    else if(key == ' '){
        movementStatus.space = true;
    }
    else if(key == 'e'){
        shoot();
    }
    else if(key == 'g'){
        createEnemy();
    }

    console.log(key);

};

window.onkeyup = (e) => {
    const key = e.key.toLowerCase();

    if(movementKeys.includes(key)){
        movementStatus[key] = false;
    }
    else if(key == ' '){
        movementStatus.space = false;
    }

}

let jumpingTimeout = false;
let jumping = false;
let falling = false;
function movement(){
    if(movementStatus.w == true){
        camera.translateZ(-0.01);
    }
    if(movementStatus.s == true){
        camera.translateZ(0.01);
    }
    if(movementStatus.d == true){
        camera.translateX(0.01);
    }
    if(movementStatus.a == true){
        camera.translateX(-0.01);
    }
    if(movementStatus.arrowright == true){
        camera.rotation.y -= 0.03;
    }
    if(movementStatus.arrowleft == true){
        camera.rotation.y += 0.03;
    }

    if((jumping == true || movementStatus.space == true) && jumpingTimeout == false){
        jumping = true;

        if(camera.position.y < 1 && falling == false){
            camera.position.y += 0.1;
        }
        else if(camera.position.y >= 1 && falling == false){
            falling = true;
        }
        else if(camera.position.y > 0 && falling == true){
            camera.position.y -= 0.03;
        }
        else{
            camera.position.y = 0;
            falling = false;
            jumping = false;
        }
    }
}

let enemies = new Array();
function createEnemy() {
    const enemyGeometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const enemy = new THREE.Mesh( enemyGeometry, enemyMaterial );
    scene.add( enemy );

    enemy.position.x = Math.floor( (Math.random() * 6) - 3 );
    enemy.position.z = Math.floor( (Math.random() * 6) - 3 );

    enemies.push({
        instance : enemy, 
        health : 3, 
        speed : 0.01,
        cameraRotation : "y-only"
    });
}

function spawnEnemies() {
    setInterval(() => {
        createEnemy();
    }, 1000);
}

function enemyHandler() {
    for(const enemy of enemies) {
        
        if( enemy.cameraRotation == "y-only" ) {
            enemy.instance.rotation.y = Math.atan2( ( camera.position.x - enemy.instance.position.x ), ( camera.position.z - enemy.instance.position.z ) );
        }
        else if( enemy.cameraRotation == "non-restricted" ) {
            enemy.instance.lookAt( camera.position );
        }

        enemy.instance.translateZ( enemy.speed );

        const enemyBB = new THREE.Box3().setFromObject( enemy.instance );
        const cameraBB = new THREE.Box3().setFromObject( camera );
        const collision = enemyBB.intersectsBox( cameraBB );

        if( !collision )continue;

        throw new Error("You Lost!");
    }
}

let bullets = new Array();
let shootTimeout = false;
function shoot() {
    if(shootTimeout)return;
    shootTimeout = true;

    const bulletGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
    const bulletMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
    scene.add( bullet );

    bullet.position.set( camera.position.x, camera.position.y - 0.1, camera.position.z );
    bullet.rotation.set( camera.rotation.x, camera.rotation.y, camera.rotation.z );
    
    bullets.push({
        instance : bullet,
        distance : 0, 
        damage : 1, 
        speed : 0.05 
    });

    setTimeout(() => {
        shootTimeout = false;
    }, 200);
}

function bulletHandler(){
    for(const bullet of bullets) {
        bullet.instance.translateZ(-bullet.speed);
        bullet.distance += bullet.speed;

        for(const enemy of enemies) {
            const bulletBB = new THREE.Box3().setFromObject( bullet.instance );
            const enemyBB = new THREE.Box3().setFromObject( enemy.instance );
            const collision = bulletBB.intersectsBox( enemyBB );

            if( !collision )continue;

            scene.remove( bullet.instance );
            bullets.splice(bullets.indexOf( bullet ), 1);

            enemy.health -= bullet.damage;
            if( enemy.health > 0 )continue;

            scene.remove( enemy.instance );
            enemies.splice(enemies.indexOf( enemy ), 1);

            break;
        }

        if( bullet && bullet.distance >= 10 ){
            scene.remove( bullet.instance );
            bullets.splice(bullets.indexOf( bullet ), 1);
        }
    }
}

function animate() {

    movement();

    bulletHandler();

    enemyHandler();
    
	renderer.render( scene, camera );
}

document.body.addEventListener('click', (e) => {
    document.body.requestFullscreen();
});

renderer.setAnimationLoop( animate );