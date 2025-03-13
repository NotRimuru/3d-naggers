import * as THREE from 'three';
import { element, instance, vec3 } from 'three/tsl';

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
        playerShoot();
    }
    else if(key == 'g'){
        createEnemy();
    }
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

const enemyTypes = [
    {   
        name : "tank",
        instance : null,
        health : 5, 
        speed : 0.01,
        cameraRotation : "y-only",
        movement : "only-horizontal",
        attackType : "melee",
        size : 0.5,
        color : { color : 0x00ff00 },
        attackCooldown : false
    },

    {
        name : "speedy",
        instance : null,
        health : 1, 
        speed : 0.03,
        cameraRotation : "y-only",
        movement : "only-horizontal",
        attackType : "melee",
        size : 0.2,
        color : { color : 0x00ffff },
        attackCooldown : false
    },
    
    {
        name : "air",
        instance : null,
        health : 2, 
        speed : 0.02,
        cameraRotation : "non-restricted",
        movement : "only-horizontal",
        attackType : "shooting",
        size : 0.3,
        color : { color : 0xff0000 },
        attackCooldown : false
    }
]

let enemies = new Array();
function createEnemy() {
    const enemy = JSON.parse(JSON.stringify( enemyTypes[ Math.floor( Math.random() * enemyTypes.length )  ] ));

    const enemyGeometry = new THREE.BoxGeometry( enemy.size, enemy.size, enemy.size );
    const enemyMaterial = new THREE.MeshBasicMaterial( enemy.color );
    const enemyInstance = new THREE.Mesh( enemyGeometry, enemyMaterial );
    enemy.instance = enemyInstance;
    scene.add( enemyInstance );

    enemyInstance.position.x = Math.floor( (Math.random() * 6) - 3 );
    enemyInstance.position.z = Math.floor( (Math.random() * 6) - 3 );

    if(enemy.name == "air"){
        enemyInstance.position.y = 1;
    }

    enemies.push( enemy );
}

function spawnEnemies() {
    setInterval(() => {
        createEnemy();
    }, 1000);
}

function enemyHandler() {
    for(const enemy of enemies) {
        
        enemy.instance.rotation.set( 0, 0, 0 );
        enemy.instance.rotation.y = Math.atan2( ( camera.position.x - enemy.instance.position.x ), ( camera.position.z - enemy.instance.position.z ) );

        if( enemy.instance.position.distanceTo( camera.position ) > 3 || enemy.name != "air" ){
            enemy.instance.translateZ( enemy.speed );
        }
        
        if( enemy.cameraRotation == "non-restricted" ) {
            enemy.instance.lookAt( camera.position );
        }

        if(enemy.attackCooldown == false){
            enemy.attackCooldown = true;
            setTimeout( () => {
                enemy.attackCooldown = false;
            }, 3000);

            if(enemy.name == "air"){
                enemyShoot( enemy );
            }
            else{
                const enemyBB = new THREE.Box3().setFromObject( enemy.instance );
                const cameraBB = new THREE.Box3().setFromObject( camera );
                const collision = enemyBB.intersectsBox( cameraBB );

                if( !collision )continue;
            }
        }
    }
}

let bullets = new Array();
let shootTimeout = false;
function playerShoot() {
    if( shootTimeout )return;
    shootTimeout = true;

    setTimeout(() => {
        shootTimeout = false;
    }, 200);
    
    const bulletGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
    const bulletMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
    scene.add( bullet );

    bullet.position.set( camera.position.x, camera.position.y - 0.1, camera.position.z );
    bullet.rotation.set( camera.rotation.x, camera.rotation.y, camera.rotation.z );
    
    bullets.push({
        instance : bullet,
        distance : 0, 
        damage : 5, 
        speed : 0.05
    });
}

let enemyBullets = new Array();
function enemyShoot(enemy) {
    const bulletGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
    const bulletMaterial = new THREE.MeshBasicMaterial( { color: 0xff3399 } );
    const bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
    scene.add( bullet );

    bullet.position.set( enemy.instance.position.x, enemy.instance.position.y - 0.1, enemy.instance.position.z );
    bullet.rotation.set( enemy.instance.rotation.x, enemy.instance.rotation.y, enemy.instance.rotation.z );
    
    enemyBullets.push({
        instance : bullet,
        distance : 0, 
        damage : 1, 
        speed : 0.05
    });
}

function playerBulletHandler(bullet){
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

    if( bullet.distance >= 10 ){
        scene.remove( bullet.instance );
        bullets.splice( bullets.indexOf( bullet ), 1 );
    }
}

function enemyBulletHandler(bullet){
    bullet.instance.translateZ(bullet.speed);
    bullet.distance += bullet.speed;

    const bulletBB = new THREE.Box3().setFromObject( bullet.instance );
    const playerBB = new THREE.Box3().setFromObject( camera );
    const collision = bulletBB.intersectsBox( playerBB );

    if( collision ) {

        scene.remove( bullet.instance );
        enemyBullets.splice( enemyBullets.indexOf( bullet ), 1);

        // player.health -= bullet.damage;
        // if( player.health <= 0 ) {
        //     alert("you lost!");
        // }
    }
            
    if( bullet.distance >= 10 ){
        bullet.instance.removeFromParent();
        enemyBullets.splice( enemyBullets.indexOf( bullet ), 1 );
    }
}

function animate() {

    movement();

    for(const bullet of bullets){
        playerBulletHandler(bullet);
    }
    for(const bullet of enemyBullets){
        enemyBulletHandler(bullet);
    }

    enemyHandler();
    
	renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );