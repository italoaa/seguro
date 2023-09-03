use anyhow::anyhow;
use anyhow::Error;
use std::fs;
use std::path::PathBuf;
use std::{
    fs::File,
    io::{Read, Write},
};
use tauri::utils::config;
use zeroize::Zeroize;

// Encryption
mod encryption;
use encryption::{decrypt_file, encrypt_file, Password};

mod zipping;
use tauri::api::path;
use zipping::{unzip_folder, zip_folder};

// This is a struct to hold all the filenames for the application
struct Filenames {
    vault_path: PathBuf,
    svault_path: String,
    zipped: PathBuf,
    szipped: String,
    encrypted: String,
}

enum VaultState {
    Open,
    Closed,
}

struct Seguro {
    filenames: Filenames,
    hash_path: PathBuf,
}

impl Seguro {
    pub fn new() -> Seguro {
        match Self::create_config() {
            Err(e) => panic!("cant create config because: {}", e),
            Ok(path) => {
                // Make the path to the hash of the vault
                let mut hash_path = path.clone();
                hash_path.push("hash.txt");

                // Get the vault name
                match Self::get_vault_name() {
                    Err(_) => {
                        // Create the vault
                        panic!("can't get vault name")
                    }
                    Ok(vault_name) => Seguro {
                        filenames: Self::get_filenames(&vault_name),
                        hash_path,
                    },
                }
            }
        }
    }

    pub fn vault_state() -> VaultState {
        match Self::get_vault_name() {
            Err(_) => panic!("Cant get the vault state because cant get the name"), // this should not happen
            Ok(vault_name) => {
                let mut vault_path = path::desktop_dir().unwrap();
                vault_path.push(vault_name.clone() + ".encrypted");
                match File::open(vault_path) {
                    Err(_) => {
                        // Cant open because the file does not exist.
                        return VaultState::Open;
                    }
                    Ok(_) => {
                        return VaultState::Closed;
                    }
                }
            }
        }
    }

    pub fn create_init(vault_name: &str) -> Result<(), Error> {
        let mut init_path: PathBuf = path::config_dir().unwrap();
        init_path.push("Seguro");
        init_path.push("init.txt");
        match File::create(init_path) {
            Err(e) => panic!("error creating init: {}", e),
            Ok(mut init_file) => {
                init_file.write(vault_name.as_bytes())?;
                Ok(())
            }
        }
    }
    fn create_config() -> Result<PathBuf, Error> {
        let mut config: PathBuf = path::config_dir().unwrap(); // Handle the error
        config.push("Seguro");
        match fs::create_dir(config.clone()) {
            Err(e) => match e.kind() {
                std::io::ErrorKind::AlreadyExists => {} // Ignore the exists error
                _ => {
                    panic!("Not recognized error: {}", e)
                }
            },
            Ok(_) => {} // Success so ignore
        }
        Ok(config)
    }

    pub fn get_vault_name() -> Result<String, Error> {
        let mut init_path: PathBuf = path::config_dir().unwrap();
        init_path.push("Seguro");
        init_path.push("init.txt");
        match File::open(init_path) {
            Err(e) => Err(e.into()),
            Ok(mut init_file) => {
                // the file exists so read the name
                let mut name_buf = String::new();
                // read into string
                init_file.read_to_string(&mut name_buf).unwrap();
                return Ok(name_buf);
            }
        }
    }

    fn get_filenames(vault_name: &str) -> Filenames {
        let desktop: String = path::desktop_dir()
            .expect("Can't find the desktop")
            .into_os_string()
            .into_string()
            .unwrap();

        // Define names for vault and zipping
        let mut vault_path: PathBuf = PathBuf::from(desktop);
        vault_path.push(vault_name);

        // Get the string version due to OS
        let svault_path: String = vault_path.clone().into_os_string().into_string().unwrap();

        // Clone the main path and set the extension to zip
        let mut zipped: PathBuf = vault_path.clone();
        zipped.set_extension("zip");

        // Get the string version of the path buf
        let szipped: String = zipped.clone().into_os_string().into_string().unwrap();

        // Clone the main
        let encrypted = svault_path.clone() + ".encrypted";

        return Filenames {
            vault_path,
            svault_path,
            zipped,
            szipped,
            encrypted,
        };
    }

    pub fn save_pass(&self, password: &str) -> Result<(), anyhow::Error> {
        // use argon2 to hash
        let password_fields = Password::new(password);
        let mut hash_file = File::create(
            self.hash_path
                .clone()
                .into_os_string()
                .into_string()
                .unwrap(),
        )
        .unwrap();
        // Write the salt
        hash_file.write(&password_fields.salt)?;

        // Write the hash
        hash_file.write(&password_fields.hash)?;

        Ok(())
    }

    pub fn test_password(&self, password: &str) -> Result<(), anyhow::Error> {
        let mut hash_file = File::open(
            self.hash_path
                .clone()
                .into_os_string()
                .into_string()
                .unwrap(),
        )
        .unwrap();
        let mut salt = [0u8; 32];
        let mut hash = [0u8; 32];

        let mut read_count = hash_file.read(&mut salt)?;
        if read_count != salt.len() {
            return Err(anyhow!("Error reading salt."));
        }
        read_count = hash_file.read(&mut hash)?;
        if read_count != hash.len() {
            return Err(anyhow!("Error reading hash."));
        }

        let new_password_fields = Password::new_with_salt(password, &salt);
        if new_password_fields.hash != hash {
            return Err(anyhow!("Wrong password"));
        }

        Ok(())
    }
}

// TODO: do this in the Seguro implementation
// fn setup_icon() -> u8{
// Command::new("sh").arg("-c").arg("wget ")
// let wget_script = "wget https://raw.githubusercontent.com/mklement0/fileicon/stable/bin/fileicon -P ".to_owned() + sconfig.as_str();
// Command::new("sh").arg("-c").arg("");

// return 0;
// }

// THIS IS FOR TESTING
fn backup_vault(filenames: &Filenames) {
    let mut backup_path = filenames.vault_path.clone();
    backup_path.pop();
    backup_path.push(".".to_owned() + "backup" + ".zip");
    fs::copy(filenames.szipped.clone(), backup_path).unwrap();
}

// Create a vault
#[tauri::command]
pub fn create_vault(mut password: String, vault_name: String) -> i32 {
    // Create a config
    Seguro::create_init(&vault_name).unwrap();

    let seguro = Seguro::new();

    // Safe the password hash when creating a vault
    match seguro.save_pass(&password) {
        Err(_) => return 2, // 2 for error in saving password
        Ok(_) => {
            // Saved the password correctly as a hash
            // Create a Directory in the desktop named 'CajaFuerte'
            // Match on getting the Desktop Directory
            match path::desktop_dir() {
                None => {
                    return 2; // There was no desktop
                }
                Some(mut desktop_path) => {
                    // Found a desktop
                    // Create the directory
                    desktop_path.push(vault_name);
                    match fs::create_dir(desktop_path) {
                        Ok(_) => {
                            password.zeroize(); // Remove the password from memory
                            return 0;
                        }
                        Err(_) => {
                            return 1;
                        }
                    }
                }
            }
        }
    }
}

// Close Valut
#[tauri::command]
pub fn close_vault(mut password: String) -> i32 {
    // Create a config
    let seguro = Seguro::new();

    match seguro.test_password(&password) {
        Err(_) => {
            return 1; // For incorrect
        }
        Ok(_) => {
            match zip_folder(&seguro.filenames.vault_path, &seguro.filenames.zipped) {
                Err(e) => panic!("{}", e),
                Ok(_) => {
                    // handle the encryption
                    match encrypt_file(
                        &seguro.filenames.szipped,
                        &seguro.filenames.encrypted,
                        &password,
                    ) {
                        Err(e) => panic!("{}", e),
                        Ok(_) => {
                            // THIS IS JUST FOR TESTING PURPOSES TO ENSURE THE SAFTY OF THE DATA
                            backup_vault(&seguro.filenames);

                            // We need to clean up and remove the other versions
                            fs::remove_file(&seguro.filenames.szipped).unwrap();
                            fs::remove_dir_all(&seguro.filenames.svault_path).unwrap();
                            // as well as take the password away from memory
                            password.zeroize();
                            return 0;
                        }
                    };
                }
            };
        }
    }
}

// Open valut
#[tauri::command]
pub fn open_vault(mut password: String) -> i32 {
    // Create a config
    let seguro = Seguro::new();

    match seguro.test_password(&password) {
        Err(_) => {
            return 1; // Incorrect Password
        }
        Ok(_) => {
            // Handle decryption
            match decrypt_file(
                &seguro.filenames.encrypted,
                &seguro.filenames.szipped,
                &password,
            ) {
                Err(_) => {
                    // There was something wrong with the decryption
                    // Return and delete the wrong decrypted file
                    fs::remove_file(&seguro.filenames.szipped).unwrap();
                    return 2; // 2 for error
                }
                Ok(_) => {
                    // handle the unzip
                    match unzip_folder(&seguro.filenames.zipped, &seguro.filenames.vault_path) {
                        Err(e) => panic!("{}", e),
                        Ok(_) => {
                            // Clean up
                            fs::remove_file(&seguro.filenames.szipped).unwrap();
                            fs::remove_file(&seguro.filenames.encrypted).unwrap();

                            password.zeroize();
                            return 0;
                        }
                    };
                }
            };
        }
    }
}

// Returns 1 if it does not exist and 0 otherwise
#[tauri::command]
pub fn exists_vault() -> i32 {
    // if there is any error we can say there is no vault
    match Seguro::get_vault_name() {
        Err(_) => return 1, // not exist
        Ok(_) => return 0,  // exists
    }
}

// Returns 0 for closed and 1 for open vault
#[tauri::command]
pub fn get_vault_state() -> i32 {
    match Seguro::vault_state() {
        VaultState::Closed => 0,
        VaultState::Open => 1,
    }
}
