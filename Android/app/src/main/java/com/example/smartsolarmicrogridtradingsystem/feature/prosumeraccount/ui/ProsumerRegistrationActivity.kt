package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.content.ContextCompat
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.RegisterProsumerRequest
import com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerRepository
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity

/** Native Member 3 registration screen. */
class ProsumerRegistrationActivity : BaseActivity() {

    private lateinit var repository: ProsumerRepository
    private lateinit var submitButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var messageView: TextView
    private lateinit var fields: List<EditText>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_prosumer_registration)
        setupSystemBarPadding(findViewById(R.id.registrationRoot))

        repository = ProsumerRepository(this)
        submitButton = findViewById(R.id.btnRegisterProsumer)
        progressBar = findViewById(R.id.progressRegistration)
        messageView = findViewById(R.id.tvRegistrationMessage)
        fields = listOf(
            findViewById(R.id.etRegistrationNic),
            findViewById(R.id.etRegistrationFullName),
            findViewById(R.id.etRegistrationEmail),
            findViewById(R.id.etRegistrationPhone),
            findViewById(R.id.etRegistrationAddress)
        )
        submitButton.setOnClickListener { submitRegistration() }
    }

    private fun submitRegistration() {
        val nic = fields[0].text.toString().trim()
        val fullName = fields[1].text.toString().trim()
        val email = fields[2].text.toString().trim()
        val phone = fields[3].text.toString().trim().takeIf { it.isNotBlank() }
        val address = fields[4].text.toString().trim().takeIf { it.isNotBlank() }

        val validationMessage = validateRequired(nic, "NIC")
            ?: validateRequired(fullName, "Full name")
            ?: validateRequired(email, "Email")
            ?: validateEmail(email)
        if (validationMessage != null) {
            showMessage(validationMessage, false)
            return
        }

        setLoading(true)
        repository.register(
            RegisterProsumerRequest(nic, fullName, email, phone, address)
        ) { result ->
            setLoading(false)
            when (result) {
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Success -> {
                    showMessage(
                        "Registration successful. Account status: ${displayAccountStatus(result.profile.accountStatus)}. Your profile was saved locally.",
                        true
                    )
                    fields.forEach { it.isEnabled = false }
                    submitButton.isEnabled = false
                    submitButton.text = "Registered"
                }
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Failure -> {
                    showMessage(result.message, false)
                }
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        submitButton.isEnabled = !loading
        fields.forEach { it.isEnabled = !loading }
    }

    private fun showMessage(message: String, success: Boolean) {
        messageView.text = message
        messageView.visibility = View.VISIBLE
        messageView.setTextColor(
            ContextCompat.getColor(this, if (success) android.R.color.holo_green_dark else android.R.color.holo_red_dark)
        )
    }
}
