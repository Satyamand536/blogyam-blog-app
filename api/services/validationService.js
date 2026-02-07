const REGEX = {
    // Supports any valid TLD
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    
    // Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Special
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
    
    // Min 3 chars, contains at least one space (First and Last name)
    FULL_NAME: /^[a-zA-Z]{1,}\s+[a-zA-Z]{1,}.*$/
};

const validateAuthData = (data, isSignup = true) => {
    const errors = [];

    // Email validation (Common for both)
    if (!data.email || !REGEX.EMAIL.test(data.email)) {
        errors.push("Please enter a valid email address.");
    }

    // Password validation
    if (!data.password) {
        errors.push("Password is required.");
    } else if (isSignup && !REGEX.PASSWORD.test(data.password)) {
        errors.push("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
    }

    // Name validation (Signup only)
    if (isSignup) {
        if (!data.name || data.name.length < 3 || !REGEX.FULL_NAME.test(data.name.trim())) {
            errors.push("Please enter your full name (first name and surname)");
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    REGEX,
    validateAuthData
};
