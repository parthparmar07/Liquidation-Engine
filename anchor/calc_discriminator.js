const crypto = require('crypto');

function getDiscriminator(name) {
    const preimage = `global:${name}`;
    const hash = crypto.createHash('sha256').update(preimage).digest();
    const discriminator = [];
    for (let i = 0; i < 8; i++) {
        discriminator.push(hash[i]);
    }
    console.log(`Discriminator for ${name}:`);
    console.log(`As Array: [${discriminator.join(", ")}]`);
}

getDiscriminator("liquidate_full");
