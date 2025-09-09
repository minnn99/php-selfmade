// Generate a consistent encryption key based on browser fingerprint
const generateEncryptionKey = (): string => {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    window.location.hostname
  ].join('|');
  
  // Simple hash function (not cryptographically secure but better than plain text)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

// Simple XOR encryption (lightweight alternative to AES)
const xorEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  // Use btoa with proper UTF-8 encoding
  try {
    return btoa(unescape(encodeURIComponent(result)));
  } catch {
    // Fallback: convert to hex if btoa fails
    return Array.from(result)
      .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  }
};

const xorDecrypt = (encryptedText: string, key: string): string => {
  try {
    let decoded: string;
    
    // Check if it's base64 or hex
    if (/^[0-9a-fA-F]+$/.test(encryptedText) && encryptedText.length % 2 === 0) {
      // Hex format
      decoded = '';
      for (let i = 0; i < encryptedText.length; i += 2) {
        decoded += String.fromCharCode(parseInt(encryptedText.substring(i, i + 2), 16));
      }
    } else {
      // Base64 format
      const base64Decoded = atob(encryptedText);
      decoded = decodeURIComponent(Array.from(base64Decoded, c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
    }
    
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return encryptedText; // Return original if decryption fails
  }
};

// Encrypt data
export const encryptData = (data: string): string => {
  try {
    const key = generateEncryptionKey();
    const encrypted = xorEncrypt(data, key);
    return 'enc:' + encrypted; // Add prefix to identify encrypted data
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Fallback to unencrypted data
  }
};

// Decrypt data
export const decryptData = (encryptedData: string): string => {
  try {
    if (!encryptedData.startsWith('enc:')) {
      return encryptedData; // Not encrypted
    }
    const key = generateEncryptionKey();
    const dataWithoutPrefix = encryptedData.substring(4); // Remove 'enc:' prefix
    return xorDecrypt(dataWithoutPrefix, key);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Return original if decryption fails
  }
};

// Check if data is encrypted
export const isEncrypted = (data: string): boolean => {
  return data.startsWith('enc:');
};