import * as THREE from 'three';
import { element, vec3 } from 'three/tsl';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

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
    Space : false,
    Control : false,
    ArrowRight : false,
    ArrowLeft : false
};

const movementKeys = ['w', 's', 'a', 'd', 'Space', 'Control', 'ArrowRight', 'ArrowLeft'];

window.onkeydown = (e) => {

    if(movementKeys.includes(e.key)){
        movementStatus[e.key] = true;
    }
    else if(e.key == ' '){
        movementStatus.Space = true;
    }
    else if(e.key == 'e'){
        shoot();
    }

    console.log(e.key)

};

window.onkeyup = (e) => {

    if(movementKeys.includes(e.key)){
        movementStatus[e.key] = false;
    }
    else if(e.key == ' '){
        movementStatus.Space = false;
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
    if(movementStatus.ArrowRight == true){
        camera.rotation.y -= 0.01;
    }
    if(movementStatus.ArrowLeft == true){
        camera.rotation.y += 0.01;
    }

    if((jumping == true || movementStatus.Space == true) && jumpingTimeout == false){
        jumping = true;

        if(camera.position.y < 1 && falling == false){
            camera.position.y += 0.05;
        }
        else if(camera.position.y >= 1 && falling == false){
            falling = true;
        }
        else if(camera.position.y > 0 && falling == true){
            camera.position.y -= 0.05;
        }
        else{
            camera.position.y = 0;
            falling = false;
            jumping = false;
        }
    }
}

let bullets = [];
function shoot() {
    const bulletGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
    const bulletMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
    scene.add( bullet );

    bullet.position.x = camera.position.x;
    bullet.position.z = camera.position.z;
    bullet.position.y = camera.position.y - 0.1;
    
    bullet.rotation.x = camera.rotation.x;
    bullet.rotation.y = camera.rotation.y;
    bullet.rotation.z = camera.rotation.z;
    
    bullets.push({bullet : bullet, distance : 0});
}

function animate() {

    movement();

    bullets.forEach((element) => {
        if(element.distance > 10){
            element.bullet.material.dispose();
            element.bullet.geometry.dispose();
            element.bullet.removeFromParent();
            bullets.splice(bullets.indexOf(element), 1);
        }
        else{
            element.bullet.translateZ(-0.02);
            element.distance += 0.01;
        }
    });
    
	renderer.render( scene, camera );
}

document.body.addEventListener('click', (e) => {
    document.body.requestFullscreen();
});

renderer.setAnimationLoop( animate );