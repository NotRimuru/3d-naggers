import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.02, 30 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const groundGeomatry = new THREE.PlaneGeometry( 1000, 1000 );
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
const ground = new THREE.Mesh( groundGeomatry, groundMaterial );
scene.add( ground );
ground.rotation.x = -90 * ( Math.PI / 180 );
ground.position.y = -0.5

const playerGeometry = new THREE.BoxGeometry( .3, .3, .3 );
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent : true, opacity : 0 });
const playerHitbox = new THREE.Mesh( playerGeometry, playerMaterial );

camera.add( playerHitbox );

let player = {
    name : "player",
    instance : camera,
    hitbox : playerHitbox,
    health : 10,
    maxhealth: 10,
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
        speed : 1,
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
        speed : 3,
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
        speed : 2,
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

        if( enemy.instance.position.distanceTo( camera.position ) > 3 || enemy.name != "air" ) enemy.instance.translateZ( enemy.speed * delta );

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
        speed : 5
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

function playerBulletHandler( bullet ) {
    bullet.instance.translateZ( -bullet.speed * delta );
    bullet.distance += bullet.speed * delta;

    for( const enemy of enemies ) {
        if( !detectCollision( bullet.instance, enemy.instance ) && !detectCollision( bullet.instance, ground ) )continue;

        deleteEntity( bullet, playerBullets );

        enemy.health -= bullet.damage;
        if( enemy.health > 0 ) break;

        deleteEntity( enemy, enemies );

        break;
    }   

    if( bullet.distance >= 20 ) deleteEntity( bullet, playerBullets );
}

function enemyBulletHandler( bullet ) {
    bullet.instance.translateZ( bullet.speed * delta );
    bullet.distance += bullet.speed * delta;
        
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

function updateHealth() {

    const health = document.getElementById("health");
    health.style.width = `${player.health * 100 / player.maxhealth}%`;

}

function animate() {
    delta = clock.getDelta();

    if( keyboard["e"] == true ) shoot( player );

    movement();

    for(const bullet of playerBullets) playerBulletHandler(bullet);
    for(const bullet of enemyBullets) enemyBulletHandler(bullet);

    enemyHandler();

    updateHealth();
    
	renderer.render( scene, camera );
}

renderer.setAnimationLoop( animate );