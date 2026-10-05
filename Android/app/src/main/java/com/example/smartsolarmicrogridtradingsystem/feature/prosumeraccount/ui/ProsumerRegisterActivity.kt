package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request.RegisterProsumerRequestDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerProfileResponseDto
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.data.ProsumerAccountRepository
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.util.ProsumerValidationUtil
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

/**
 * Activity for registering a new Solar Prosumer with their National Identity Card (NIC).
 * Sends registration to POST /api/prosumers/register and informs the user of Pending Activation status.
 */
class ProsumerRegisterActivity : AppCompatActivity() {

    private val repository = ProsumerAccountRepository.getInstance()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_prosumer_register)

        findViewById<MaterialToolbar>(R.id.toolbarRegister).setNavigationOnClickListener {
            finish()
        }

        val tilNic = findViewById<TextInputLayout>(R.id.tilRegisterNic)
        val etNic = findViewById<TextInputEditText>(R.id.etRegisterNic)
        val tilName = findViewById<TextInputLayout>(R.id.tilRegisterName)
        val etName = findViewById<TextInputEditText>(R.id.etRegisterName)
        val tilEmail = findViewById<TextInputLayout>(R.id.tilRegisterEmail)
        val etEmail = findViewById<TextInputEditText>(R.id.etRegisterEmail)
        val tilPhone = findViewById<TextInputLayout>(R.id.tilRegisterPhone)
        val etPhone = findViewById<TextInputEditText>(R.id.etRegisterPhone)
        val tilAddress = findViewById<TextInputLayout>(R.id.tilRegisterAddress)
        val etAddress = findViewById<TextInputEditText>(R.id.etRegisterAddress)

        val tvError = findViewById<TextView>(R.id.tvRegisterError)
        val pbLoading = findViewById<ProgressBar>(R.id.pbRegisterLoading)
        val btnSubmit = findViewById<MaterialButton>(R.id.btnRegisterSubmit)
        val tvToLogin = findViewById<TextView>(R.id.tvToLogin)

        tvToLogin.setOnClickListener {
            finish()
        }

        btnSubmit.setOnClickListener {
            val rawNic = etNic.text?.toString()?.trim().orEmpty()
            val rawName = etName.text?.toString()?.trim().orEmpty()
            val rawEmail = etEmail.text?.toString()?.trim().orEmpty()
            val rawPhone = etPhone.text?.toString()?.trim().orEmpty()
            val rawAddress = etAddress.text?.toString()?.trim().orEmpty()

            tilNic.error = null
            tilName.error = null
            tilEmail.error = null
            tilPhone.error = null
            tilAddress.error = null
            tvError.visibility = View.GONE

            var hasError = false

            // NIC validation (required, Sri Lankan old/new NIC format)
            if (rawNic.isEmpty()) {
                tilNic.error = getString(R.string.error_nic_required)
                hasError = true
            } else if (!ProsumerValidationUtil.isValidNic(rawNic)) {
                tilNic.error = getString(R.string.error_nic_invalid)
                hasError = true
            }

            // Full Name validation (required, length >= 2, valid human name characters)
            if (rawName.isEmpty()) {
                tilName.error = getString(R.string.error_name_required)
                hasError = true
            } else if (rawName.length < 2) {
                tilName.error = getString(R.string.error_name_too_short)
                hasError = true
            } else if (!ProsumerValidationUtil.isValidFullName(rawName)) {
                tilName.error = getString(R.string.error_name_invalid)
                hasError = true
            }

            // Email validation (required, valid email address)
            if (rawEmail.isEmpty()) {
                tilEmail.error = getString(R.string.error_email_required)
                hasError = true
            } else if (!ProsumerValidationUtil.isValidEmail(rawEmail)) {
                tilEmail.error = getString(R.string.error_email_invalid)
                hasError = true
            }

            // Phone validation (optional field, validated when provided)
            if (rawPhone.isNotEmpty() && !ProsumerValidationUtil.isValidPhoneNumber(rawPhone)) {
                tilPhone.error = getString(R.string.error_phone_invalid)
                hasError = true
            }

            // Address validation (optional field, max length check)
            if (rawAddress.isNotEmpty() && !ProsumerValidationUtil.isValidAddress(rawAddress)) {
                tilAddress.error = getString(R.string.error_address_too_long)
                hasError = true
            }

            if (hasError) return@setOnClickListener

            btnSubmit.isEnabled = false
            pbLoading.visibility = View.VISIBLE

            val normalizedNic = ProsumerValidationUtil.normalizeNic(rawNic)
            val request = RegisterProsumerRequestDto(
                nic = normalizedNic,
                fullName = rawName,
                email = rawEmail,
                phoneNumber = if (rawPhone.isBlank()) null else rawPhone,
                address = if (rawAddress.isBlank()) null else rawAddress
            )

            repository.registerProsumer(request, object : ApiCallback<ProsumerProfileResponseDto> {
                override fun onSuccess(result: NetworkResult.Success<ProsumerProfileResponseDto>) {
                    pbLoading.visibility = View.GONE
                    btnSubmit.isEnabled = true

                    AlertDialog.Builder(this@ProsumerRegisterActivity)
                        .setTitle("Registration Successful")
                        .setMessage(getString(R.string.msg_registration_pending))
                        .setPositiveButton("Sign In") { _, _ ->
                            finish()
                        }
                        .setCancelable(false)
                        .show()
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    pbLoading.visibility = View.GONE
                    btnSubmit.isEnabled = true

                    val message = ProsumerAccountRepository.extractErrorMessage(error)
                    tvError.text = message
                    tvError.visibility = View.VISIBLE
                }
            })
        }
    }
}
