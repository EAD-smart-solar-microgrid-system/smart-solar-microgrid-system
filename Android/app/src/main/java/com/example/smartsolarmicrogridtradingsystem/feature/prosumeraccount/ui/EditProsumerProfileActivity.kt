package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.UpdateProsumerRequest
import com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerRepository
import com.example.smartsolarmicrogridtradingsystem.domain.model.ProsumerProfile
import com.example.smartsolarmicrogridtradingsystem.shared.component.BaseActivity

/** Native Member 3 edit screen; NIC and account status remain server-owned. */
class EditProsumerProfileActivity : BaseActivity() {

    private lateinit var repository: ProsumerRepository
    private lateinit var nicField: EditText
    private lateinit var fullNameField: EditText
    private lateinit var emailField: EditText
    private lateinit var phoneField: EditText
    private lateinit var addressField: EditText
    private lateinit var messageView: TextView
    private lateinit var saveButton: Button
    private lateinit var cancelButton: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_edit_prosumer_profile)
        setupSystemBarPadding(findViewById(R.id.editProfileRoot))

        repository = ProsumerRepository(this)
        nicField = findViewById(R.id.etEditNic)
        fullNameField = findViewById(R.id.etEditFullName)
        emailField = findViewById(R.id.etEditEmail)
        phoneField = findViewById(R.id.etEditPhone)
        addressField = findViewById(R.id.etEditAddress)
        messageView = findViewById(R.id.tvEditMessage)
        saveButton = findViewById(R.id.btnSaveEdit)
        cancelButton = findViewById(R.id.btnCancelEdit)
        progressBar = findViewById(R.id.progressEdit)
        cancelButton.setOnClickListener { finish() }
        saveButton.setOnClickListener { saveProfile() }
        loadProfile()
    }

    private fun loadProfile() {
        setLoading(true)
        repository.getCurrent { result ->
            setLoading(false)
            when (result) {
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Success -> populate(result.profile)
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Failure -> {
                    repository.getCached { cached ->
                        if (cached != null) {
                            populate(cached)
                            showMessage("Showing cached data. ${result.message}")
                        } else {
                            showMessage(result.message)
                            saveButton.isEnabled = false
                        }
                    }
                }
            }
        }
    }

    private fun populate(profile: ProsumerProfile) {
        nicField.setText(profile.nic)
        fullNameField.setText(profile.fullName)
        emailField.setText(profile.email)
        phoneField.setText(profile.phoneNumber.orEmpty())
        addressField.setText(profile.address.orEmpty())
    }

    private fun saveProfile() {
        val fullName = fullNameField.text.toString().trim()
        val email = emailField.text.toString().trim()
        val phone = phoneField.text.toString().trim().takeIf { it.isNotBlank() }
        val address = addressField.text.toString().trim().takeIf { it.isNotBlank() }
        val validationMessage = validateRequired(fullName, "Full name") ?: validateRequired(email, "Email") ?: validateEmail(email)
        if (validationMessage != null) {
            showMessage(validationMessage)
            return
        }

        setLoading(true)
        repository.updateCurrent(UpdateProsumerRequest(fullName, email, phone, address)) { result ->
            setLoading(false)
            when (result) {
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Success -> {
                    setResult(RESULT_OK)
                    finish()
                }
                is com.example.smartsolarmicrogridtradingsystem.data.repository.ProsumerResult.Failure -> showMessage(result.message)
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        saveButton.isEnabled = !loading
        cancelButton.isEnabled = !loading
    }

    private fun showMessage(message: String) {
        messageView.text = message
        messageView.visibility = View.VISIBLE
    }
}
