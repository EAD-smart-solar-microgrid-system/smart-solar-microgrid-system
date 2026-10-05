package com.example.smartsolarmicrogridtradingsystem.core.validation

object AccountInputValidator {
    const val IDENTIFIER_MAX_LENGTH = 254
    const val PASSWORD_MAX_LENGTH = 128
    const val FULL_NAME_MAX_LENGTH = 100
    const val EMAIL_MAX_LENGTH = 254
    const val PHONE_MAX_LENGTH = 20
    const val ADDRESS_MAX_LENGTH = 250

    private val oldNicPattern = Regex("^\\d{9}[VX]$")
    private val newNicPattern = Regex("^\\d{12}$")
    private val emailPattern = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    private val phonePattern = Regex("^(0\\d{9}|\\+94\\d{9})$")

    data class ProsumerRegistrationErrors(
        val nic: String? = null,
        val fullName: String? = null,
        val email: String? = null,
        val phone: String? = null,
        val address: String? = null
    ) {
        val hasErrors: Boolean
            get() = listOf(nic, fullName, email, phone, address).any { it != null }
    }

    fun normalizeNic(value: String?): String = value.orEmpty().trim().uppercase()

    fun nicError(value: String?): String? {
        val nic = normalizeNic(value)
        if (nic.isEmpty()) return "NIC is required"
        return if (oldNicPattern.matches(nic) || newNicPattern.matches(nic)) {
            null
        } else {
            "Enter 9 digits followed by V/X, or 12 digits"
        }
    }

    fun fullNameError(value: String?): String? {
        val name = value.orEmpty().trim()
        if (name.isEmpty()) return "Full name is required"
        return if (name.length in 2..FULL_NAME_MAX_LENGTH) null
        else "Full name must be between 2 and $FULL_NAME_MAX_LENGTH characters"
    }

    fun emailError(value: String?): String? {
        val email = value.orEmpty().trim()
        if (email.isEmpty()) return "Email is required"
        if (email.length > EMAIL_MAX_LENGTH) return "Email must not exceed $EMAIL_MAX_LENGTH characters"
        return if (emailPattern.matches(email)) null else "Enter a valid email address"
    }

    fun normalizePhone(value: String?): String = value.orEmpty().trim().replace(Regex("[\\s-]"), "")

    fun optionalPhoneError(value: String?): String? {
        val rawPhone = value.orEmpty().trim()
        if (rawPhone.isEmpty()) return null
        if (rawPhone.length > PHONE_MAX_LENGTH) return "Phone number must not exceed $PHONE_MAX_LENGTH characters"
        return if (phonePattern.matches(normalizePhone(rawPhone))) null
        else "Use 0712345678 or +94712345678"
    }

    fun optionalAddressError(value: String?): String? {
        val address = value.orEmpty().trim()
        if (address.isEmpty()) return null
        return if (address.length in 5..ADDRESS_MAX_LENGTH) null
        else "Address must be between 5 and $ADDRESS_MAX_LENGTH characters"
    }

    fun loginIdentifierError(value: String?): String? {
        val identifier = value.orEmpty().trim()
        if (identifier.isEmpty()) return "Username or email is required"
        return if (identifier.length <= IDENTIFIER_MAX_LENGTH) null
        else "Username or email must not exceed $IDENTIFIER_MAX_LENGTH characters"
    }

    fun loginPasswordError(value: String?): String? {
        val password = value.orEmpty()
        if (password.isEmpty()) return "Password is required"
        return if (password.length <= PASSWORD_MAX_LENGTH) null
        else "Password must not exceed $PASSWORD_MAX_LENGTH characters"
    }

    fun validateProsumerRegistration(
        nic: String?,
        fullName: String?,
        email: String?,
        phone: String?,
        address: String?
    ) = ProsumerRegistrationErrors(
        nic = nicError(nic),
        fullName = fullNameError(fullName),
        email = emailError(email),
        phone = optionalPhoneError(phone),
        address = optionalAddressError(address)
    )
}
