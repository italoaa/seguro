// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::api::path;

mod encryption;
use encryption::{decrypt_file, encrypt_file, unzip_folder, zip_folder};

use zeroize::Zeroize;

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
    let desktop: String = match path::desktop_dir() {
        None => {
            panic!("no desktop")
        }
        Some(file) => file.into_os_string().into_string().unwrap(),
    };

    let zip_src = PathBuf::from(desktop.clone() + "/CajaFuerte");
    let zip_dest = PathBuf::from(desktop.clone() + "/CajaFuerte-zip");
    let zip_dest2 = zip_dest.clone();
    let _ = zip_folder(&zip_src, &zip_dest);

    let enc_dest = zip_dest
        .clone()
        .into_os_string()
        .into_string()
        .unwrap()
        .to_string()
        + ".encrypted";
    let enc_src = zip_dest.into_os_string().into_string().unwrap();

    // handle the encryption
    let _ = encrypt_file(&enc_src, &enc_dest, &password).unwrap();

    password.zeroize();
    return 0;
}

// TODO Open valut
#[tauri::command]
fn open_vault(password: &str) -> i32 {
    println!("the password is{}", password);
    return 0;
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
