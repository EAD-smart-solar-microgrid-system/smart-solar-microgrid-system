package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.validation.AccountInputValidator
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request.RegisterProsumerRequestDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerProfileResponseDto
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.data.ProsumerAccountRepository
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

        etNic.doAfterTextChanged { tilNic.error = null }
        etName.doAfterTextChanged { tilName.error = null }
        etEmail.doAfterTextChanged { tilEmail.error = null }
        etPhone.doAfterTextChanged { tilPhone.error = null }
        etAddress.doAfterTextChanged { tilAddress.error = null }

        btnSubmit.setOnClickListener {
            val nic = AccountInputValidator.normalizeNic(etNic.text?.toString())
            val name = etName.text?.toString()?.trim().orEmpty()
            val email = etEmail.text?.toString()?.trim().orEmpty()
            val phone = etPhone.text?.toString()?.trim()
            val address = etAddress.text?.toString()?.trim()

            tilNic.error = null
            tilName.error = null
            tilEmail.error = null
            tilPhone.error = null
            tilAddress.error = null
            tvError.visibility = View.GONE

            val validation = AccountInputValidator.validateProsumerRegistration(
                nic = nic,
                fullName = name,
                email = email,
                phone = phone,
                address = address
            )
            tilNic.error = validation.nic
            tilName.error = validation.fullName
            tilEmail.error = validation.email
            tilPhone.error = validation.phone
            tilAddress.error = validation.address

            if (validation.hasErrors) {
                when {
                    validation.nic != null -> etNic.requestFocus()
                    validation.fullName != null -> etName.requestFocus()
                    validation.email != null -> etEmail.requestFocus()
                    validation.phone != null -> etPhone.requestFocus()
                    validation.address != null -> etAddress.requestFocus()
                }
                return@setOnClickListener
            }

            btnSubmit.isEnabled = false
            pbLoading.visibility = View.VISIBLE

            val request = RegisterProsumerRequestDto(
                nic = nic,
                fullName = name,
                email = email,
                phoneNumber = if (phone.isNullOrBlank()) null else AccountInputValidator.normalizePhone(phone),
                address = if (address.isNullOrBlank()) null else address
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
                    if (message.contains("NIC already exists", ignoreCase = true) ||
                        message.contains("with this NIC already exists", ignoreCase = true)
                    ) {
                        tilNic.error = message
                        etNic.requestFocus()
                    }
                    tvError.text = message
                    tvError.visibility = View.VISIBLE
                }
            })
        }
    }
}
