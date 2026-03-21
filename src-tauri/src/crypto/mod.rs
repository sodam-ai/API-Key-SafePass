use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::RngCore;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("암호화에 실패했습니다")]
    EncryptionFailed,
    #[error("복호화에 실패했습니다")]
    DecryptionFailed,
    #[error("비밀번호 해시 생성에 실패했습니다")]
    HashFailed,
    #[error("비밀번호가 올바르지 않습니다")]
    InvalidPassword,
}

/// Derive a 256-bit encryption key from the master password using Argon2id.
/// The salt is fixed per vault (stored in DB) so the same password always produces the same key.
pub fn derive_encryption_key(password: &str, salt: &[u8]) -> Result<[u8; 32], CryptoError> {
    use argon2::Argon2;

    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|_| CryptoError::HashFailed)?;
    Ok(key)
}

/// Hash a master password for verification (stored in DB).
pub fn hash_password(password: &str) -> Result<String, CryptoError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|_| CryptoError::HashFailed)?;
    Ok(hash.to_string())
}

/// Verify a password against a stored hash.
pub fn verify_password(password: &str, hash: &str) -> Result<bool, CryptoError> {
    let parsed = PasswordHash::new(hash).map_err(|_| CryptoError::InvalidPassword)?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

/// Encrypt a plaintext API key value using AES-256-GCM.
/// Returns a base64 string containing: nonce (12 bytes) + ciphertext.
pub fn encrypt_value(plaintext: &str, key: &[u8; 32]) -> Result<String, CryptoError> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| CryptoError::EncryptionFailed)?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|_| CryptoError::EncryptionFailed)?;

    // Prepend nonce to ciphertext
    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(&combined))
}

/// Decrypt an AES-256-GCM encrypted value.
pub fn decrypt_value(encrypted: &str, key: &[u8; 32]) -> Result<String, CryptoError> {
    let combined = BASE64
        .decode(encrypted)
        .map_err(|_| CryptoError::DecryptionFailed)?;

    if combined.len() < 13 {
        return Err(CryptoError::DecryptionFailed);
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| CryptoError::DecryptionFailed)?;
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| CryptoError::DecryptionFailed)?;

    String::from_utf8(plaintext).map_err(|_| CryptoError::DecryptionFailed)
}

/// Generate a random salt for key derivation (16 bytes).
pub fn generate_salt() -> Vec<u8> {
    let mut salt = vec![0u8; 16];
    OsRng.fill_bytes(&mut salt);
    salt
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify_password() {
        let password = "test_master_password_123!";
        let hash = hash_password(password).unwrap();
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_encrypt_decrypt() {
        let salt = generate_salt();
        let key = derive_encryption_key("my_password", &salt).unwrap();
        let plaintext = "sk-1234567890abcdef";

        let encrypted = encrypt_value(plaintext, &key).unwrap();
        assert_ne!(encrypted, plaintext);

        let decrypted = decrypt_value(&encrypted, &key).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_wrong_key_fails() {
        let salt = generate_salt();
        let key1 = derive_encryption_key("password1", &salt).unwrap();
        let key2 = derive_encryption_key("password2", &salt).unwrap();

        let encrypted = encrypt_value("secret", &key1).unwrap();
        assert!(decrypt_value(&encrypted, &key2).is_err());
    }
}
