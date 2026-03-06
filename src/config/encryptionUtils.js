const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Derive a 32-byte key from the ENCRYPTION_KEY env var using SHA-256.
 */
function getKey() {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey || rawKey === "default_dev_key_replace_in_prod") {
    throw new Error(
      "ENCRYPTION_KEY environment variable must be set to a strong secret in production.",
    );
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
function encrypt(plaintext) {
  if (!plaintext) return null;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a string that was encrypted with encrypt().
 * Accepts the iv:authTag:ciphertext format.
 * For backward compatibility, returns unencrypted strings as-is.
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    // Legacy unencrypted token — return as-is for backward compatibility
    return encryptedText;
  }

  const key = getKey();
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = { encrypt, decrypt };
