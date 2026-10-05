package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.example.smartsolarmicrogridtradingsystem.R
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request.UpdateProsumerProfileRequestDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerProfileResponseDto
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.data.ProsumerAccountRepository
import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.util.ProsumerValidationUtil
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

/**
 * Activity for viewing and modifying own Prosumer account details,
 * and requesting account deactivation as specified in the assignment rubric.
 */
class ProsumerProfileActivity : AppCompatActivity() {

    private lateinit var sessionManager: SessionManager
    private val repository = ProsumerAccountRepository.getInstance()

    private lateinit var tvStatusBadge: TextView
    private lateinit var etNic: TextInputEditText
    private lateinit var tilName: TextInputLayout
    private lateinit var etName: TextInputEditText
    private lateinit var tilEmail: TextInputLayout
    private lateinit var etEmail: TextInputEditText
    private lateinit var tilPhone: TextInputLayout
    private lateinit var etPhone: TextInputEditText
    private lateinit var tilAddress: TextInputLayout
    private lateinit var etAddress: TextInputEditText

    private lateinit var tvMessage: TextView
    private lateinit var pbLoading: ProgressBar
    private lateinit var btnSave: MaterialButton
    private lateinit var btnDeactivate: MaterialButton
    private lateinit var btnLogout: MaterialButton

    private var currentAccountStatus: String = "Active"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_prosumer_profile)

        sessionManager = SessionManager(this)

        findViewById<MaterialToolbar>(R.id.toolbarProfile).setNavigationOnClickListener {
            finish()
        }

        initViews()
        loadProfileData()
        setupListeners()
    }

    private fun initViews() {
        tvStatusBadge = findViewById(R.id.tvProfileStatusBadge)
        etNic = findViewById(R.id.etProfileNic)
        tilName = findViewById(R.id.tilProfileName)
        etName = findViewById(R.id.etProfileName)
        tilEmail = findViewById(R.id.tilProfileEmail)
        etEmail = findViewById(R.id.etProfileEmail)
        tilPhone = findViewById(R.id.tilProfilePhone)
        etPhone = findViewById(R.id.etProfilePhone)
        tilAddress = findViewById(R.id.tilProfileAddress)
        etAddress = findViewById(R.id.etProfileAddress)

        tvMessage = findViewById(R.id.tvProfileMessage)
        pbLoading = findViewById(R.id.pbProfileLoading)
        btnSave = findViewById(R.id.btnSaveProfile)
        btnDeactivate = findViewById(R.id.btnDeactivateAccount)
        btnLogout = findViewById(R.id.btnLogoutProfile)
    }

    private fun loadProfileData() {
        setLoading(true)

        repository.getProfile(
            sessionManager.getToken(),
            object : ApiCallback<ProsumerProfileResponseDto> {

                override fun onSuccess(
                    result: NetworkResult.Success<ProsumerProfileResponseDto>
                ) {
                    setLoading(false)
                    val profile = result.responseBody
                    populateProfile(profile)
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    setLoading(false)

                    val errorMsg =
                        ProsumerAccountRepository.extractErrorMessage(error)

                    tvMessage.text = errorMsg
                    tvMessage.setTextColor(getColor(R.color.color_error))
                    tvMessage.visibility = View.VISIBLE
                }
            }
        )
    }

    private fun populateProfile(profile: ProsumerProfileResponseDto) {
        currentAccountStatus = profile.accountStatus

        etNic.setText(profile.nic)
        etName.setText(profile.fullName)
        etEmail.setText(profile.email)
        etPhone.setText(profile.phoneNumber.orEmpty())
        etAddress.setText(profile.address.orEmpty())

        val isDeactivated =
            profile.accountStatus.equals(
                "Deactivated",
                ignoreCase = true
            )

        val isDeactivationRequested =
            profile.accountStatus.equals(
                "DeactivationRequested",
                ignoreCase = true
            )

        if (isDeactivated) {
            tvStatusBadge.text = "Deactivated"
            tvStatusBadge.setBackgroundResource(
                R.drawable.bg_badge_cancelled
            )
            tvStatusBadge.setTextColor(
                getColor(R.color.status_cancelled)
            )

            // Deactivated accounts cannot modify their profile.
            etName.isEnabled = false
            etEmail.isEnabled = false
            etPhone.isEnabled = false
            etAddress.isEnabled = false

            tilName.isEnabled = false
            tilEmail.isEnabled = false
            tilPhone.isEnabled = false
            tilAddress.isEnabled = false

            btnSave.isEnabled = false
            btnSave.visibility = View.GONE

            btnDeactivate.isEnabled = false
            btnDeactivate.text = "Account Deactivated"

            tvMessage.text =
                "This account has been deactivated by administration. " +
                    "Profile updates and system activities are disabled."

            tvMessage.setTextColor(
                getColor(R.color.color_error)
            )
            tvMessage.visibility = View.VISIBLE

        } else if (isDeactivationRequested) {
            tvStatusBadge.text = "Deactivation Requested"
            tvStatusBadge.setBackgroundResource(
                R.drawable.bg_badge_neutral
            )
            tvStatusBadge.setTextColor(
                getColor(R.color.status_pending)
            )

            etName.isEnabled = true
            etEmail.isEnabled = true
            etPhone.isEnabled = true
            etAddress.isEnabled = true

            tilName.isEnabled = true
            tilEmail.isEnabled = true
            tilPhone.isEnabled = true
            tilAddress.isEnabled = true

            btnSave.isEnabled = true
            btnSave.visibility = View.VISIBLE

            btnDeactivate.isEnabled = false
            btnDeactivate.text = "Deactivation Requested"

            tvMessage.text =
                "Deactivation request is pending review by administration."

            tvMessage.setTextColor(
                getColor(R.color.status_pending)
            )
            tvMessage.visibility = View.VISIBLE

        } else {
            val displayStatus =
                if (
                    profile.accountStatus.equals(
                        "Active",
                        ignoreCase = true
                    ) ||
                    profile.accountStatus.isBlank()
                ) {
                    "Active"
                } else {
                    profile.accountStatus
                }

            tvStatusBadge.text = displayStatus
            tvStatusBadge.setBackgroundResource(
                R.drawable.bg_status_badge
            )
            tvStatusBadge.setTextColor(
                getColor(R.color.white)
            )

            etName.isEnabled = true
            etEmail.isEnabled = true
            etPhone.isEnabled = true
            etAddress.isEnabled = true

            tilName.isEnabled = true
            tilEmail.isEnabled = true
            tilPhone.isEnabled = true
            tilAddress.isEnabled = true

            btnSave.isEnabled = true
            btnSave.visibility = View.VISIBLE

            btnDeactivate.isEnabled = true
            btnDeactivate.text =
                getString(R.string.prosumer_deactivate_action)

            tvMessage.visibility = View.GONE
        }
    }

    private fun setupListeners() {

        btnSave.setOnClickListener {

            /*
             * Preserve the incoming dev-side defensive protection.
             *
             * The UI already disables/hides the Save button for a
             * deactivated account, but this prevents an update even if
             * the listener is somehow triggered.
             */
            if (
                currentAccountStatus.equals(
                    "Deactivated",
                    ignoreCase = true
                )
            ) {
                Toast.makeText(
                    this@ProsumerProfileActivity,
                    "Deactivated accounts cannot update their profile.",
                    Toast.LENGTH_SHORT
                ).show()

                return@setOnClickListener
            }

            /*
             * Preserve the validated Member 3 form-submission values.
             */
            val rawName =
                etName.text?.toString()?.trim().orEmpty()

            val rawEmail =
                etEmail.text?.toString()?.trim().orEmpty()

            val rawPhone =
                etPhone.text?.toString()?.trim().orEmpty()

            val rawAddress =
                etAddress.text?.toString()?.trim().orEmpty()

            // Clear previous validation errors.
            tilName.error = null
            tilEmail.error = null
            tilPhone.error = null
            tilAddress.error = null
            tvMessage.visibility = View.GONE

            var hasError = false

            /*
             * Full Name
             *
             * Required.
             * Minimum 2 characters.
             * Valid human-name characters enforced by
             * ProsumerValidationUtil.
             */
            if (rawName.isEmpty()) {
                tilName.error =
                    getString(R.string.error_name_required)

                hasError = true

            } else if (rawName.length < 2) {
                tilName.error =
                    getString(R.string.error_name_too_short)

                hasError = true

            } else if (
                !ProsumerValidationUtil.isValidFullName(rawName)
            ) {
                tilName.error =
                    getString(R.string.error_name_invalid)

                hasError = true
            }

            /*
             * Email
             *
             * Required and must be a valid email address.
             */
            if (rawEmail.isEmpty()) {
                tilEmail.error =
                    getString(R.string.error_email_required)

                hasError = true

            } else if (
                !ProsumerValidationUtil.isValidEmail(rawEmail)
            ) {
                tilEmail.error =
                    getString(R.string.error_email_invalid)

                hasError = true
            }

            /*
             * Phone
             *
             * Optional, but must be valid when supplied.
             */
            if (
                rawPhone.isNotEmpty() &&
                !ProsumerValidationUtil.isValidPhoneNumber(rawPhone)
            ) {
                tilPhone.error =
                    getString(R.string.error_phone_invalid)

                hasError = true
            }

            /*
             * Address
             *
             * Optional, but must satisfy the existing maximum
             * length validation when supplied.
             */
            if (
                rawAddress.isNotEmpty() &&
                !ProsumerValidationUtil.isValidAddress(rawAddress)
            ) {
                tilAddress.error =
                    getString(R.string.error_address_too_long)

                hasError = true
            }

            /*
             * CRITICAL:
             *
             * Invalid form data must never reach the repository/API.
             */
            if (hasError) {
                return@setOnClickListener
            }

            setLoading(true)

            val request =
                UpdateProsumerProfileRequestDto(
                    fullName = rawName,
                    email = rawEmail,
                    phoneNumber =
                        if (rawPhone.isBlank()) {
                            null
                        } else {
                            rawPhone
                        },
                    address =
                        if (rawAddress.isBlank()) {
                            null
                        } else {
                            rawAddress
                        }
                )

            repository.updateProfile(
                sessionManager.getToken(),
                request,
                object : ApiCallback<ProsumerProfileResponseDto> {

                    override fun onSuccess(
                        result:
                            NetworkResult.Success<ProsumerProfileResponseDto>
                    ) {
                        setLoading(false)

                        populateProfile(
                            result.responseBody
                        )

                        Toast.makeText(
                            this@ProsumerProfileActivity,
                            "Profile updated successfully!",
                            Toast.LENGTH_SHORT
                        ).show()
                    }

                    override fun onError(
                        error: NetworkResult<Nothing>
                    ) {
                        setLoading(false)

                        val errorMsg =
                            ProsumerAccountRepository
                                .extractErrorMessage(error)

                        tvMessage.text = errorMsg
                        tvMessage.setTextColor(
                            getColor(R.color.color_error)
                        )
                        tvMessage.visibility =
                            View.VISIBLE
                    }
                }
            )
        }

        btnDeactivate.setOnClickListener {

            if (
                currentAccountStatus.equals(
                    "Deactivated",
                    ignoreCase = true
                )
            ) {
                Toast.makeText(
                    this@ProsumerProfileActivity,
                    "This account is already deactivated.",
                    Toast.LENGTH_SHORT
                ).show()

                return@setOnClickListener
            }

            AlertDialog.Builder(this)
                .setTitle(
                    getString(
                        R.string.prosumer_deactivate_confirm_title
                    )
                )
                .setMessage(
                    getString(
                        R.string.prosumer_deactivate_confirm_msg
                    )
                )
                .setPositiveButton(
                    "Confirm Deactivation"
                ) { _, _ ->

                    setLoading(true)

                    repository.requestDeactivation(
                        sessionManager.getToken(),
                        object :
                            ApiCallback<ProsumerProfileResponseDto> {

                            override fun onSuccess(
                                result:
                                    NetworkResult.Success<
                                        ProsumerProfileResponseDto
                                    >
                            ) {
                                setLoading(false)

                                populateProfile(
                                    result.responseBody
                                )

                                Toast.makeText(
                                    this@ProsumerProfileActivity,
                                    "Deactivation requested. " +
                                        "Backoffice will review it.",
                                    Toast.LENGTH_LONG
                                ).show()
                            }

                            override fun onError(
                                error: NetworkResult<Nothing>
                            ) {
                                setLoading(false)

                                val errorMsg =
                                    ProsumerAccountRepository
                                        .extractErrorMessage(error)

                                tvMessage.text = errorMsg
                                tvMessage.setTextColor(
                                    getColor(
                                        R.color.color_error
                                    )
                                )
                                tvMessage.visibility =
                                    View.VISIBLE
                            }
                        }
                    )
                }
                .setNegativeButton(
                    "Cancel",
                    null
                )
                .show()
        }

        btnLogout.setOnClickListener {

            sessionManager.clearSession()

            val intent =
                Intent(
                    this,
                    AppLoginActivity::class.java
                ).apply {
                    flags =
                        Intent.FLAG_ACTIVITY_NEW_TASK or
                            Intent.FLAG_ACTIVITY_CLEAR_TASK
                }

            startActivity(intent)
            finish()
        }
    }

    private fun setLoading(loading: Boolean) {
        pbLoading.visibility =
            if (loading) {
                View.VISIBLE
            } else {
                View.GONE
            }

        btnSave.isEnabled = !loading
    }
}