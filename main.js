import * as THREE from 'three';
import { element, instance, vec3 } from 'three/tsl';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.02, 30 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const playerGeometry = new THREE.BoxGeometry( .3, .3, .3 );
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent : true, opacity : 0 });
const playerHitbox = new THREE.Mesh( playerGeometry, playerMaterial );

camera.add( playerHitbox );

let player = {
    name : "player",
    instance : camera,
    hitbox : playerHitbox,
    health : 10,
    stamina : 100,
    shootTimeout : false,
    bullet : {
        size : 0.1,
        color : 0xffff00,
        yOffset : 0.1
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
        color : 0x00ff00,
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
        color : 0x00ffff,
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
        color : 0xff0000,
        attackCooldown : false,
        bullet : {
            size : 0.1,
            color : 0xAA0000,
            yOffset : 0
        }
    }
]

let keyboard = {};


window.onkeydown = (e) => {
    const key = e.key.toLowerCase();
    keyboard[key] = true;

    if( key == 'g' ) spawnEnemies();
};

window.onkeyup = (e) => {
    const key = e.key.toLowerCase();
    keyboard[key] = false;
}

window.onresize = () => {
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

let jumpingTimeout = false;
let jumping = false;
let falling = false;

var clock = new THREE.Clock();
var delta = 0;
var jump_can = 1;
let velocity_y = 0;

function movement() {
    delta = clock.getDelta();

    if( keyboard["w"] == true ) camera.translateZ( -0.01 );
    if( keyboard["s"] == true ) camera.translateZ( 0.01 );
    if( keyboard["d"] == true ) camera.translateX( 0.01 );
    if( keyboard["a"] == true ) camera.translateX( -0.01 );
    if( keyboard["arrowleft"] == true ) camera.rotateY( 0.03 );
    if( keyboard["arrowright"] == true ) camera.rotateY( -0.03 );
    if( keyboard["arrowup"] == true ) camera.rotateX( 0.03 );
    if( keyboard["arrowdown"] == true ) camera.rotateX( -0.03 );
    if ( keyboard[" "] && jump_can == 1 ) {
        jump_can = 0;
        velocity_y = 7;
    }

    if ( jump_can == 0 ) {
        camera.position.y += velocity_y * delta;

        velocity_y -= 9.8 * 2 * delta;
        if (camera.position.y <= 0) {
            jump_can = 1;
            velocity_y = 0;
            camera.position.y = 0;
        }
    }
}

let enemies = new Array();
function createEnemy() {
    const enemy = JSON.parse(JSON.stringify( enemyTypes[ Math.floor( Math.random() * enemyTypes.length )  ] ));

    const enemyGeometry = new THREE.BoxGeometry( enemy.size, enemy.size, enemy.size );
    const enemyMaterial = new THREE.MeshBasicMaterial({ color : enemy.color });
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

        if( enemy.instance.position.distanceTo( camera.position ) > 3 || enemy.name != "air" ) enemy.instance.translateZ( enemy.speed );

        if( enemy.cameraRotation == "non-restricted" ) enemy.instance.lookAt( camera.position );

        if( enemy.attackCooldown == false ) {
            enemy.attackCooldown = true;
            setTimeout( () => {
                enemy.attackCooldown = false;
            }, 3000);

            if( enemy.name == "air" ) shoot( enemy );
            else {

                const enemyBB = new THREE.Box3().setFromObject( enemy.instance );
                const playerBB = new THREE.Box3().setFromObject( player.hitbox );
                const collision = enemyBB.intersectsBox( playerBB );

                if( !collision ) continue;
                
                player.health -= 1;
                console.log( player.health );
                if( player.health > 0 ) continue;
                
                alert("you lost!");
            }
        }
    }
}

function createBullet(size, color, yOffset, instance) {
    const bulletGeometry = new THREE.BoxGeometry( size, size, size );
    const bulletMaterial = new THREE.MeshBasicMaterial( { color: color } );
    const bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
    scene.add( bullet );

    bullet.position.set( instance.position.x, instance.position.y - yOffset, instance.position.z );
    bullet.rotation.set( instance.rotation.x, instance.rotation.y, instance.rotation.z );

    return bullet;
}

let playerBullets = new Array();
let enemyBullets = new Array();
function shoot( shooter ) {
    if( shooter.shootTimeout ) return;
    shooter.shootTimeout = true;

    setTimeout(() => {
        shooter.shootTimeout = false;
    }, 200);
    
    let bulletArr;
    if( shooter.name == "player" ) bulletArr = playerBullets;
    else bulletArr = enemyBullets;

    bulletArr.push({
        instance : createBullet( shooter.bullet.size , shooter.bullet.color, shooter.bullet.yOffset, shooter.instance ),
        distance : 0, 
        damage : 1, 
        speed : 0.05
    });
}

function deleteEntity( entity, arr ) {

    entity.instance.removeFromParent();
    arr.splice(arr.indexOf( entity ), 1);
}

function detectCollision( entity1, entity2 ) {

    const entity1BB = new THREE.Box3().setFromObject( entity1 );
    const entity2BB = new THREE.Box3().setFromObject( entity2 );
    return entity1BB.intersectsBox( entity2BB );
}

function playerBulletHandler(bullet){

    bullet.instance.translateZ(-bullet.speed);
    bullet.distance += bullet.speed;

    for( const enemy of enemies ) {
        if( !detectCollision( bullet.instance, enemy.instance ) )continue;

        deleteEntity( bullet, playerBullets );

        enemy.health -= bullet.damage;
        if( enemy.health > 0 ) break;

        deleteEntity( enemy, enemies );

        break;
    }   

    if( bullet.distance >= 20 ) deleteEntity( bullet, playerBullets );
}

function enemyBulletHandler( bullet ) {
    bullet.instance.translateZ( bullet.speed );
    bullet.distance += bullet.speed;
        
    if( detectCollision( bullet.instance, player.hitbox ) ){
        deleteEntity( bullet, enemyBullets );

        player.health -= bullet.damage;
        console.log( player.health );

        if( player.health <= 0 ){
            alert("You lost!!!");
            location.reload();
        }
    }

    if( bullet.distance >= 20 ) deleteEntity( bullet, enemyBullets );
}

function animate() {
    
    if( keyboard["e"] == true ) shoot( player );

    movement();

    for(const bullet of playerBullets) playerBulletHandler(bullet);
    for(const bullet of enemyBullets) enemyBulletHandler(bullet);

    enemyHandler();
    
	renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );