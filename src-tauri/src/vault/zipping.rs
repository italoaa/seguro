use zip_extensions::*;
use std::path::PathBuf;

// Zips a folder
pub fn zip_folder(source: &PathBuf, dest: &PathBuf) -> Result<(), anyhow::Error> {
    Ok(zip_create_from_directory(dest, source)?)
}

// Unzips a folder
pub fn unzip_folder(source: &PathBuf, dest: &PathBuf) -> Result<(), anyhow::Error> {
    Ok(zip_extract(source, dest)?)
}
