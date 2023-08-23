// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::api::path;

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
fn close_vault(password: &str) -> i32 {
    println!("{}", password);
    return 0;
}

// Open valut
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
