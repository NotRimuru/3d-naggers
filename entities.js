export let player = {
    name : "player",
    damage : 1,
    instance : null,
    hitbox : null,
    health : 10,
    maxhealth: 10,
    stamina : 100,
    attackCooldown : false,
    bullet : {
        size : 0.1,
        color : 0xffff00,
        yOffset : 0.1
    },
    shootTimeout : 0.3
}

export const enemyTypes = [
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
        attackCooldown : false,
        shootTimeout : 3
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
        attackCooldown : false,
        shootTimeout : 3
    },
    
    {
        name : "air",
        damage : 1,
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
        },
        shootTimeout : 3
    }
]

export let enemies = new Array();

export let playerBullets = new Array();
export let enemyBullets = new Array();
