import * as THREE from 'three';
import * as ENTITIES from "./entities.mjs";

export function weaponSwitch( key ) {
    if( key < 1 || key > 2 ) return;
    ENTITIES.player.weapon = key;

    if( key == 1 ) {
        ENTITIES.player.bullet.color = 0xffff00;
        ENTITIES.player.damage -= 4;
    }
    else {
        ENTITIES.player.bullet.color = 0xff8800;
        ENTITIES.player.damage += 4;
    }
}

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

    bullet.translateZ( yOffset );

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

    if( shooter.name == "player" ) {
        const bullet = bulletArray[ bulletArray.length - 1 ];
        bullet.type = shooter.weapon;
        bullet.yVelocity = 7;
        bullet.speed = -5;
    }
}

function enemyBullet( bullet, array, delta ) {
    bullet.instance.translateZ( bullet.speed * delta );
    bullet.distance += bullet.speed * delta;

    if( detectCollision( bullet.instance, ENTITIES.player.hitbox ) ){
        deleteEntity( bullet, array );

        ENTITIES.player.health -= bullet.damage;

        if( ENTITIES.player.health <= 0 ) location.reload();
    }
}

function normalBullet( bullet, delta ) {
    bullet.instance.translateZ( bullet.speed * delta );
    bullet.distance += bullet.speed * delta;
}

function explosion( position ) {
    const explosionMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 1 });
    const explosionGeo = new THREE.CircleGeometry( 1 );
    const explosionMesh = new THREE.Mesh( explosionMat, explosionGeo );
    scene.add( explosionMesh );
    explosionMesh.position.set( position.x, position.y, position.z );

    let size = 0.1;
    setInterval(() => {
        explosionMesh.geometry = new THREE.CircleGeometry( size );
        
        size *= 1.1;

        if( size >= 1 ) {
            explosionMesh.removeFromParent();
            return;
        }

        for( const enemy of ENTITIES.enemies ) {
            if( !detectCollision( explosionMesh, enemy.instance ) )continue;
            explosionMesh.removeFromParent();

            enemy.health -= ENTITIES.player.damage;
            if( enemy.health > 0 ) break;

            deleteEntity( enemy, ENTITIES.enemies );

            return;
        }

    }, 10);
}

function explosiveBullet( bullet, delta ) {
    console.log( bullet.instance.position.y )

    bullet.instance.position.y += bullet.yVelocity * delta;
    bullet.yVelocity -= 9.8 * 2 * delta;

    bullet.instance.translateZ( bullet.speed * delta );
    bullet.distance += bullet.speed * delta;

    if (bullet.instance.position.y <= 0) {
        explosion( bullet.position );
        deleteEntity( bullet, ENTITIES.playerBullets );
    }
}

function playerBullet( bullet, array, delta ) {
    bullet.type == 1 ? normalBullet( bullet, delta ) : explosiveBullet( bullet, delta );

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
    if( detectCollision( bullet.instance, scene.getObjectByName( "ground" ) ) ) {
        deleteEntity( bullet, array );
        return;
    }

    if( bullet.name == "player" ) playerBullet( bullet, array, delta ); else enemyBullet( bullet, array, delta );
    
    if( bullet.distance >= 20 ) deleteEntity( bullet, array );
}

export function createEnemy( scene ) {
    const enemy = JSON.parse(JSON.stringify( ENTITIES.enemyTypes[ Math.floor( Math.random() * ENTITIES.enemyTypes.length )  ] ));

    const enemyGeometry = new THREE.BoxGeometry( enemy.size, enemy.size, enemy.size );
    const enemyMaterial = new THREE.MeshBasicMaterial({ color : enemy.color });
    const enemyInstance = new THREE.Mesh( enemyGeometry, enemyMaterial );
    enemy.instance = enemyInstance;
    scene.add( enemyInstance );

    enemyInstance.position.set( Math.floor( (Math.random() * 6) - 3 ), 1, Math.floor( (Math.random() * 6) - 3 ) )

    if(enemy.name == "air") enemyInstance.position.y = 2;

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
