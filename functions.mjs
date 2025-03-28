import * as THREE from 'three';
import * as ENTITIES from "/3d-naggers/entities.mjs";

export function damage() {
    const damage = ENTITIES.player.damage;
    ENTITIES.player.damage *= 2;
    setTimeout(() => {
        ENTITIES.player.damage -= damage;
    }, 5000);
    
    let cooldown = 10;
    const damageDiv = document.getElementById( "damage" );
    damageDiv.innerHTML = `${cooldown}`;
    const damageInterval = setInterval(() => {
        if( cooldown > 0 ) {
            cooldown --;
            damageDiv.innerHTML = `${cooldown}`;
        }
        else {
            clearInterval( damageInterval );
            damageDiv.innerHTML = `Dmg`;
        }
    }, 1000);
}

function deleteEntity( entity, array ) {
    entity.instance.removeFromParent();
    array.splice( array.indexOf( entity ), 1 );
}

function detectCollision( entity1, entity2 ) {
    const entity1BB = new THREE.Box3().setFromObject( entity1 );
    const entity2BB = new THREE.Box3().setFromObject( entity2 );
    return entity1BB.intersectsBox( entity2BB );
}

function createBullet( size, color, yOffset, instance, scene ) {
    const bulletGeometry = new THREE.BoxGeometry( size, size, size );
    const bulletMaterial = new THREE.MeshBasicMaterial( { color: color } );
    const bullet = new THREE.Mesh( bulletGeometry, bulletMaterial );
    scene.add( bullet );

    bullet.position.set( instance.position.x, instance.position.y - yOffset, instance.position.z );
    bullet.rotation.set( instance.rotation.x, instance.rotation.y, instance.rotation.z );

    return bullet;
}

export function shoot( shooter, scene ) {
    if( shooter.attackCooldown ) return;
    shooter.attackCooldown = true;
    setTimeout(() => {
        shooter.attackCooldown = false;
    }, shooter.shootTimeout * 1000);
    
    let bulletArray = shooter.name == "player" ? ENTITIES.playerBullets : ENTITIES.enemyBullets;

    bulletArray.push({
        name : shooter.name,
        instance : createBullet( shooter.bullet.size , shooter.bullet.color, shooter.bullet.yOffset, shooter.instance, scene ),
        distance : 0, 
        damage : shooter.damage, 
        speed : 5
    });
}

function enemyBullet( bullet, array ) {
    if( detectCollision( bullet.instance, ENTITIES.player.hitbox ) ){
        deleteEntity( bullet, array );

        ENTITIES.player.health -= bullet.damage;

        if( player.health <= 0 ) location.reload();
    }
}

function playerBullet( bullet, array ) {
    for( const enemy of ENTITIES.enemies ) {
        if( !detectCollision( bullet.instance, enemy.instance ) )continue;

        deleteEntity( bullet, array );
        
        enemy.health -= bullet.damage;
        if( enemy.health > 0 ) break;

        deleteEntity( enemy, ENTITIES.enemies );

        return;
    }
}

export function bulletHandler( bullet, array, scene, delta ) {
    if( bullet.name == "player" ) delta *= -1;

    bullet.instance.translateZ( bullet.speed * delta );
    bullet.distance += bullet.speed * delta;
    
    if( detectCollision( bullet.instance, scene.getObjectByName( "ground" ) ) ) {
        deleteEntity( bullet, array );
        return;
    }

    if( bullet.name == "player" ) playerBullet( bullet, array ); else enemyBullet( bullet, array );
    
    if( bullet.distance >= 20 ) deleteEntity( bullet, array );
}

export function createEnemy( scene ) {
    const enemy = JSON.parse(JSON.stringify( ENTITIES.enemyTypes[ Math.floor( Math.random() * ENTITIES.enemyTypes.length )  ] ));

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

    ENTITIES.enemies.push( enemy );
}

export function enemyHandler( scene, delta ) {
    for( const enemy of ENTITIES.enemies ) {
        enemy.instance.rotation.set( 0, 0, 0 );
        enemy.instance.rotation.y = Math.atan2( ( ENTITIES.player.instance.position.x - enemy.instance.position.x ), ( ENTITIES.player.instance.position.z - enemy.instance.position.z ) );

        if( enemy.instance.position.distanceTo( ENTITIES.player.instance.position ) > 3 || enemy.name != "air" ) enemy.instance.translateZ( enemy.speed * delta );

        if( enemy.cameraRotation == "non-restricted" ) enemy.instance.lookAt( ENTITIES.player.instance.position );

        if( enemy.name == "air" ) shoot( enemy, scene );
        else if(  enemy.attackCooldown == false  ) {
            enemy.attackCooldown = true;
            setTimeout( () => {
                enemy.attackCooldown = false;
            }, 3000);

            const enemyBB = new THREE.Box3().setFromObject( enemy.instance );
            const playerBB = new THREE.Box3().setFromObject( ENTITIES.player.hitbox );
            const collision = enemyBB.intersectsBox( playerBB );

            if( !collision ) continue;
            
            ENTITIES.player.health -= 1;
            if( ENTITIES.player.health > 0 ) continue;
            
            location.reload;
        }
    }
}
