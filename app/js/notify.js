const passwordInput = document.querySelector("#password-input");
const passwordInput2 = document.querySelector("#password-input-2");
const browseBtn = document.querySelector("#selectFileBtn");
const successSfx = new Audio("./sfx/success.mp3");
const errorSfx = new Audio("./sfx/failure.mp3");
let soundsEnabled = true;

function playSound(sound) {
    if (soundsEnabled) {
        sound.play().catch(err => console.error("Error playing sound:", err));
    }
}

function addTemporaryClass(element, className, duration = 500) {
    playSound(errorSfx);
    element.classList.add(className);
    setTimeout(() => element.classList.remove(className), duration);
}

export const noFilesSelected = () => addTemporaryClass(browseBtn, "flash-file-select", 1500);
export const passwordError = () => addTemporaryClass(passwordInput, "shake-password-box");
export const passwordError2 = () => addTemporaryClass(passwordInput2, "shake-password-box");

// Core notification function
export async function alert(type, message) {
    if (type === "success" || type === "mixed") {
        playSound(successSfx);
    } else if (type === "error") {
        playSound(errorSfx);
    }

    return ipcExposed.invoke("notify", { type, message });
}

export function toggleSounds(enabled) {
    soundsEnabled = enabled;
    return soundsEnabled;
}

// Error handling utilities
export function determineErrorReason(errorMessage) {
    if (errorMessage.includes("already encrypted")) return "already_encrypted";
    if (errorMessage.includes("not encrypted")) return "not_encrypted";
    if (errorMessage.includes("invalid signature")) return "invalid_signature";
    // Node.js crypto specific error patterns for wrong password
    if (errorMessage.includes("Unsupported state") ||
        errorMessage.includes("authenticate") ||
        errorMessage.includes("Authentication failed") ||
        errorMessage.includes("auth tag")) return "wrong_password";
    if (errorMessage.includes("corrupted")) return "corrupted_file";
    return "unknown";
}

function getErrorMessage(reason, isEncryption, count = 1, forMixedResults = false) {
    const isSingle = count === 1;
    const prefix = forMixedResults ? `${count} file${isSingle ? '' : 's'} failed: ` : '';

    const messages = {
        already_encrypted: {
            single: forMixedResults ? "1 file failed: already encrypted." : "File is already encrypted.",
            multiple: forMixedResults ? `${prefix}already encrypted.` : `${count} files are already encrypted.`
        },
        not_encrypted: {
            single: forMixedResults ? "1 file failed: not encrypted." : "File is not encrypted.",
            multiple: forMixedResults ? `${prefix}not encrypted.` : `${count} files are not encrypted.`
        },
        invalid_signature: {
            single: forMixedResults ? "1 file failed: invalid signature." : "File has an invalid signature.",
            multiple: forMixedResults ? `${prefix}invalid signature.` : `${count} files have invalid signatures.`
        },
        wrong_password: {
            single: forMixedResults ? "1 file failed: wrong password." : "Wrong password for this file.",
            multiple: forMixedResults ? `${prefix}wrong password.` : `Wrong password for ${count} files.`
        },
        corrupted_file: {
            single: forMixedResults ? "1 file failed: corrupted." : "File is corrupted.",
            multiple: forMixedResults ? `${prefix}corrupted.` : `${count} files are corrupted.`
        },
        wrong_password_or_corrupted: {
            single: isEncryption
                ? (forMixedResults ? "1 file failed: corrupted." : "File is corrupted.")
                : (forMixedResults ? "1 file failed: wrong password or corrupted." : "Wrong password or file is corrupted."),
            multiple: isEncryption
                ? (forMixedResults ? `${prefix}corrupted.` : `${count} files are corrupted.`)
                : (forMixedResults ? `${prefix}wrong password or corrupted.` : `Wrong password or ${count} files are corrupted.`)
        },
        unknown: {
            single: forMixedResults ? "1 file failed: unknown error." : "Unknown error occurred.",
            multiple: forMixedResults ? `${prefix}unknown error.` : `Unknown error occurred with ${count} files.`
        }
    };

    return messages[reason][isSingle ? "single" : "multiple"];
}

export const groupFailuresByReason = failures =>
    failures.reduce((groups, failure) => {
        const reason = failure.reason;
        if (!groups[reason]) groups[reason] = [];
        groups[reason].push(failure);
        return groups;
    }, {});

async function handleAllSuccess(success, operationType) {
    const operation = operationType === "encrypt-file" ? "encrypted" : "decrypted";
    const message = `${success.length} file${success.length === 1 ? '' : 's'} successfully ${operation}.`;
    await alert("success", message);
}

async function handleAllFailures(failures, isEncryption) {
    const failuresByReason = groupFailuresByReason(failures);

    if (Object.keys(failuresByReason).length === 1) {
        const reason = Object.keys(failuresByReason)[0];
        const count = failuresByReason[reason].length;
        await alert("error", getErrorMessage(reason, isEncryption, count));
        return;
    }

    await alert("error", `Failed to process ${failures.length} files due to various errors.`);
}

async function handleMixedResults(success, failures, operation, isEncryption) {
    const successPart = `${success.length} file${success.length === 1 ? '' : 's'} successfully ${operation}.`;
    const failuresByReason = groupFailuresByReason(failures);

    if (Object.keys(failuresByReason).length === 1) {
        const reason = Object.keys(failuresByReason)[0];
        const count = failuresByReason[reason].length;
        const failurePart = getErrorMessage(reason, isEncryption, count, true);
        await alert("mixed", `${successPart}\n${failurePart}`);
        return;
    }

    const failurePart = `${failures.length} file${failures.length === 1 ? '' : 's'} failed due to ${failures.length === 1 ? 'an error' : 'various errors'}.`;
    await alert("mixed", `${successPart}\n${failurePart}`);
}

export async function showCombinedResults(results, operationType) {
    const { success, failure } = results;
    const isEncryption = operationType === "encrypt-file";
    const operation = isEncryption ? "encrypted" : "decrypted";

    if (failure.length === 0) return handleAllSuccess(success, operationType);
    if (success.length === 0) return handleAllFailures(failure, isEncryption);
    return handleMixedResults(success, failure, operation, isEncryption);
} 