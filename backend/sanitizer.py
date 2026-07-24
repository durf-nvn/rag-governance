import re
from typing import Tuple

# Common prompt injection signatures to block
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules|prompts)",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)",
    r"forget\s+(all\s+)?(previous|prior|above)\s+(instructions|directives|rules)",
    r"bypass\s+(role|access|restriction|filter|security)",
    r"override\s+(role|access|restriction|filter|security)",
    r"(print|show|output|reveal|dump|display|repeat)\s+(the\s+)?(system|developer|hidden)\s+(prompt|instructions|rules)",
    r"act\s+as\s+an?\s+(admin|administrator|superuser|root|developer|system)",
    r"jailbreak",
    r"dan\s+mode",
    r"unrestricted\s+mode",
    r"\[system\]",
    r"\[developer\]",
    r"---+\s*end\s+of\s+user\s+question\s*---+",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in PROMPT_INJECTION_PATTERNS]

def sanitize_user_input(text: str) -> str:
    """
    Cleans raw user input text to prevent prompt injection and character exploits.
    - Strips null bytes and control characters
    - Normalizes whitespace
    - Limits maximum length (prevents context window overflow attacks)
    """
    if not text:
        return ""
    
    # 1. Remove null bytes and non-printable control characters (keep standard newlines/tabs)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # 2. Collapse excessive whitespace
    cleaned = re.sub(r'[ \t]+', ' ', cleaned)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    # 3. Truncate to maximum 1000 characters to prevent buffer overflow/context stuffing
    return cleaned.strip()[:1000]

def check_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Scans input for prompt injection signatures.
    Returns (is_injection_detected, matched_pattern_reason).
    """
    sanitized = sanitize_user_input(text)
    
    for pattern in COMPILED_PATTERNS:
        if pattern.search(sanitized):
            return True, "Potential prompt injection or instruction override attempt detected."

    return False, ""
