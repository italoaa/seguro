// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::api::path;

mod encryption;
use encryption::{decrypt_file, encrypt_file, unzip_folder, zip_folder};
use zeroize::Zeroize;

const VAULT_NAME: &str = "CajaFuerte";

struct Filenames {
    vault_path: PathBuf, // The pathBuffer for the original vault
    zipped: PathBuf,
    szipped: String,
    encrypted: String,
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
        zipped,
        szipped,
        encrypted,
    };
}

// Create a vault
#[tauri::command]
fn create_vault() -> i32 {
    // Create a Directory in the desktop named 'CajaFuerte'
    // Match on getting the Desktop Directory
    match path::desktop_dir() {
        None => {
            return 2;
        }
        Some(mut desktop_path) => {
            // Create the directory
            desktop_path.push("CajaFuerte");
            match fs::create_dir(desktop_path) {
                Ok(_) => {
                    return 0;
                }
                Err(_) => {
                    return 1;
                }
            }
        }
    }
}

// Close Valut
#[tauri::command]
fn close_vault(mut password: String) -> i32 {
    // Handle Zip
    let filenames: Filenames = get_filenames(VAULT_NAME);

    // println!(
    //     "1. {}\n2. {}\n3. {}",
    //     filenames.vault_path.into_os_string().into_string().unwrap(),
    //     filenames.szipped,
    //     filenames.encrypted
    // );
    // return 0;

    match zip_folder(&filenames.vault_path, &filenames.zipped) {
        Err(e) => panic!("{}", e),
        Ok(_) => {
            // handle the encryption
            match encrypt_file(&filenames.szipped, &filenames.encrypted, &password) {
                Err(e) => panic!("{}", e),
                Ok(_) => {
                    password.zeroize();
                    return 0;
                }
            };
        }
    };
}

// Open valut
#[tauri::command]
fn open_vault(mut password: String) -> i32 {
    // Get the filenames
    let filenames: Filenames = get_filenames(VAULT_NAME);

    // Handle decryption
    match decrypt_file(&filenames.encrypted, &filenames.szipped, &password) {
        Err(e) => panic!("{}", e),
        Ok(_) => {
            // handle the unzip
            match unzip_folder(&filenames.zipped, &filenames.vault_path) {
                Err(e) => panic!("{}", e),
                Ok(_) => {
                    password.zeroize();
                    return 0;
                }
            };
        }
    };
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_vault,
            open_vault,
            close_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
