const applicationInfo = require('../../applications/API/_application.json');
var crypto = require('crypto');
var forge = require('node-forge');

module.exports = {
    // public_key/private key Gen
     genPriPubKey : function () { // 공개/개인키 생성
        return crypto.generateKeyPairSync('rsa', {
            modulusLength: 1024,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: applicationInfo.passphrase
            }
        });
    },

    encryptByPubKey : function(publicKey, str) { // 공개키로 암호화

        // Public key로 암호화
        // console.log(`${str} \r\n`);
        // console.log("public Key로 암호화");
        const enc = crypto.publicEncrypt(publicKey, Buffer.from(str));
        const encstr = enc.toString("base64");
        // console.log(encstr);

        return encstr;
    },

    decryptByPubKey : function(publicKey, str) { // 공개키로 복호화

        // console.log("public Key로 복호화");
        const enc2 = crypto.publicDecrypt(publicKey, Buffer.from(str, "base64"));
        const encstr2 = enc2.toString("utf8");
        // console.log(encstr2);

        return encstr2;
    },

    encryptByPriKey : function(privateKey, str) { // 개인키로 암호화

        // console.log("private Key로 암호화");
        const keyp = crypto.createPrivateKey({
            key: privateKey,
            format: "pem",
            passphrase: applicationInfo.passphrase      
        });    
        const dec2 = crypto.privateEncrypt(keyp, Buffer.from(str));
        const decstr2 = dec2.toString("base64");
        // console.log(decstr2);

        return decstr2;
    },

    decryptByPriKey : function(privateKey, str) { // 개인키로 복호화
        
        // console.log("private Key로 복호화");
        const key = crypto.createPrivateKey({
            key: privateKey,
            format: "pem",
            passphrase: applicationInfo.passphrase      
        });
        const dec = crypto.privateDecrypt(key, Buffer.from(str, "base64"));
        const decstr = dec.toString("utf8");
        // console.log(decstr);

        return decstr;
    },

    regenerateFromPrivateKey: function(privateKey) { //개인키로 재생성
		var privateKey = forge.pki.encryptedPrivateKeyFromPem(privateKey);
		var decryptedPrivateKey = forge.pki.decryptPrivateKeyInfo(privateKey, applicationInfo.passphrase);
        var forgePrivateKey = forge.pki.privateKeyFromAsn1(decryptedPrivateKey);
		var forgePublicKey = forge.pki.setRsaPublicKey(forgePrivateKey.n, forgePrivateKey.e);
		
        return forge.pki.publicKeyToPem(forgePublicKey).replace(/\r/g, '');
    }
    
};