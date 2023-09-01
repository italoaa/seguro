use anyhow::anyhow;
use chacha20poly1305::{aead::stream, KeyInit, XChaCha20Poly1305};
use rand::{rngs::OsRng, RngCore};
use std::{
    fs::File,
    io::{Read, Write},
};
use zeroize::Zeroize;

// ------------------------------

pub struct Password {
    pub hash: Vec<u8>,
    pub salt: [u8; 32],
}

impl Password {
    pub fn new(password: &str) -> Password {
        // Initializes the argon2 config
        let config = argon2::Config {
            variant: argon2::Variant::Argon2id, // This variant is a balance for good performace
            hash_length: 32,
            lanes: 8,
            mem_cost: 16 * 1024,
            time_cost: 8,
            ..Default::default()
        };

        // Makes the buffer for the salt and the nonce
        let mut salt = [0u8; 32];

        // This fills both of them with Random bytes
        OsRng.fill_bytes(&mut salt);

        let hash = argon2::hash_raw(password.as_bytes(), &salt, &config).unwrap();
        Password { hash: hash, salt: salt }
    }
    
    pub fn new_with_salt(password: &str, salt: &[u8; 32]) -> Password {
        // Initializes the argon2 config
        let config = argon2::Config {
            variant: argon2::Variant::Argon2id, // This variant is a balance for good performace
            hash_length: 32,
            lanes: 8,
            mem_cost: 16 * 1024,
            time_cost: 8,
            ..Default::default()
        };

        let hash = argon2::hash_raw(password.as_bytes(), salt, &config).unwrap();
        Password { hash: hash, salt: salt.clone() }
    }
}


// encyrpts file with password.
pub fn encrypt_file(
    source_file_path: &str,
    dist_file_path: &str,
    password: &str,
) -> Result<(), anyhow::Error> {
    // Makes the buffer for the salt and the nonce
    let mut salt = [0u8; 32];
    let mut nonce = [0u8; 19];

    // This fills both of them with Random bytes
    OsRng.fill_bytes(&mut salt);
    OsRng.fill_bytes(&mut nonce);

    // Key is a Vec<u8>
    let mut key = Password::new_with_salt(&password, &salt).hash;

    // This sets up the encryption stream
    let aead = XChaCha20Poly1305::new((&key[..32]).into());
    let mut stream_encryptor = stream::EncryptorBE32::from_aead(aead, nonce.as_ref().into());

    // Instantiates the buffer
    const BUFFER_LEN: usize = 500;
    let mut buffer = [0u8; BUFFER_LEN];

    let mut source_file = File::open(source_file_path)?;
    let mut dist_file = File::create(dist_file_path)?;

    // Writes the salt and nonce to the file at the start to later read for decryption
    dist_file.write(&salt)?;
    dist_file.write(&nonce)?;

    // Start encrypting Buffer by buffer
    loop {
        let read_count = source_file.read(&mut buffer)?;

        if read_count == BUFFER_LEN {
            let ciphertext = stream_encryptor
                .encrypt_next(buffer.as_slice())
                .map_err(|err| anyhow!("Error in Encrypting large file: {}", err))?;
            dist_file.write(&ciphertext)?;
        } else {
            let ciphertext = stream_encryptor
                .encrypt_last(&buffer[..read_count])
                .map_err(|err| anyhow!("Error in Encrypting large file: {}", err))?;
            dist_file.write(&ciphertext)?;
            break;
        }
    }

    // Remove the delicate variables from memory
    salt.zeroize();
    nonce.zeroize();
    key.zeroize();

    Ok(())
}

// This function decrypts a file
pub fn decrypt_file(
    encrypted_file_path: &str,
    dist: &str,
    password: &str,
) -> Result<(), anyhow::Error> {
    // Initializes the argon2 config
    let config = argon2::Config {
        variant: argon2::Variant::Argon2id, // This variant is a balance for good performace
        hash_length: 32,
        lanes: 8,
        mem_cost: 16 * 1024,
        time_cost: 8,
        ..Default::default()
    };

    // Makes the buffer for the salt and the nonce
    let mut salt = [0u8; 32];
    let mut nonce = [0u8; 19];

    // Opens the files for writing and reading
    let mut encrypted_file = File::open(encrypted_file_path)?;
    let mut dist_file = File::create(dist)?;

    // Reads the salt first as it was written first
    let mut read_count = encrypted_file.read(&mut salt)?;
    if read_count != salt.len() {
        return Err(anyhow!("Error reading salt."));
    }

    // read the nonce
    read_count = encrypted_file.read(&mut nonce)?;
    if read_count != nonce.len() {
        return Err(anyhow!("Error reading nonce."));
    }

    let mut key = argon2::hash_raw(password.as_bytes(), &salt, &config).unwrap();

    // Sets up the decryption stream
    let aead = XChaCha20Poly1305::new((&key[..32]).into());
    let mut stream_decryptor = stream::DecryptorBE32::from_aead(aead, nonce.as_ref().into());

    // Makes the buffer for reading
    const BUFFER_LEN: usize = 500 + 16;
    let mut buffer = [0u8; BUFFER_LEN];

    // Start decrypting in chuncks
    loop {
        let read_count = encrypted_file.read(&mut buffer)?;

        // If the buffer is full then read again because maybe there is more data
        if read_count == BUFFER_LEN {
            let plaintext = stream_decryptor
                .decrypt_next(buffer.as_slice())
                .map_err(|err| anyhow!("Decrypting large file: {}", err))?;
            dist_file.write(&plaintext)?;
        } else if read_count == 0 {
            break;
        } else {
            let plaintext = stream_decryptor
                .decrypt_last(&buffer[..read_count])
                .map_err(|err| anyhow!("Decrypting large file: {}", err))?;
            dist_file.write(&plaintext)?;
            break;
        }
    }

    // Clear the variables of memory
    salt.zeroize();
    nonce.zeroize();
    key.zeroize();

    Ok(())
}
